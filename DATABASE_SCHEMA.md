# Nestopia Platform 数据库设计文档
# Database Schema Design

**版本**: 1.0.0  
**最后更新**: 2026-01-30  
**维护者**: websterzhangsh  

---

## 1. 设计概述 (Design Overview)

### 1.1 设计原则
- **规范化**: 遵循第三范式(3NF)减少数据冗余
- **可扩展**: 预留扩展字段，支持业务增长
- **审计追踪**: 所有表包含创建/更新时间戳
- **软删除**: 使用 `is_deleted` 标记而非物理删除

### 1.2 技术选型建议
| 选项 | 推荐度 | 说明 |
|------|--------|------|
| **PostgreSQL** | ⭐⭐⭐⭐⭐ | 阿里云RDS支持，功能强大 |
| MySQL | ⭐⭐⭐⭐ | 成熟稳定，生态丰富 |
| Supabase | ⭐⭐⭐⭐ | PostgreSQL + 实时API，快速开发 |

---

## 2. ER 图 (Entity Relationship Diagram)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Users     │────<│  Customers  │────<│   Designs   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Partners   │     │   Orders    │────<│ Order_Items │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Payments   │     │  Products   │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Pricing    │
                                        └─────────────┘
```

---

## 3. 核心表设计 (Core Tables)

### 3.1 用户表 (users)
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'customer',
    -- role: 'customer', 'sales', 'admin', 'partner'
    status          VARCHAR(20) DEFAULT 'active',
    -- status: 'active', 'inactive', 'suspended'
    
    -- 审计字段
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 3.2 客户表 (customers)
```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    
    -- 基本信息
    name            VARCHAR(100) NOT NULL,
    company         VARCHAR(200),
    email           VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    wechat          VARCHAR(50),
    
    -- 地址信息
    province        VARCHAR(50),
    city            VARCHAR(50),
    district        VARCHAR(50),
    address         TEXT,
    postal_code     VARCHAR(10),
    
    -- 场地信息 (客户提供)
    site_type       VARCHAR(50),
    -- site_type: 'villa', 'townhouse', 'apartment', 'commercial'
    site_area       DECIMAL(10,2),
    site_photos     JSONB,  -- 存储图片URL数组
    site_notes      TEXT,
    
    -- 来源追踪
    source          VARCHAR(50),
    -- source: 'website', 'referral', 'partner', 'exhibition', 'other'
    partner_id      UUID REFERENCES partners(id),
    assigned_sales  UUID REFERENCES users(id),
    
    -- 客户标签
    tags            JSONB,
    
    -- 审计字段
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_partner_id ON customers(partner_id);
```

### 3.3 合作伙伴表 (partners)
```sql
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    
    -- 基本信息
    company_name    VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    
    -- 地址
    province        VARCHAR(50),
    city            VARCHAR(50),
    address         TEXT,
    
    -- 合作信息
    partner_type    VARCHAR(50),
    -- partner_type: 'distributor', 'agent', 'dealer', 'referral'
    commission_rate DECIMAL(5,2),
    contract_start  DATE,
    contract_end    DATE,
    status          VARCHAR(20) DEFAULT 'active',
    
    -- 审计字段
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);
```

---

## 4. 产品相关表 (Product Tables)

### 4.1 产品分类表 (product_categories)
```sql
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
```

### 4.2 产品表 (products)
```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES product_categories(id),
    
    -- 基本信息
    sku             VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    description     TEXT,
    description_en  TEXT,
    
    -- 规格参数
    specs           JSONB,
    /*
    specs 示例:
    {
        "material": "aluminum_alloy",
        "glass_type": "tempered_double",
        "frame_color": ["white", "black", "gray"],
        "min_width": 2000,
        "max_width": 8000,
        "min_depth": 2000,
        "max_depth": 6000,
        "min_height": 2500,
        "max_height": 4000
    }
    */
    
    -- 媒体资源
    images          JSONB,  -- 图片URL数组
    videos          JSONB,  -- 视频URL数组
    documents       JSONB,  -- 文档URL数组
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active',
    -- status: 'active', 'inactive', 'discontinued'
    is_customizable BOOLEAN DEFAULT TRUE,
    
    -- SEO
    meta_title      VARCHAR(200),
    meta_description TEXT,
    
    -- 审计字段
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
```

### 4.3 定价表 (pricing)
```sql
CREATE TABLE pricing (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id) NOT NULL,
    
    -- 基础价格
    base_price      DECIMAL(12,2) NOT NULL,
    price_unit      VARCHAR(20) DEFAULT 'per_sqm',
    -- price_unit: 'per_sqm', 'per_unit', 'per_set'
    currency        VARCHAR(3) DEFAULT 'CNY',
    
    -- 价格区间 (按面积)
    min_area        DECIMAL(10,2),
    max_area        DECIMAL(10,2),
    
    -- 定价规则
    pricing_rules   JSONB,
    /*
    pricing_rules 示例:
    {
        "area_tiers": [
            {"min": 0, "max": 15, "multiplier": 1.2},
            {"min": 15, "max": 25, "multiplier": 1.0},
            {"min": 25, "max": 999, "multiplier": 0.9}
        ],
        "options": {
            "premium_glass": 200,
            "smart_shading": 500,
            "heating_system": 800
        }
    }
    */
    
    -- 有效期
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    
    -- 状态
    is_active       BOOLEAN DEFAULT TRUE,
    
    -- 审计字段
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_product ON pricing(product_id);
CREATE INDEX idx_pricing_active ON pricing(is_active, effective_from);
```

---

## 5. 设计方案表 (Design Tables)

### 5.1 设计方案表 (designs)
```sql
CREATE TABLE designs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    product_id      UUID REFERENCES products(id),
    
    -- 方案信息
    design_number   VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200),
    version         INTEGER DEFAULT 1,
    
    -- 尺寸规格
    width           DECIMAL(10,2),  -- mm
    depth           DECIMAL(10,2),  -- mm
    height          DECIMAL(10,2),  -- mm
    area            DECIMAL(10,2),  -- sqm (自动计算)
    
    -- 配置选项
    options         JSONB,
    /*
    options 示例:
    {
        "frame_color": "white",
        "glass_type": "low_e",
        "shading": true,
        "heating": false,
        "lighting": true
    }
    */
    
    -- 设计文档
    documents       JSONB,
    /*
    documents 示例:
    {
        "floor_plan": "url",
        "rendering": ["url1", "url2"],
        "structural_drawing": "url",
        "installation_guide": "url"
    }
    */
    
    -- AI渲染相关
    ai_prompt       TEXT,
    ai_renders      JSONB,
    
    -- 报价
    quoted_price    DECIMAL(12,2),
    price_breakdown JSONB,
    
    -- 状态流转
    status          VARCHAR(30) DEFAULT 'draft',
    /*
    status: 
    'draft' -> 'submitted' -> 'reviewing' -> 
    'approved' -> 'rejected' -> 'revised'
    */
    
    -- 审批信息
    submitted_at    TIMESTAMP,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    review_notes    TEXT,
    
    -- 审计字段
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_designs_customer ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_number ON designs(design_number);
```

---

## 6. 订单相关表 (Order Tables)

### 6.1 订单表 (orders)
```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    design_id       UUID REFERENCES designs(id),
    
    -- 订单编号
    order_number    VARCHAR(50) UNIQUE NOT NULL,
    
    -- 金额信息
    subtotal        DECIMAL(12,2) NOT NULL,
    discount        DECIMAL(12,2) DEFAULT 0,
    tax             DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    
    -- 付款计划
    payment_plan    JSONB,
    /*
    payment_plan 示例:
    {
        "deposit": {"percent": 30, "due_date": "2026-02-01"},
        "second": {"percent": 40, "due_date": "2026-03-01"},
        "final": {"percent": 30, "due_date": "2026-04-01"}
    }
    */
    
    -- 配送信息
    shipping_address JSONB,
    shipping_method VARCHAR(50),
    shipping_fee    DECIMAL(10,2) DEFAULT 0,
    
    -- 安装信息
    installation_address JSONB,
    installation_date DATE,
    installation_notes TEXT,
    
    -- 合同信息
    contract_number VARCHAR(50),
    contract_url    VARCHAR(500),
    contract_signed_at TIMESTAMP,
    
    -- 状态流转
    status          VARCHAR(30) DEFAULT 'pending',
    /*
    status:
    'pending' -> 'confirmed' -> 'deposit_paid' ->
    'in_production' -> 'quality_checked' -> 
    'shipped' -> 'delivered' -> 'installing' ->
    'installed' -> 'completed' -> 'cancelled'
    */
    
    -- 时间节点
    confirmed_at    TIMESTAMP,
    production_started_at TIMESTAMP,
    shipped_at      TIMESTAMP,
    delivered_at    TIMESTAMP,
    installed_at    TIMESTAMP,
    completed_at    TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancel_reason   TEXT,
    
    -- 关联销售
    sales_rep_id    UUID REFERENCES users(id),
    partner_id      UUID REFERENCES partners(id),
    commission_rate DECIMAL(5,2),
    
    -- 备注
    internal_notes  TEXT,
    customer_notes  TEXT,
    
    -- 审计字段
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at);
```

### 6.2 订单明细表 (order_items)
```sql
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) NOT NULL,
    product_id      UUID REFERENCES products(id) NOT NULL,
    
    -- 产品信息快照
    product_snapshot JSONB,
    
    -- 数量和价格
    quantity        INTEGER DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    
    -- 定制选项
    customization   JSONB,
    dimensions      JSONB,  -- {width, depth, height, area}
    
    -- 备注
    notes           TEXT,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

