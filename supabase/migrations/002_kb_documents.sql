-- ============================================================
-- Migration 002: Knowledge Base Documents Table
-- Based on: docs/KB_STORAGE_DESIGN.md v1.0, §4
-- Date: 2026-04-08
-- Purpose:
--   1. Create kb_documents table (tenant + project scoped)
--   2. RLS policies for tenant isolation
--   3. Indexes for common query patterns
--   4. Triggers for updated_at + audit
--   5. Seed sample KB documents for Zip Blinds product line
-- ============================================================

-- ============================================================
-- 1. KB DOCUMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS kb_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- 层级归属
    scope           VARCHAR(20) NOT NULL DEFAULT 'tenant'
                    CHECK (scope IN ('tenant', 'project')),
                    -- 'tenant' = 租户级产品训练材料（全公司共享）
                    -- 'project' = 项目级客户专属文件

    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
                    -- scope='project' 时必填

    -- 产品线（scope='tenant' 时有效）
    product_line    VARCHAR(50)
                    CHECK (product_line IS NULL OR product_line IN (
                        'zip-blinds', 'sunroom', 'pergola', 'adu', 'general'
                    )),

    -- 文档分类
    category        VARCHAR(50) NOT NULL
                    CHECK (category IN (
                        -- 租户级分类
                        'manuals', 'specs', 'marketing', 'videos',
                        'compliance', 'training', 'sops', 'troubleshooting',
                        -- 项目级分类
                        'site-photos', 'site-videos', 'measurements',
                        'designs', 'quotations', 'contracts', 'completion',
                        'communications',
                        -- 通用
                        'other'
                    )),

    -- 文件信息
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    file_url        TEXT,
                    -- Phase 1: 可以是 public/kb/... 的相对路径或外部 URL
                    -- Phase 2: Supabase Storage 的公开/签名 URL
    file_type       VARCHAR(20) NOT NULL
                    CHECK (file_type IN (
                        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                        'jpg', 'jpeg', 'png', 'gif', 'webp',
                        'mp4', 'mov', 'avi', 'webm',
                        'dwg', 'dxf', 'skp', 'obj',
                        'json', 'csv', 'txt',
                        'other'
                    )),
    file_size_bytes BIGINT,
    mime_type       VARCHAR(100),
    storage_path    TEXT,
                    -- Supabase Storage bucket 内路径
                    -- e.g. '{tenant-id}/products/zip-blinds/manuals/...'

    -- 媒体元数据（图片/视频专用）
    media_metadata  JSONB DEFAULT '{}'::jsonb,
    /*
    图片: {"width": 4032, "height": 3024, "location": "Pool area", "tags": ["pool", "overview"]}
    视频: {"duration_seconds": 380, "resolution": "1080p", "thumbnail_url": "..."}
    PDF:  {"pages": 28, "toc": ["Chapter 1", "Chapter 2"]}
    */

    -- AI 处理状态
    status          VARCHAR(20) DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded', 'processing', 'indexed', 'failed')),
    ai_agents       TEXT[] DEFAULT '{}',
                    -- 关联的 AI Agent: 'designer', 'pricing', 'compliance', 'service', 'knowledge'
    tags            TEXT[] DEFAULT '{}',
                    -- 搜索标签: 'zb-100', 'installation', 'measurement', etc.
    embedding_id    UUID,
                    -- pgvector 嵌入引用（Phase 3）

    -- 工作流绑定（ZB_KB_KNOWLEDGE_AGENT_DESIGN.md §6.1）
    workflow_context TEXT[] DEFAULT '{}',
                    -- 在哪些工作流上下文中推送: 'consultation', 'measurement', 'quotation', 'configuration'
    display_context TEXT[] DEFAULT '{}',
                    -- 在哪些 UI 上下文中显示: 'measurement_panel', 'quotation_panel', 'agent_panel', 'kb_page'
    auto_generated  BOOLEAN DEFAULT FALSE,
                    -- 是否由工作流自动生成（量尺报告、定价明细、报价单 PDF）

    -- 版本控制
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES kb_documents(id),

    -- 审计
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE
);

