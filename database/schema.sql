-- ============================================
-- Nestopia Platform Database Schema
-- Version: 2.0.0
-- Database: PostgreSQL 14+
-- Updated: 2026-03-11
--
-- This file mirrors supabase/schema.sql for
-- non-Supabase deployments (e.g. Aliyun RDS).
-- Canonical source: supabase/schema.sql
--
-- Multi-tenancy: tenant_id on every business table
-- Isolation: RLS + composite unique constraints
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TENANTS TABLE (platform-level)
-- ============================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'deleted')),
    plan            VARCHAR(20) DEFAULT 'basic'
                    CHECK (plan IN ('basic', 'pro', 'enterprise')),
    contact_email   VARCHAR(100),
    contact_phone   VARCHAR(20),
    address         TEXT,
    ui_config       JSONB DEFAULT '{}'::jsonb,
    features        JSONB DEFAULT '["projects","orders","customers","products","ai_design","pricing","compliance","customer_service"]'::jsonb,
    max_projects    INTEGER DEFAULT 10,
    max_users       INTEGER DEFAULT 5,
    max_products    INTEGER DEFAULT 100,
    storage_quota_mb INTEGER DEFAULT 1024,
    custom_domain   VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

COMMENT ON TABLE tenants IS '租户表 - 平台级，每个合作伙伴/品牌一个租户';

-- ============================================
-- 2. USERS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(50),
    last_name       VARCHAR(50),
    phone           VARCHAR(20),
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('super_admin', 'admin', 'manager', 'sales', 'member')),
    permissions     JSONB DEFAULT '[]'::jsonb,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'pending')),
    email_verified  BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMP,
    login_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS '用户表 - 租户隔离，支持多角色';
COMMENT ON COLUMN users.role IS 'super_admin, admin, manager, sales, member';

-- ============================================
-- 3. PARTNERS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    company_name    VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    province        VARCHAR(50),
    city            VARCHAR(50),
    address         TEXT,
    partner_type    VARCHAR(50)
                    CHECK (partner_type IN ('distributor', 'agent', 'dealer', 'referral')),
    commission_rate DECIMAL(5,2),
    contract_start  DATE,
    contract_end    DATE,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_partners_tenant ON partners(tenant_id);
CREATE INDEX idx_partners_user ON partners(user_id);

COMMENT ON TABLE partners IS '合作伙伴/渠道商表 - 租户隔离';

-- ============================================
-- 4. CUSTOMERS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    customer_number VARCHAR(50),
    name            VARCHAR(100) NOT NULL,
    company         VARCHAR(200),
    email           VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    wechat          VARCHAR(50),
    province        VARCHAR(50),
    city            VARCHAR(50),
    district        VARCHAR(50),
    address         TEXT,
    postal_code     VARCHAR(10),
    site_type       VARCHAR(50)
                    CHECK (site_type IN ('villa', 'townhouse', 'apartment', 'commercial', 'other')),
    site_area       DECIMAL(10,2),
    site_photos     JSONB DEFAULT '[]'::jsonb,
    site_notes      TEXT,
    source          VARCHAR(50)
                    CHECK (source IN ('website', 'referral', 'partner', 'exhibition', 'social_media', 'phone', 'walk_in', 'other')),
    partner_id      UUID REFERENCES partners(id),
    assigned_sales  UUID REFERENCES users(id),
    customer_type   VARCHAR(20) DEFAULT 'standard'
                    CHECK (customer_type IN ('standard', 'vip', 'enterprise')),
    tags            JSONB DEFAULT '[]'::jsonb,
    notes           TEXT,
    satisfaction_score DECIMAL(3,1),
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'prospect', 'churned')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, customer_number)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_customers_partner ON customers(partner_id);
CREATE INDEX idx_customers_status ON customers(tenant_id, status);
CREATE INDEX idx_customers_tags ON customers USING gin(tags);

COMMENT ON TABLE customers IS '客户表 - 租户隔离，含场地信息和来源追踪';

-- ============================================
-- 5. PRODUCT CATEGORIES TABLE (tenant-scoped)
-- ============================================
CREATE TABLE product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    description     TEXT,
    parent_id       UUID REFERENCES product_categories(id),
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name, parent_id)
);

