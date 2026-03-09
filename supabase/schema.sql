-- ============================================================
-- 多租户系统数据库 Schema
-- 适用于 Supabase PostgreSQL
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 租户表 (Tenants)
-- ============================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),

    -- 联系信息
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,

    -- UI 定制配置
    ui_config JSONB DEFAULT '{
        "primaryColor": "#222222",
        "logoUrl": null,
        "faviconUrl": null,
        "customCss": null,
        "hiddenSections": [],
        "customSections": []
    }'::jsonb,

    -- 功能开关
    features JSONB DEFAULT '["projects", "orders", "customers", "ai_design"]'::jsonb,

    -- 配额限制
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 5,
    storage_quota_mb INTEGER DEFAULT 1024,

    -- 自定义域名 (可选)
    custom_domain VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 租户 slug 索引
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================================
-- 2. 用户表 (Users)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- 认证信息
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash

    -- 个人信息
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url TEXT,

    -- 角色权限
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'manager', 'member')),
    permissions JSONB DEFAULT '[]'::jsonb,

    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,

    -- 登录记录
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    login_count INTEGER DEFAULT 0,

    -- 密码重置
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

-- 用户索引
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 3. 登录会话表 (User Sessions)
-- ============================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) NOT NULL,  -- JWT token hash
    refresh_token_hash VARCHAR(255),

    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,

    ip_address INET,
    user_agent TEXT,
    device_info JSONB,

    is_valid BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_tenant_id ON user_sessions(tenant_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at) WHERE is_valid = TRUE;

-- ============================================================
-- 4. 审计日志表 (Audit Logs)
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(50) NOT NULL,  -- login, logout, create, update, delete, etc.
    resource_type VARCHAR(50),    -- project, order, user, etc.
    resource_id UUID,

    details JSONB,                -- 变更详情
    old_values JSONB,             -- 变更前的值
    new_values JSONB,             -- 变更后的值

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- 5. 业务数据表 - 项目 (Projects)
-- ============================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- 项目信息
    project_number VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),

    -- 项目类型
    project_type VARCHAR(50),  -- sunroom, pavilion, shutter
    project_subtype VARCHAR(50),  -- residential, commercial, pool, etc.

    -- 客户信息
    client_name VARCHAR(100),
    client_email VARCHAR(100),
    client_phone VARCHAR(20),
    client_address TEXT,

    -- 项目详情
    budget_range VARCHAR(50),
    preferred_timeline VARCHAR(50),
    square_meters DECIMAL(10, 2),

    -- 附件
    attachments JSONB DEFAULT '[]'::jsonb,

    -- 分配
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),

    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_project_type ON projects(project_type);

-- 项目编号生成函数
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.project_number = 'PRJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(NEW.id::text), 1, 6);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_number
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_project_number();

-- ============================================================
-- 6. 业务数据表 - 订单 (Orders)
-- ============================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),

    order_number VARCHAR(50) UNIQUE,

    -- 订单状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered', 'installed', 'completed', 'cancelled')),

    -- 金额信息
    total_amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'CNY',

    -- 付款阶段
    deposit_amount DECIMAL(12, 2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_at TIMESTAMPTZ,

    second_payment_amount DECIMAL(12, 2),
    second_payment_paid BOOLEAN DEFAULT FALSE,
    second_payment_paid_at TIMESTAMPTZ,

    final_payment_amount DECIMAL(12, 2),
    final_payment_paid BOOLEAN DEFAULT FALSE,
    final_payment_paid_at TIMESTAMPTZ,

    -- 生产信息
    production_started_at TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,

    -- 物流信息
    shipped_at TIMESTAMPTZ,
    tracking_number VARCHAR(100),
    delivered_at TIMESTAMPTZ,

    -- 安装信息
    installed_at TIMESTAMPTZ,
    installation_notes TEXT,

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_project_id ON orders(project_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);

-- 订单编号生成函数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(NEW.id::text), 1, 6);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- 7. 行级安全策略 (RLS)
-- ============================================================

-- 启用 RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 创建应用当前租户函数
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建检查是否为超管函数
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.is_super_admin', TRUE) = 'true';
EXCEPTION
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users 表 RLS 策略
CREATE POLICY tenant_users_isolation ON users
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );

-- Projects 表 RLS 策略
CREATE POLICY tenant_projects_isolation ON projects
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );

-- Orders 表 RLS 策略
CREATE POLICY tenant_orders_isolation ON orders
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );

-- Sessions 表 RLS 策略
CREATE POLICY tenant_sessions_isolation ON user_sessions
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );

-- Audit Logs 表 RLS 策略
CREATE POLICY tenant_audit_logs_isolation ON audit_logs
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );

-- Tenants 表策略 (仅超管可管理，租户只能看自己的)
CREATE POLICY tenant_tenants_view ON tenants
    FOR SELECT
    USING (
        id = get_current_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY tenant_tenants_manage ON tenants
    FOR ALL
    USING (is_super_admin());

-- ============================================================
-- 8. 自动更新时间戳函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加自动更新时间戳触发器
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. 审计日志触发器
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_old_values = to_jsonb(OLD);
        v_new_values = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_values = NULL;
        v_new_values = to_jsonb(NEW);
    ELSE
        v_old_values = to_jsonb(OLD);
        v_new_values = to_jsonb(NEW);
    END IF;

    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        get_current_tenant_id(),
        NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_values,
        v_new_values,
        NULLIF(current_setting('app.client_ip', TRUE), '')::INET,
        current_setting('app.user_agent', TRUE)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为业务表添加审计触发器
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================
-- 10. 初始数据
-- ============================================================

-- 创建默认租户
INSERT INTO tenants (slug, name, plan, contact_email, max_projects, max_users)
VALUES ('default', '默认租户', 'basic', 'admin@example.com', 10, 5);

-- 创建超管用户 (密码: admin123，实际使用 bcrypt hash)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, email_verified)
VALUES (
    (SELECT id FROM tenants WHERE slug = 'default'),
    'admin@nestopia.com',
    '$2b$10$YourBcryptHashHere',  -- 请替换为实际的 bcrypt hash
    '超级',
    '管理员',
    'super_admin',
    'active',
    TRUE
);

-- ============================================================
-- 11. 常用查询视图
-- ============================================================

-- 租户统计视图
CREATE VIEW tenant_stats AS
SELECT
    t.id,
    t.name,
    t.slug,
    t.plan,
    t.status,
    COUNT(DISTINCT u.id) AS user_count,
    COUNT(DISTINCT p.id) AS project_count,
    COUNT(DISTINCT o.id) AS order_count,
    COALESCE(SUM(o.total_amount), 0) AS total_revenue
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.status = 'active'
LEFT JOIN projects p ON p.tenant_id = t.id
LEFT JOIN orders o ON o.tenant_id = t.id AND o.status NOT IN ('cancelled')
GROUP BY t.id, t.name, t.slug, t.plan, t.status;

-- 项目完整信息视图
CREATE VIEW project_details AS
SELECT
    p.*,
    t.name AS tenant_name,
    creator.first_name AS creator_first_name,
    creator.last_name AS creator_last_name,
    assignee.first_name AS assignee_first_name,
    assignee.last_name AS assignee_last_name
FROM projects p
JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN users creator ON creator.id = p.created_by
LEFT JOIN users assignee ON assignee.id = p.assigned_to;

-- ============================================================
-- 完成
-- ============================================================