-- 约束：scope='project' 时 project_id 必填
ALTER TABLE kb_documents ADD CONSTRAINT chk_project_scope
    CHECK (scope != 'project' OR project_id IS NOT NULL);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_kb_tenant ON kb_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_scope ON kb_documents(scope, tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_project ON kb_documents(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_product_line ON kb_documents(product_line) WHERE product_line IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_category ON kb_documents(category);
CREATE INDEX IF NOT EXISTS idx_kb_status ON kb_documents(status);
CREATE INDEX IF NOT EXISTS idx_kb_file_type ON kb_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON kb_documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_kb_ai_agents ON kb_documents USING gin(ai_agents);
CREATE INDEX IF NOT EXISTS idx_kb_workflow_ctx ON kb_documents USING gin(workflow_context);
CREATE INDEX IF NOT EXISTS idx_kb_not_deleted ON kb_documents(tenant_id, is_deleted) WHERE is_deleted = FALSE;

COMMENT ON TABLE kb_documents IS 'KB 文档元数据 - 双层（租户级 + 项目级）知识库，支持 AI Agent 路由和 RAG 检索';
COMMENT ON COLUMN kb_documents.scope IS 'tenant = 产品训练材料（全公司）, project = 客户专属文件';
COMMENT ON COLUMN kb_documents.workflow_context IS '工作流上下文推送: consultation, measurement, quotation, configuration';
COMMENT ON COLUMN kb_documents.ai_agents IS '关联 AI Agent: designer, pricing, compliance, service, knowledge';

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

-- 基础策略：租户隔离 + super_admin 穿透
CREATE POLICY rls_kb_documents ON kb_documents FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_super_admin());

-- 项目级文件细粒度控制（未来可扩展为项目成员级别）
-- 当前阶段与租户隔离策略一致，Phase 3 可替换为：
-- CREATE POLICY rls_kb_project_files ON kb_documents FOR SELECT
--     USING (scope = 'tenant' OR project_id IN (
--         SELECT project_id FROM project_members WHERE user_id = auth.uid()
--     ));

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE TRIGGER trg_kb_documents_updated BEFORE UPDATE ON kb_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging
CREATE TRIGGER audit_kb_documents AFTER INSERT OR UPDATE OR DELETE ON kb_documents
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================
-- 5. HELPER VIEW: KB Dashboard Stats
-- ============================================================

CREATE OR REPLACE VIEW v_kb_stats AS
SELECT
    kd.tenant_id,
    COUNT(*) FILTER (WHERE kd.is_deleted = FALSE) AS total_documents,
    COUNT(*) FILTER (WHERE kd.status = 'indexed' AND kd.is_deleted = FALSE) AS indexed_count,
    COUNT(*) FILTER (WHERE kd.status = 'processing' AND kd.is_deleted = FALSE) AS processing_count,
    COUNT(*) FILTER (WHERE kd.status = 'uploaded' AND kd.is_deleted = FALSE) AS pending_count,
    COUNT(*) FILTER (WHERE kd.status = 'failed' AND kd.is_deleted = FALSE) AS failed_count,
    COUNT(*) FILTER (WHERE kd.scope = 'tenant' AND kd.is_deleted = FALSE) AS tenant_docs,
    COUNT(*) FILTER (WHERE kd.scope = 'project' AND kd.is_deleted = FALSE) AS project_docs,
    COUNT(*) FILTER (WHERE kd.file_type IN ('mp4', 'mov', 'avi', 'webm') AND kd.is_deleted = FALSE) AS video_count,
    COUNT(DISTINCT kd.project_id) FILTER (WHERE kd.scope = 'project' AND kd.is_deleted = FALSE) AS projects_with_files,
    COALESCE(SUM(kd.file_size_bytes) FILTER (WHERE kd.is_deleted = FALSE), 0) AS total_size_bytes
FROM kb_documents kd
GROUP BY kd.tenant_id;

COMMENT ON VIEW v_kb_stats IS 'KB 仪表板统计视图 - 按租户聚合文档数量和状态';

-- ============================================================
-- 6. SEED DATA: Zip Blinds Product Knowledge Base (20 docs)
-- ============================================================

-- 注意：这些 seed data 的 file_url 指向 public/kb/ 下的占位文件或外部链接
-- Phase 2 迁移到 Supabase Storage 后，file_url 会更新为 Storage URL

INSERT INTO kb_documents (
    tenant_id, scope, product_line, category, name, description,
    file_type, file_size_bytes, status, ai_agents, tags,
    workflow_context, display_context
) VALUES
-- === Product Specifications ===
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'specs',
    'ZB-100 Standard Series Spec Sheet',
    'Complete specifications for ZB-100 Standard Series including dimensions, materials, and performance ratings',
    'pdf', 2202009, 'uploaded',
    ARRAY['designer', 'service'],
    ARRAY['zb-100', 'standard', 'specs'],
    ARRAY['consultation', 'configuration'],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'specs',
    'ZB-200 Professional Series Spec Sheet',
    'Complete specifications for ZB-200 Professional Series with enhanced wind resistance and motor options',
    'pdf', 2516582, 'uploaded',
    ARRAY['designer', 'service'],
    ARRAY['zb-200', 'professional', 'specs'],
    ARRAY['consultation', 'configuration'],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'specs',
    'ZB-300 Elite Series Spec Sheet',
    'Premium specifications for ZB-300 Elite Series with smart home integration and hurricane-rated options',
    'pdf', 2936012, 'uploaded',
    ARRAY['designer', 'service'],
    ARRAY['zb-300', 'elite', 'specs'],
    ARRAY['consultation', 'configuration'],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'specs',
    'Fabric Options Catalog (NP-4000/6000/8000)',
    'Complete fabric catalog with UV ratings, transparency levels, colors, and pricing by series',
    'pdf', 5242880, 'uploaded',
    ARRAY['designer', 'service'],
    ARRAY['fabric', 'catalog', 'np-4000', 'np-6000', 'np-8000'],
    ARRAY['consultation', 'configuration'],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'specs',
    'Drive System Comparison Chart',
    'Side-by-side comparison of manual crank, tubular motor, and smart motor drive systems',
    'pdf', 1048576, 'uploaded',
    ARRAY['designer'],
    ARRAY['drive-system', 'motor', 'comparison'],
    ARRAY['configuration'],
    ARRAY['kb_page', 'agent_panel']
),
-- === Measurement Guides ===
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'sops',
    'OMEYA SOP S1B: Site Measurement Method',
    'Standard operating procedure for on-site measurement including 3-point method and obstacle documentation',
    'pdf', 3145728, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['measurement', 'sop', 'omeya', 's1b'],
    ARRAY['measurement'],
    ARRAY['measurement_panel', 'kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'training',
    'Inside Mount vs Face Mount Decision Guide',
    'Decision tree and visual guide for choosing between inside mount (recess) and face mount installations',
    'pdf', 1572864, 'uploaded',
    ARRAY['knowledge', 'designer'],
    ARRAY['mount-type', 'inside-mount', 'face-mount', 'decision-guide'],
    ARRAY['measurement'],
    ARRAY['measurement_panel', 'kb_page']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'training',
    '3-Point Measurement Reference Card',
    'Quick reference card for the 3-point measurement method: width (top/middle/bottom) and height (left/center/right)',
    'pdf', 524288, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['3-point', 'measurement', 'reference-card'],
    ARRAY['measurement'],
    ARRAY['measurement_panel', 'kb_page']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'videos',
    'How to Measure for Zip Blinds',
    'Field training video demonstrating proper measurement technique for zip blind installations',
    'mp4', 29360128, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['measurement', 'training-video', 'field-guide'],
    ARRAY['measurement'],
    ARRAY['measurement_panel', 'kb_page', 'agent_panel']
),
-- === Pricing & Sales ===
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'marketing',
    'Zip Blinds 6-Strategy Pricing Model',
    'Comprehensive pricing model document covering 6 strategies: cost-plus, competitive, value-based, tiered, bundle, seasonal',
    'pdf', 2097152, 'uploaded',
    ARRAY['pricing'],
    ARRAY['pricing', 'model', '6-strategy'],
    ARRAY['quotation'],
    ARRAY['quotation_panel', 'kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'marketing',
    'Competitive Comparison Matrix',
    'Feature-by-feature comparison with competing zip blind brands in the US market',
    'pdf', 1048576, 'uploaded',
    ARRAY['pricing', 'service'],
    ARRAY['competitive', 'comparison', 'market-analysis'],
    ARRAY['quotation', 'consultation'],
    ARRAY['quotation_panel', 'kb_page']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'marketing',
    'Dealer Price List (Confidential)',
    'Wholesale pricing for authorized dealers - CONFIDENTIAL, not for customer distribution',
    'xlsx', 524288, 'uploaded',
    ARRAY['pricing'],
    ARRAY['dealer', 'wholesale', 'price-list', 'confidential'],
    ARRAY['quotation'],
    ARRAY['quotation_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'marketing',
    'Sales Pitch Deck - Residential',
    'Customer-facing presentation deck for residential zip blind sales consultations',
    'pptx', 8388608, 'uploaded',
    ARRAY['service'],
    ARRAY['sales', 'pitch', 'residential', 'presentation'],
    ARRAY['consultation'],
    ARRAY['kb_page']
),
-- === Installation & Training ===
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'manuals',
    'OMEYA Blind Installation SOP (Complete)',
    'Full standard operating procedure for zip blind installation covering all mount types and configurations',
    'pdf', 7340032, 'uploaded',
    ARRAY['knowledge', 'service'],
    ARRAY['installation', 'sop', 'omeya', 'complete'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'videos',
    'Face Mount Installation Tutorial',
    'Step-by-step video tutorial for face mount zip blind installation',
    'mp4', 47185920, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['installation', 'face-mount', 'tutorial', 'video'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'videos',
    'Ceiling Mount Installation Tutorial',
    'Step-by-step video tutorial for ceiling/soffit mount zip blind installation',
    'mp4', 33554432, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['installation', 'ceiling-mount', 'tutorial', 'video'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'videos',
    'Motor Wiring & Commissioning',
    'Technical video covering motor wiring, limit setting, and smart control commissioning',
    'mp4', 62914560, 'uploaded',
    ARRAY['knowledge'],
    ARRAY['motor', 'wiring', 'commissioning', 'technical'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
-- === Compliance ===
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'compliance',
    'US Wind Load Requirements by Zone',
    'Wind load rating requirements for outdoor blinds by US geographic zone (ASCE 7)',
    'pdf', 3145728, 'uploaded',
    ARRAY['compliance'],
    ARRAY['wind-load', 'compliance', 'asce-7', 'us-zones'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'compliance',
    'Child Safety Cord/Chain Standards',
    'Regulatory requirements for child safety mechanisms in corded/chained blind products (CPSC, ANSI/WCMA)',
    'pdf', 1048576, 'uploaded',
    ARRAY['compliance'],
    ARRAY['child-safety', 'cord', 'chain', 'cpsc', 'ansi'],
    ARRAY[]::text[],
    ARRAY['kb_page', 'agent_panel']
),
(
    (SELECT id FROM tenants WHERE slug = 'default'),
    'tenant', 'zip-blinds', 'compliance',
    'Singapore SS 692:2020 Blinds Safety',
    'Singapore national standard for safety requirements of internal and external blinds',
    'pdf', 2097152, 'uploaded',
    ARRAY['compliance'],
    ARRAY['singapore', 'ss-692', 'safety', 'standard'],
    ARRAY[]::text[],
    ARRAY['kb_page']
);

-- ============================================================
-- END OF MIGRATION 002
-- New Tables: 1 (kb_documents)
-- New Views: 1 (v_kb_stats)
-- Seed Data: 20 Zip Blinds KB documents
-- ============================================================