CREATE INDEX idx_prodcat_tenant ON product_categories(tenant_id);

COMMENT ON TABLE product_categories IS '产品分类 - 支持嵌套分类，租户隔离';

-- ============================================
-- 6. PRODUCTS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES product_categories(id),
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    description     TEXT,
    description_en  TEXT,
    specs           JSONB DEFAULT '{}'::jsonb,
    thumbnail_url   TEXT,
    images          JSONB DEFAULT '[]'::jsonb,
    videos          JSONB DEFAULT '[]'::jsonb,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'discontinued', 'draft')),
    is_customizable BOOLEAN DEFAULT TRUE,
    meta_title      VARCHAR(200),
    meta_description TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(tenant_id, status);
CREATE INDEX idx_products_specs ON products USING gin(specs);

COMMENT ON TABLE products IS '产品目录 - 租户隔离，SKU在租户内唯一';

-- ============================================
-- 7. PRODUCT FILES TABLE (tenant-scoped)
-- ============================================
CREATE TABLE product_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(20) NOT NULL
                    CHECK (file_type IN ('image', 'pdf', 'dwg', 'dxf', 'skp', 'obj', 'step', 'stl', 'video', 'document', 'other')),
    mime_type       VARCHAR(100),
    file_size_bytes BIGINT,
    file_url        TEXT NOT NULL,
    storage_path    TEXT,
    category        VARCHAR(50) DEFAULT 'general'
                    CHECK (category IN ('general', 'thumbnail', 'gallery', 'technical_drawing', 'cad_model', '3d_model', 'brochure', 'installation_guide', 'certification')),
    dimensions      JSONB,
    metadata        JSONB DEFAULT '{}'::jsonb,
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'processing', 'failed', 'archived')),
    processing_info JSONB,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_prodfiles_tenant ON product_files(tenant_id);
CREATE INDEX idx_prodfiles_product ON product_files(product_id);
CREATE INDEX idx_prodfiles_type ON product_files(file_type);

COMMENT ON TABLE product_files IS '产品文件 - 支持图片/PDF/CAD/3D模型上传和版本管理';

-- ============================================
-- 8. PRICING TABLE (tenant-scoped)
-- ============================================
CREATE TABLE pricing (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pricing_name    VARCHAR(100),
    pricing_type    VARCHAR(30) DEFAULT 'standard'
                    CHECK (pricing_type IN ('standard', 'promotional', 'partner', 'volume', 'custom')),
    base_price      DECIMAL(12,2) NOT NULL,
    price_unit      VARCHAR(20) DEFAULT 'per_sqm'
                    CHECK (price_unit IN ('per_sqm', 'per_unit', 'per_set', 'per_linear_m')),
    currency        VARCHAR(3) DEFAULT 'CNY',
    min_area        DECIMAL(10,2),
    max_area        DECIMAL(10,2),
    area_tiers      JSONB DEFAULT '[]'::jsonb,
    option_prices   JSONB DEFAULT '{}'::jsonb,
    discount_rules  JSONB DEFAULT '{}'::jsonb,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_tenant ON pricing(tenant_id);
CREATE INDEX idx_pricing_product ON pricing(tenant_id, product_id);
CREATE INDEX idx_pricing_active ON pricing(tenant_id, is_active, effective_from);

COMMENT ON TABLE pricing IS '产品定价规则 - 支持分层定价/选项加价/折扣规则';

-- ============================================
-- 9. COST COMPONENTS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE cost_components (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    component_name  VARCHAR(100) NOT NULL,
    component_type  VARCHAR(30) NOT NULL
                    CHECK (component_type IN ('material', 'labor', 'shipping', 'installation', 'permit', 'overhead', 'warranty', 'tax', 'other')),
    unit_cost       DECIMAL(12,2) NOT NULL,
    cost_unit       VARCHAR(20) DEFAULT 'per_sqm'
                    CHECK (cost_unit IN ('per_sqm', 'per_unit', 'per_set', 'per_hour', 'per_trip', 'fixed')),
    currency        VARCHAR(3) DEFAULT 'CNY',
    quantity_formula JSONB,
    is_variable     BOOLEAN DEFAULT TRUE,
    margin_percent  DECIMAL(5,2) DEFAULT 0,
    supplier_name   VARCHAR(200),
    supplier_sku    VARCHAR(100),
    lead_time_days  INTEGER,
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, product_id, component_name)
);

