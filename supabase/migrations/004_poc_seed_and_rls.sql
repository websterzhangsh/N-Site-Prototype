-- ============================================================
-- Migration 004: POC 种子数据 + 匿名访问 RLS 策略
-- Date: 2026-04-08
-- Purpose:
--   1. 创建 Demo 租户（使用前端代码中的固定 UUID）
--   2. 添加 POC 阶段匿名访问 RLS 策略（Phase 3 Auth 接入后移除）
--   3. 创建测试项目 + 客户，用于文件上传端到端测试
--   4. 将 002 迁移中的 KB 文档重新关联到 Demo 租户
--
-- ⚠️ 安全说明：
--   本文件中标记 [POC-ONLY] 的策略仅用于开发/演示阶段，
--   生产环境部署前 **必须移除** 并替换为 Auth-based 策略。
-- ============================================================

-- ============================================================
-- 1. DEMO TENANT（固定 UUID，匹配前端 defaultTenantId）
-- ============================================================

-- 先检查是否已存在同 slug 的租户
DO $$
BEGIN
    -- 如果 'default' tenant 存在但 ID 不匹配，更新它
    IF EXISTS (SELECT 1 FROM tenants WHERE slug = 'default' AND id != '550e8400-e29b-41d4-a716-446655440000') THEN
        -- 删除旧 tenant（CASCADE 会清理所有关联数据）
        DELETE FROM tenants WHERE slug = 'default';
    END IF;
END $$;

INSERT INTO tenants (id, slug, name, status, plan, contact_email, contact_phone, address,
    ui_config, features, max_projects, max_users, max_products, storage_quota_mb)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'default',
    'Nestopia Demo',
    'active',
    'pro',
    'demo@nestopia.com',
    '400-888-9999',
    'San Francisco, CA (Demo)',
    '{
        "primaryColor": "#222222",
        "logoUrl": null,
        "faviconUrl": null,
        "customCss": null,
        "hiddenSections": [],
        "customSections": []
    }'::jsonb,
    '["projects","orders","customers","products","ai_design","pricing","compliance","customer_service","kb"]'::jsonb,
    50, 10, 200, 5120
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan = EXCLUDED.plan;

-- 重新插入 super admin 用户
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, email_verified)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@nestopia.com',
    crypt('admin123', gen_salt('bf')),
    'Demo',
    'Admin',
    'super_admin',
    'active',
    TRUE
)
ON CONFLICT DO NOTHING;

