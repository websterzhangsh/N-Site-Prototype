-- ============================================
-- Nestopia Platform Database Schema
-- Version: 1.0.0
-- Database: PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'customer',
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS '用户表 - 包括客户、销售、管理员';
COMMENT ON COLUMN users.role IS 'customer, sales, admin, partner';
COMMENT ON COLUMN users.status IS 'active, inactive, suspended';

-- ============================================
-- 2. PARTNERS TABLE
-- ============================================
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    company_name    VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    province        VARCHAR(50),
    city            VARCHAR(50),
    address         TEXT,
    partner_type    VARCHAR(50),
    commission_rate DECIMAL(5,2),
    contract_start  DATE,
    contract_end    DATE,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_partners_user ON partners(user_id);

COMMENT ON TABLE partners IS '合作伙伴/渠道商表';
COMMENT ON COLUMN partners.partner_type IS 'distributor, agent, dealer, referral';

-- ============================================
-- 3. CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
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
    site_type       VARCHAR(50),
    site_area       DECIMAL(10,2),
    site_photos     JSONB,
    site_notes      TEXT,
    source          VARCHAR(50),
    partner_id      UUID REFERENCES partners(id),
    assigned_sales  UUID REFERENCES users(id),
    tags            JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_partner_id ON customers(partner_id);
CREATE INDEX idx_customers_tags ON customers USING gin(tags);

COMMENT ON TABLE customers IS '客户信息表';
COMMENT ON COLUMN customers.site_type IS 'villa, townhouse, apartment, commercial';
COMMENT ON COLUMN customers.source IS 'website, referral, partner, exhibition, other';

-- ============================================
-- 4. PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    description     TEXT,
    parent_id       UUID REFERENCES product_categories(id),
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE product_categories IS '产品分类表';

-- ============================================
-- 5. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES product_categories(id),
    sku             VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    description     TEXT,
    description_en  TEXT,
    specs           JSONB,
    images          JSONB,
    videos          JSONB,
    documents       JSONB,
    status          VARCHAR(20) DEFAULT 'active',
    is_customizable BOOLEAN DEFAULT TRUE,
    meta_title      VARCHAR(200),
    meta_description TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_specs ON products USING gin(specs);

COMMENT ON TABLE products IS '产品目录表';
COMMENT ON COLUMN products.status IS 'active, inactive, discontinued';

-- ============================================
-- 6. PRICING TABLE
-- ============================================
CREATE TABLE pricing (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id) NOT NULL,
    base_price      DECIMAL(12,2) NOT NULL,
    price_unit      VARCHAR(20) DEFAULT 'per_sqm',
    currency        VARCHAR(3) DEFAULT 'CNY',
    min_area        DECIMAL(10,2),
    max_area        DECIMAL(10,2),
    pricing_rules   JSONB,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_product ON pricing(product_id);
CREATE INDEX idx_pricing_active ON pricing(is_active, effective_from);

COMMENT ON TABLE pricing IS '产品定价表';
COMMENT ON COLUMN pricing.price_unit IS 'per_sqm, per_unit, per_set';

-- ============================================
-- 7. DESIGNS TABLE
-- ============================================
CREATE TABLE designs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    product_id      UUID REFERENCES products(id),
    design_number   VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200),
    version         INTEGER DEFAULT 1,
    width           DECIMAL(10,2),
    depth           DECIMAL(10,2),
    height          DECIMAL(10,2),
    area            DECIMAL(10,2),
    options         JSONB,
    documents       JSONB,
    ai_prompt       TEXT,
    ai_renders      JSONB,
    quoted_price    DECIMAL(12,2),
    price_breakdown JSONB,
    status          VARCHAR(30) DEFAULT 'draft',
    submitted_at    TIMESTAMP,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    review_notes    TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_designs_customer ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_number ON designs(design_number);

COMMENT ON TABLE designs IS '设计方案表';
COMMENT ON COLUMN designs.status IS 'draft, submitted, reviewing, approved, rejected, revised';

-- ============================================
-- 8. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    design_id       UUID REFERENCES designs(id),
    order_number    VARCHAR(50) UNIQUE NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    discount        DECIMAL(12,2) DEFAULT 0,
    tax             DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    payment_plan    JSONB,
    shipping_address JSONB,
    shipping_method VARCHAR(50),
    shipping_fee    DECIMAL(10,2) DEFAULT 0,
    installation_address JSONB,
    installation_date DATE,
    installation_notes TEXT,
    contract_number VARCHAR(50),
    contract_url    VARCHAR(500),
    contract_signed_at TIMESTAMP,
    status          VARCHAR(30) DEFAULT 'pending',
    confirmed_at    TIMESTAMP,
    production_started_at TIMESTAMP,
    shipped_at      TIMESTAMP,
    delivered_at    TIMESTAMP,
    installed_at    TIMESTAMP,
    completed_at    TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancel_reason   TEXT,
    sales_rep_id    UUID REFERENCES users(id),
    partner_id      UUID REFERENCES partners(id),
    commission_rate DECIMAL(5,2),
    internal_notes  TEXT,
    customer_notes  TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at);