CREATE INDEX idx_costcomp_tenant ON cost_components(tenant_id);
CREATE INDEX idx_costcomp_product ON cost_components(tenant_id, product_id);
CREATE INDEX idx_costcomp_type ON cost_components(component_type);

COMMENT ON TABLE cost_components IS '成本构成 - 用于Pricing Agent成本分析和利润计算';

-- ============================================
-- 10. DESIGNS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE designs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    project_id      UUID REFERENCES projects(id),
    product_id      UUID REFERENCES products(id),
    design_number   VARCHAR(50),
    name            VARCHAR(200),
    version         INTEGER DEFAULT 1,
    width           DECIMAL(10,2),
    depth           DECIMAL(10,2),
    height          DECIMAL(10,2),
    area            DECIMAL(10,2),
    options         JSONB DEFAULT '{}'::jsonb,
    documents       JSONB DEFAULT '{}'::jsonb,
    ai_prompt       TEXT,
    ai_renders      JSONB DEFAULT '[]'::jsonb,
    ai_model_version VARCHAR(50),
    quoted_price    DECIMAL(12,2),
    price_breakdown JSONB,
    status          VARCHAR(30) DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'revised', 'archived')),
    submitted_at    TIMESTAMP,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    review_notes    TEXT,
    compliance_status VARCHAR(20) DEFAULT 'unchecked'
                    CHECK (compliance_status IN ('unchecked', 'checking', 'passed', 'failed', 'warning')),
    compliance_notes JSONB,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, design_number)
);

CREATE INDEX idx_designs_tenant ON designs(tenant_id);
CREATE INDEX idx_designs_customer ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(tenant_id, status);
CREATE INDEX idx_designs_number ON designs(design_number);

COMMENT ON TABLE designs IS '设计方案 - 关联客户/项目/产品，含AI渲染和合规检查';

-- ============================================
-- 11. PROJECTS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_number  VARCHAR(50),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    project_type    VARCHAR(50),
    project_subtype VARCHAR(50),
    customer_id     UUID REFERENCES customers(id),
    client_name     VARCHAR(100),
    client_email    VARCHAR(100),
    client_phone    VARCHAR(20),
    client_address  TEXT,
    budget_range    VARCHAR(50),
    preferred_timeline VARCHAR(50),
    square_meters   DECIMAL(10,2),
    attachments     JSONB DEFAULT '[]'::jsonb,
    assigned_to     UUID REFERENCES users(id),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, project_number)
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_projects_status ON projects(tenant_id, status);
CREATE INDEX idx_projects_customer ON projects(customer_id);

COMMENT ON TABLE projects IS '项目表 - 租户隔离，关联客户';

-- ============================================
-- 12. ORDERS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    project_id      UUID REFERENCES projects(id),
    design_id       UUID REFERENCES designs(id),
    order_number    VARCHAR(50),
    subtotal        DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_reason TEXT,
    tax_amount      DECIMAL(12,2) DEFAULT 0,
    shipping_fee    DECIMAL(10,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    payment_plan    JSONB DEFAULT '{}'::jsonb,
    shipping_address JSONB,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    installation_address JSONB,
    installation_date DATE,
    installation_notes TEXT,
    installation_team VARCHAR(100),
    contract_number VARCHAR(50),
    contract_url    VARCHAR(500),
    contract_signed_at TIMESTAMP,
    status          VARCHAR(30) DEFAULT 'pending'
                    CHECK (status IN (
                        'pending', 'confirmed', 'deposit_paid',
                        'in_production', 'quality_check',
                        'shipped', 'delivered',
                        'installing', 'installed',
                        'completed', 'cancelled', 'refunding', 'refunded'
                    )),
    confirmed_at            TIMESTAMP,
    deposit_paid_at         TIMESTAMP,
    production_started_at   TIMESTAMP,
    production_completed_at TIMESTAMP,
    quality_checked_at      TIMESTAMP,
    shipped_at              TIMESTAMP,
    delivered_at            TIMESTAMP,
    installed_at            TIMESTAMP,
    completed_at            TIMESTAMP,
    cancelled_at            TIMESTAMP,
    cancel_reason           TEXT,
    sales_rep_id    UUID REFERENCES users(id),
    partner_id      UUID REFERENCES partners(id),
    commission_rate DECIMAL(5,2),
    internal_notes  TEXT,
    customer_notes  TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_customer ON orders(tenant_id, customer_id);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(tenant_id, created_at);

COMMENT ON TABLE orders IS '订单主表 - 租户隔离，含3阶段付款和完整状态流';

-- ============================================
-- 13. ORDER ITEMS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) NOT NULL ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) NOT NULL,
    product_snapshot JSONB NOT NULL,
    quantity        INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    customization   JSONB DEFAULT '{}'::jsonb,
    dimensions      JSONB,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orderitems_tenant ON order_items(tenant_id);