-- 重新插入产品分类
INSERT INTO product_categories (tenant_id, name, name_en, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440000', '可伸缩阳光房', 'Retractable Sunroom', 1),
('550e8400-e29b-41d4-a716-446655440000', '固定阳光房', 'Fixed Sunroom', 2),
('550e8400-e29b-41d4-a716-446655440000', '智能阳光房', 'Smart Sunroom', 3),
('550e8400-e29b-41d4-a716-446655440000', '配件与附件', 'Accessories', 4)
ON CONFLICT DO NOTHING;

-- 重新插入系统配置
INSERT INTO system_configs (tenant_id, config_key, config_value, description, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'company_info', '{"name": "Nestopia", "phone": "400-888-9999", "email": "info@nestopia.com"}'::jsonb, '公司信息', TRUE),
('550e8400-e29b-41d4-a716-446655440000', 'supported_file_types', '{"products": ["image","pdf","dwg","dxf","skp","obj","step","stl"], "max_size_mb": 50}'::jsonb, '支持的上传文件类型', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. [POC-ONLY] 匿名访问 RLS 策略
-- ============================================================
-- 允许 anon 角色访问 Demo 租户的数据（Phase 3 移除）
-- 使用 DO $$ ... EXCEPTION 避免重复运行时报错

-- tenants 表: anon 可读取 Demo 租户
DO $$ BEGIN
CREATE POLICY poc_anon_tenant_read ON tenants
    FOR SELECT TO anon
    USING (id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- kb_documents 表: anon 可完全操作 Demo 租户的文档
DO $$ BEGIN
CREATE POLICY poc_anon_kb_all ON kb_documents
    FOR ALL TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000')
    WITH CHECK (tenant_id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- projects 表: anon 可完全操作 Demo 租户的项目
DO $$ BEGIN
CREATE POLICY poc_anon_projects_all ON projects
    FOR ALL TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000')
    WITH CHECK (tenant_id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- customers 表: anon 可读取 Demo 租户的客户
DO $$ BEGIN
CREATE POLICY poc_anon_customers_read ON customers
    FOR SELECT TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users 表: anon 可读取 Demo 租户的用户
DO $$ BEGIN
CREATE POLICY poc_anon_users_read ON users
    FOR SELECT TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- product_categories 表: anon 可读取
DO $$ BEGIN
CREATE POLICY poc_anon_prodcat_read ON product_categories
    FOR SELECT TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- system_configs 表: anon 可读取公开配置
DO $$ BEGIN
CREATE POLICY poc_anon_sysconfig_read ON system_configs
    FOR SELECT TO anon
    USING (tenant_id = '550e8400-e29b-41d4-a716-446655440000' AND is_public = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. 测试客户（列名匹配 schema.sql 中的 customers 表定义）
-- ============================================================

INSERT INTO customers (id, tenant_id, name, company, email, phone, address, status, source, tags)
VALUES
(
    'a0000001-0001-0001-0001-000000000001'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'Michael Johnson',
    'Johnson Residence',
    'michael.johnson@email.com',
    '(415) 555-0101',
    '123 Pacific Heights Blvd, San Francisco, CA 94115',
    'active',
    'referral',
    '["residential", "premium"]'::jsonb
),
(
    'a0000001-0001-0001-0001-000000000002'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'Sarah Chen',
    'Bay Area Modern Homes',
    'sarah.chen@bayareamodern.com',
    '(415) 555-0202',
    '456 Marina Blvd, San Francisco, CA 94123',
    'active',
    'website',
    '["commercial", "repeat-customer"]'::jsonb
),
(
    'a0000001-0001-0001-0001-000000000003'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'David Park',
    'Coastal Living Design Studio',
    'david@coastalliving.design',
    '(650) 555-0303',
    '789 El Camino Real, Palo Alto, CA 94301',
    'active',
    'exhibition',
    '["designer", "b2b"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. 测试项目（列名匹配 schema.sql 中的 projects 表定义）
-- ============================================================

INSERT INTO projects (id, tenant_id, customer_id, title, description, status, project_type,
    client_name, client_phone, client_address, created_by)
VALUES
(
    'b0000001-0001-0001-0001-000000000001'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'a0000001-0001-0001-0001-000000000001',
    'Johnson Residence — Sunroom + Zip Blinds',
    'Premium residential project: retractable sunroom with integrated zip blinds',
    'in_progress',
    'residential',
    'Michael Johnson',
    '(415) 555-0101',
    '123 Pacific Heights Blvd, San Francisco, CA 94115',
    (SELECT id FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000' AND role = 'super_admin' LIMIT 1)
),
(
    'b0000001-0001-0001-0001-000000000002'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'a0000001-0001-0001-0001-000000000002',
    'Bay Area Office — Exterior Shading System',
    'Commercial project: large-scale exterior zip blind installation',
    'pending',
    'commercial',
    'Sarah Chen',
    '(415) 555-0202',
    '456 Marina Blvd, San Francisco, CA 94123',
    (SELECT id FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000' AND role = 'super_admin' LIMIT 1)
),
(
    'b0000001-0001-0001-0001-000000000003'::UUID,
    '550e8400-e29b-41d4-a716-446655440000',
    'a0000001-0001-0001-0001-000000000003',
    'Coastal Living — Showroom Display',
    'B2B showroom project: display models for Coastal Living Design Studio',
    'in_progress',
    'commercial',
    'David Park',
    '(650) 555-0303',
    '789 El Camino Real, Palo Alto, CA 94301',
    (SELECT id FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000' AND role = 'super_admin' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. 重新插入 KB 文档（关联到 Demo 租户）
-- ============================================================
-- 如果 002 迁移中的 KB 文档被 CASCADE 删除，重新插入核心文档

-- 插入核心示例（仅当该租户下没有 KB 文档时）
INSERT INTO kb_documents (tenant_id, scope, product_line, category, name, description,
    file_type, file_size_bytes, status, ai_agents, tags, workflow_context, display_context)
SELECT * FROM (VALUES
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'tenant', 'zip-blinds', 'specs',
     'ZB-100 Standard Series Spec Sheet',
     'Complete specifications for ZB-100 Standard Series including dimensions, materials, and performance ratings',
     'pdf', 2202009, 'uploaded',
     ARRAY['designer', 'service'], ARRAY['zb-100', 'standard', 'specs'],
     ARRAY['consultation', 'configuration'], ARRAY['kb_page', 'agent_panel']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'tenant', 'zip-blinds', 'specs',
     'ZB-200 Professional Series Spec Sheet',
     'Complete specifications for ZB-200 Professional Series with enhanced wind resistance and motor options',
     'pdf', 2516582, 'uploaded',
     ARRAY['designer', 'service'], ARRAY['zb-200', 'professional', 'specs'],
     ARRAY['consultation', 'configuration'], ARRAY['kb_page', 'agent_panel']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'tenant', 'zip-blinds', 'manuals',
     'Zip Blinds Installation Manual v3.2',
     'Comprehensive installation guide covering face mount, ceiling mount, and recess mount methods',
     'pdf', 8388608, 'uploaded',
     ARRAY['knowledge', 'service'], ARRAY['installation', 'manual', 'v3.2'],
     ARRAY['installation'], ARRAY['kb_page', 'agent_panel']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'tenant', 'zip-blinds', 'videos',
     'Face Mount Installation Tutorial',
     'Step-by-step video tutorial for face mount zip blind installation',
     'mp4', 47185920, 'uploaded',
     ARRAY['knowledge'], ARRAY['installation', 'face-mount', 'tutorial', 'video'],
     ARRAY[]::text[], ARRAY['kb_page', 'agent_panel']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'tenant', 'zip-blinds', 'compliance',
     'US Wind Load Requirements by Zone',
     'Wind load rating requirements for outdoor blinds by US geographic zone (ASCE 7)',
     'pdf', 3145728, 'uploaded',
     ARRAY['compliance'], ARRAY['wind-load', 'compliance', 'asce-7', 'us-zones'],
     ARRAY[]::text[], ARRAY['kb_page', 'agent_panel'])
) AS v(tenant_id, scope, product_line, category, name, description, file_type, file_size_bytes, status, ai_agents, tags, workflow_context, display_context)
WHERE NOT EXISTS (
    SELECT 1 FROM kb_documents WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1
);

-- ============================================================
-- 6. 项目级测试文件元数据（模拟已上传的项目文件）
-- ============================================================

INSERT INTO kb_documents (tenant_id, scope, project_id, category, name, description,
    file_type, file_size_bytes, status, tags)
SELECT * FROM (VALUES
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'project',
     'b0000001-0001-0001-0001-000000000001'::UUID, 'site-photos',
     'front-elevation-photo.jpg',
     'Front elevation photo of Johnson residence showing installation area',
     'jpg', 4194304, 'uploaded',
     ARRAY['site-photo', 'elevation', 'front']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'project',
     'b0000001-0001-0001-0001-000000000001'::UUID, 'measurements',
     'window-measurements-v1.pdf',
     'Initial site measurement report for all 6 window openings',
     'pdf', 1048576, 'uploaded',
     ARRAY['measurement', 'windows', 'v1']),
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'project',
     'b0000001-0001-0001-0001-000000000001'::UUID, 'quotations',
     'quote-JR-2026-001.pdf',
     'Formal quotation for Johnson Residence project — 6x ZB-200 + 1x Sunroom',
     'pdf', 524288, 'uploaded',
     ARRAY['quotation', 'formal', 'zb-200'])
) AS v(tenant_id, scope, project_id, category, name, description, file_type, file_size_bytes, status, tags)
WHERE NOT EXISTS (
    SELECT 1 FROM kb_documents
    WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000'
      AND scope = 'project'
    LIMIT 1
);

-- ============================================================
-- VERIFICATION QUERIES (运行后检查)
-- ============================================================
-- SELECT id, slug, name, plan FROM tenants WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- SELECT COUNT(*) as kb_count FROM kb_documents WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
-- SELECT id, name, status FROM projects WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
-- SELECT id, company_name, contact_name FROM customers WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================================
-- END OF MIGRATION 004
-- Demo Tenant: 550e8400-e29b-41d4-a716-446655440000
-- POC RLS Policies: 7 (all [POC-ONLY], remove before production)
-- Test Customers: 3
-- Test Projects: 3
-- KB Documents: 5 tenant-level + 3 project-level (if fresh install)
-- ============================================================