## 7. 支付相关表 (Payment Tables)

### 7.1 支付记录表 (payments)
```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) NOT NULL,
    customer_id     UUID REFERENCES customers(id) NOT NULL,
    
    -- 支付信息
    payment_number  VARCHAR(50) UNIQUE NOT NULL,
    payment_type    VARCHAR(30) NOT NULL,
    -- payment_type: 'deposit', 'second_payment', 'final_payment', 'full_payment'
    
    -- 金额
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    
    -- 支付方式
    payment_method  VARCHAR(30),
    -- payment_method: 'alipay', 'wechat', 'bank_transfer', 'credit_card', 'cash'
    
    -- 第三方支付信息
    transaction_id  VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'pending',
    -- status: 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
    
    -- 时间
    due_date        DATE,
    paid_at         TIMESTAMP,
    
    -- 退款信息
    refund_amount   DECIMAL(12,2),
    refund_reason   TEXT,
    refunded_at     TIMESTAMP,
    
    -- 发票信息
    invoice_requested BOOLEAN DEFAULT FALSE,
    invoice_info    JSONB,
    invoice_url     VARCHAR(500),
    
    -- 备注
    notes           TEXT,
    
    -- 审计字段
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_number ON payments(payment_number);
```

---

## 8. 辅助表 (Supporting Tables)