CREATE INDEX idx_orderitems_order ON order_items(order_id);

COMMENT ON TABLE order_items IS '订单明细 - 含产品快照，防止价格变更影响历史订单';

-- ============================================
-- 14. PAYMENTS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) NOT NULL,
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    payment_number  VARCHAR(50),
    payment_type    VARCHAR(30) NOT NULL
                    CHECK (payment_type IN ('deposit', 'second_payment', 'final_payment', 'full_payment', 'refund', 'adjustment')),
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    payment_method  VARCHAR(30)
                    CHECK (payment_method IN ('alipay', 'wechat_pay', 'bank_transfer', 'credit_card', 'cash', 'other')),
    transaction_id  VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    due_date        DATE,
    paid_at         TIMESTAMP,
    refund_amount   DECIMAL(12,2),
    refund_reason   TEXT,
    refunded_at     TIMESTAMP,
    invoice_requested BOOLEAN DEFAULT FALSE,
    invoice_info    JSONB,
    invoice_url     VARCHAR(500),
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(tenant_id, status);

COMMENT ON TABLE payments IS '支付记录 - 支持多阶段付款和退款';

-- ============================================
-- 15. DOCUMENTS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL
                    CHECK (entity_type IN ('customer', 'design', 'order', 'product', 'project', 'partner')),
    entity_id       UUID NOT NULL,
    doc_type        VARCHAR(50) NOT NULL
                    CHECK (doc_type IN (
                        'floor_plan', 'rendering', 'structural_drawing',
                        'installation_guide', 'contract', 'invoice',
                        'site_photo', 'completion_photo', 'certificate',
                        'brochure', 'quotation', 'other'
                    )),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_type       VARCHAR(20),
    file_size_bytes BIGINT,
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'archived', 'deleted')),
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_docs_tenant ON documents(tenant_id);
CREATE INDEX idx_docs_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_docs_type ON documents(doc_type);

COMMENT ON TABLE documents IS '通用文档管理 - 多态关联到各业务实体';

-- ============================================
-- 16. AUDIT / ACTIVITY LOGS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id),
    user_role       VARCHAR(20),
    action          VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     UUID,
    description     TEXT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actlog_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_actlog_entity ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_actlog_user ON activity_logs(user_id);
CREATE INDEX idx_actlog_created ON activity_logs(created_at);

COMMENT ON TABLE activity_logs IS '操作日志 - 记录所有数据变更';

-- ============================================
-- 17. SYSTEM CONFIGS TABLE (tenant-scoped)
-- ============================================
CREATE TABLE system_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_key      VARCHAR(100) NOT NULL,
    config_value    JSONB NOT NULL,
    description     TEXT,
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, config_key)
);

CREATE INDEX idx_sysconfig_tenant ON system_configs(tenant_id);

COMMENT ON TABLE system_configs IS '系统配置 - 每租户独立配置';

-- ============================================
-- 18. VIEWS
-- ============================================

-- Order summary view (tenant-aware)
CREATE VIEW v_order_summary AS
SELECT
    o.id,
    o.tenant_id,
    o.order_number,
    o.status,
    o.total,
    o.currency,
    o.created_at,
    c.name AS customer_name,
    c.phone AS customer_phone,
    p.company_name AS partner_name,
    u.first_name || ' ' || u.last_name AS sales_rep_name,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS paid_amount,
    o.total - COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS balance
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN users u ON o.sales_rep_id = u.id
LEFT JOIN payments pay ON o.id = pay.order_id
WHERE o.is_deleted = FALSE
GROUP BY o.id, c.name, c.phone, p.company_name, u.first_name, u.last_name;