COMMENT ON TABLE orders IS '订单主表';
COMMENT ON COLUMN orders.status IS 'pending, confirmed, deposit_paid, in_production, quality_checked, shipped, delivered, installing, installed, completed, cancelled';

-- ============================================
-- 9. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) NOT NULL,
    product_id      UUID REFERENCES products(id) NOT NULL,
    product_snapshot JSONB,
    quantity        INTEGER DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    customization   JSONB,
    dimensions      JSONB,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

COMMENT ON TABLE order_items IS '订单明细表';

-- ============================================
-- 10. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) NOT NULL,
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    payment_number  VARCHAR(50) UNIQUE NOT NULL,
    payment_type    VARCHAR(30) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    payment_method  VARCHAR(30),
    transaction_id  VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    status          VARCHAR(20) DEFAULT 'pending',
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
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_number ON payments(payment_number);

COMMENT ON TABLE payments IS '支付记录表';
COMMENT ON COLUMN payments.payment_type IS 'deposit, second_payment, final_payment, full_payment';
COMMENT ON COLUMN payments.payment_method IS 'alipay, wechat, bank_transfer, credit_card, cash';
COMMENT ON COLUMN payments.status IS 'pending, processing, completed, failed, refunded, cancelled';

-- ============================================
-- 11. DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    doc_type        VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    file_url        VARCHAR(500) NOT NULL,
    file_type       VARCHAR(20),
    file_size       INTEGER,
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,
    status          VARCHAR(20) DEFAULT 'active',
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_type ON documents(doc_type);

COMMENT ON TABLE documents IS '文档管理表';
COMMENT ON COLUMN documents.entity_type IS 'customer, design, order, product';
COMMENT ON COLUMN documents.doc_type IS 'floor_plan, rendering, structural_drawing, installation_guide, contract, invoice, site_photo, completion_photo';

-- ============================================
-- 12. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    user_role       VARCHAR(20),
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    action          VARCHAR(50) NOT NULL,
    description     TEXT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

COMMENT ON TABLE activity_logs IS '操作日志表';
COMMENT ON COLUMN activity_logs.action IS 'create, update, delete, status_change, view';

-- ============================================
-- 13. SYSTEM CONFIGS TABLE
-- ============================================
CREATE TABLE system_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key      VARCHAR(100) UNIQUE NOT NULL,
    config_value    JSONB NOT NULL,
    description     TEXT,
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_configs IS '系统配置表';

-- ============================================
-- 14. VIEWS
-- ============================================

-- 订单汇总视图
CREATE VIEW v_order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total,
    o.created_at,
    c.name AS customer_name,
    c.phone AS customer_phone,
    p.company_name AS partner_name,
    u.email AS sales_email,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS paid_amount,
    o.total - COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS balance
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN users u ON o.sales_rep_id = u.id
LEFT JOIN payments pay ON o.id = pay.order_id
WHERE o.is_deleted = FALSE
GROUP BY o.id, c.name, c.phone, p.company_name, u.email;

-- 客户统计视图
CREATE VIEW v_customer_stats AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.source,
    COUNT(DISTINCT o.id) AS order_count,
    COALESCE(SUM(o.total), 0) AS total_spent,
    MAX(o.created_at) AS last_order_at,
    c.created_at AS registered_at
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.is_deleted = FALSE
WHERE c.is_deleted = FALSE
GROUP BY c.id;

-- ============================================
-- 15. SEED DATA
-- ============================================

-- 初始管理员用户
INSERT INTO users (email, password_hash, role, status)
VALUES ('admin@nestopia.com', crypt('admin123', gen_salt('bf')), 'admin', 'active');

-- 产品分类
INSERT INTO product_categories (name, name_en, sort_order) VALUES
('可伸缩阳光房', 'Retractable Sunroom', 1),
('固定阳光房', 'Fixed Sunroom', 2),
('智能阳光房', 'Smart Sunroom', 3),
('配件', 'Accessories', 4);

-- 系统配置
INSERT INTO system_configs (config_key, config_value, description, is_public) VALUES
('company_info', '{"name": "Nestopia", "phone": "400-888-9999", "email": "info@nestopia.com"}', '公司信息', true),
('payment_methods', '["alipay", "wechat", "bank_transfer"]', '支持的支付方式', true),
('order_status_flow', '["pending", "confirmed", "deposit_paid", "in_production", "shipped", "delivered", "installed", "completed"]', '订单状态流程', false);

-- ============================================
-- END OF SCHEMA
-- ============================================