### 8.1 文档管理表 (documents)
```sql
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联
    entity_type     VARCHAR(50) NOT NULL,
    -- entity_type: 'customer', 'design', 'order', 'product'
    entity_id       UUID NOT NULL,
    
    -- 文档信息
    doc_type        VARCHAR(50) NOT NULL,
    /*
    doc_type:
    'floor_plan', 'rendering', 'structural_drawing',
    'installation_guide', 'contract', 'invoice',
    'site_photo', 'completion_photo'
    */
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    
    -- 文件信息
    file_url        VARCHAR(500) NOT NULL,
    file_type       VARCHAR(20),  -- 'pdf', 'jpg', 'png', 'dwg', 'mp4'
    file_size       INTEGER,  -- bytes
    
    -- 版本控制
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active',
    
    -- 审计字段
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_type ON documents(doc_type);
```

### 8.2 操作日志表 (activity_logs)
```sql
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 操作者
    user_id         UUID REFERENCES users(id),
    user_role       VARCHAR(20),
    
    -- 操作对象
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    
    -- 操作信息
    action          VARCHAR(50) NOT NULL,
    -- action: 'create', 'update', 'delete', 'status_change', 'view'
    description     TEXT,
    
    -- 变更详情
    old_values      JSONB,
    new_values      JSONB,
    
    -- 元数据
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
```

### 8.3 系统配置表 (system_configs)
```sql
CREATE TABLE system_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    config_key      VARCHAR(100) UNIQUE NOT NULL,
    config_value    JSONB NOT NULL,
    description     TEXT,
    
    is_public       BOOLEAN DEFAULT FALSE,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. 视图 (Views)

### 9.1 订单汇总视图
```sql
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
```

### 9.2 客户统计视图
```sql
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
```

---

## 10. 索引策略 (Indexing Strategy)

### 10.1 主要索引
| 表 | 索引字段 | 类型 | 用途 |
|----|----------|------|------|
| users | email | UNIQUE | 登录查询 |
| customers | phone | INDEX | 客户查找 |
| products | sku | UNIQUE | 产品查询 |
| orders | order_number | UNIQUE | 订单查询 |
| orders | status, created_at | COMPOSITE | 状态筛选 |
| payments | order_id, status | COMPOSITE | 支付查询 |

### 10.2 JSON索引 (PostgreSQL)
```sql
-- 产品规格搜索
CREATE INDEX idx_products_specs ON products USING gin(specs);

-- 客户标签搜索
CREATE INDEX idx_customers_tags ON customers USING gin(tags);
```

---

## 11. 数据迁移策略 (Migration Strategy)

### 11.1 版本管理
```
migrations/
├── 001_create_users.sql
├── 002_create_customers.sql
├── 003_create_partners.sql
├── 004_create_products.sql
├── 005_create_pricing.sql
├── 006_create_designs.sql
├── 007_create_orders.sql
├── 008_create_payments.sql
├── 009_create_documents.sql
├── 010_create_activity_logs.sql
└── 011_create_views.sql
```

### 11.2 种子数据
```sql
-- 初始管理员
INSERT INTO users (email, password_hash, role, status)
VALUES ('admin@nestopia.com', 'hashed_password', 'admin', 'active');

-- 产品分类
INSERT INTO product_categories (name, name_en) VALUES
('可伸缩阳光房', 'Retractable Sunroom'),
('固定阳光房', 'Fixed Sunroom'),
('智能阳光房', 'Smart Sunroom');
```

---

## 12. 安全考虑 (Security Considerations)

### 12.1 数据加密
- 密码: bcrypt/argon2 哈希
- 敏感信息: AES-256 加密存储
- 传输: TLS 1.3

### 12.2 访问控制
```sql
-- Row Level Security (PostgreSQL)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_policy ON customers
    USING (
        current_user_role() = 'admin' OR
        assigned_sales = current_user_id() OR
        user_id = current_user_id()
    );
```

---

## 附录: 完整DDL脚本

完整的数据库创建脚本请参考: `database/schema.sql`

---

*本文档将随项目迭代持续更新*  
*Last updated: 2026-01-30*