-- Customer stats view (tenant-aware)
CREATE VIEW v_customer_stats AS
SELECT
    c.id,
    c.tenant_id,
    c.customer_number,
    c.name,
    c.phone,
    c.email,
    c.customer_type,
    c.source,
    c.status,
    COUNT(DISTINCT o.id) AS order_count,
    COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled', 'refunded')), 0) AS total_spent,
    COUNT(DISTINCT prj.id) AS project_count,
    MAX(o.created_at) AS last_order_at,
    c.created_at AS registered_at
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.is_deleted = FALSE
LEFT JOIN projects prj ON c.id = prj.customer_id AND prj.is_deleted = FALSE
WHERE c.is_deleted = FALSE
GROUP BY c.id;

-- Product pricing view (tenant-aware)
CREATE VIEW v_product_pricing AS
SELECT
    p.id AS product_id,
    p.tenant_id,
    p.sku,
    p.name,
    p.status AS product_status,
    pc.name AS category_name,
    pr.id AS pricing_id,
    pr.pricing_name,
    pr.pricing_type,
    pr.base_price,
    pr.price_unit,
    pr.currency,
    pr.area_tiers,
    pr.option_prices,
    pr.effective_from,
    pr.effective_to,
    pr.is_active AS pricing_active,
    COUNT(pf.id) AS file_count
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN pricing pr ON p.id = pr.product_id AND pr.is_active = TRUE
    AND pr.effective_from <= CURRENT_DATE
    AND (pr.effective_to IS NULL OR pr.effective_to >= CURRENT_DATE)
LEFT JOIN product_files pf ON p.id = pf.product_id AND pf.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.id, pc.name, pr.id;

-- ============================================
-- 19. SEED DATA
-- ============================================

-- Default tenant
INSERT INTO tenants (slug, name, plan, contact_email, max_projects, max_users, max_products)
VALUES ('default', '默认租户', 'basic', 'admin@nestopia.com', 10, 5, 100);

-- Admin user
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, email_verified)
VALUES (
    (SELECT id FROM tenants WHERE slug = 'default'),
    'admin@nestopia.com',
    crypt('admin123', gen_salt('bf')),
    '超级',
    '管理员',
    'super_admin',
    'active',
    TRUE
);

-- Product categories
INSERT INTO product_categories (tenant_id, name, name_en, sort_order) VALUES
((SELECT id FROM tenants WHERE slug = 'default'), '可伸缩阳光房', 'Retractable Sunroom', 1),
((SELECT id FROM tenants WHERE slug = 'default'), '固定阳光房', 'Fixed Sunroom', 2),
((SELECT id FROM tenants WHERE slug = 'default'), '智能阳光房', 'Smart Sunroom', 3),
((SELECT id FROM tenants WHERE slug = 'default'), '配件与附件', 'Accessories', 4);

-- System configs
INSERT INTO system_configs (tenant_id, config_key, config_value, description, is_public) VALUES
((SELECT id FROM tenants WHERE slug = 'default'), 'company_info', '{"name": "Nestopia", "phone": "400-888-9999", "email": "info@nestopia.com"}'::jsonb, '公司信息', TRUE),
((SELECT id FROM tenants WHERE slug = 'default'), 'payment_methods', '["alipay", "wechat_pay", "bank_transfer"]'::jsonb, '支持的支付方式', TRUE),
((SELECT id FROM tenants WHERE slug = 'default'), 'order_status_flow', '["pending","confirmed","deposit_paid","in_production","quality_check","shipped","delivered","installing","installed","completed"]'::jsonb, '订单状态流程', FALSE),
((SELECT id FROM tenants WHERE slug = 'default'), 'supported_file_types', '{"products": ["image","pdf","dwg","dxf","skp","obj","step","stl"], "max_size_mb": 50}'::jsonb, '支持的上传文件类型', TRUE);

-- ============================================
-- END OF SCHEMA
-- Version: 2.0.0 | Tables: 17 | Views: 3
-- Canonical source: supabase/schema.sql
-- ============================================
