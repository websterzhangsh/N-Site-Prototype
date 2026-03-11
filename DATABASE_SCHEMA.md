# Nestopia Platform 数据库设计文档
# Multi-Tenant Database Schema Design

**版本**: 2.0.0  
**最后更新**: 2026-03-11  
**维护者**: websterzhangsh  

---

## 📁 文件说明 (File Structure)

| 文件 | 用途 | 状态 |
|------|------|------|
| `supabase/schema.sql` | **规范来源** - 完整多租户 Schema (18 表 + RLS + 触发器) | ✅ 主用 |
| `database/schema.sql` | 镜像文件 - 用于非 Supabase 部署 (Aliyun RDS 等) | ✅ 同步 |
| `supabase/customer_intake_form_schema.sql` | 客户设计申请表单 (独立功能，不含多租户) | ⚠️ 待整合 |
| `DATABASE_SCHEMA.md` | 本文档 | ✅ |

> **注意**: 历史上曾有无多租户的旧 schema，已全部废弃。当前唯一规范来源是 `supabase/schema.sql`。

---

## 1. 设计概述 (Design Overview)

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **多租户隔离** | 所有业务表包含 `tenant_id`，通过 RLS 行级安全实现数据隔离 |
| **规范化** | 遵循第三范式 (3NF)，减少数据冗余 |
| **复合唯一性** | 业务键在租户维度内唯一 (如 `UNIQUE(tenant_id, sku)`) |
| **审计追踪** | 所有表含 `created_at / updated_at`，关键表有审计触发器 |
| **软删除** | 使用 `is_deleted` 标记而非物理删除 |
| **JSONB 扩展** | 灵活字段使用 JSONB 支持未来扩展 |

### 1.2 技术选型

| 选项 | 推荐度 | 说明 |
|------|--------|------|
| **Supabase PostgreSQL** | ⭐⭐⭐⭐⭐ | 主选方案，内置 Auth / RLS / Realtime |
| Aliyun RDS PostgreSQL | ⭐⭐⭐⭐ | 备用方案，使用 `database/schema.sql` |

### 1.3 多租户策略

```
┌─────────────────────────────────────────────────────────┐
│                     共享数据库架构                        │
│                 (Shared Database + RLS)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  tenant_id  ┌─────────────────────────┐   │
│  │ Tenant A │ ──────────→ │ 仅能看到自己的数据       │   │
│  └─────────┘             └─────────────────────────┘   │
│                                                         │
│  ┌─────────┐  tenant_id  ┌─────────────────────────┐   │
│  │ Tenant B │ ──────────→ │ 仅能看到自己的数据       │   │
│  └─────────┘             └─────────────────────────┘   │
│                                                         │
│  ┌───────────┐            ┌─────────────────────────┐   │
│  │Super Admin│ ──────────→│ 可以看到所有租户数据     │   │
│  └───────────┘            └─────────────────────────┘   │
│                                                         │
│  隔离机制: RLS Policy + get_current_tenant_id()          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. ER 图 (Entity Relationship Diagram)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TENANTS (平台级)                             │
│                     id · slug · plan · features                      │
└──────────────┬───────────────────┬───────────────────┬───────────────┘
               │                   │                   │
               ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│     USERS        │  │  SYSTEM_CONFIGS  │  │    PARTNERS          │
│  tenant_id (FK)  │  │  tenant_id (FK)  │  │  tenant_id (FK)      │
└────────┬─────────┘  └──────────────────┘  └──────────┬───────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CUSTOMERS (tenant_id FK)                   │
│  customer_number · name · phone · site_type · source · tags       │
└────────┬──────────────────┬──────────────────┬───────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│   PROJECTS     │  │   DESIGNS    │  │        ORDERS            │
│ tenant_id (FK) │  │tenant_id(FK) │  │    tenant_id (FK)        │
│ customer_id    │  │customer_id   │  │ customer_id · design_id  │
└────────────────┘  │product_id    │  └──────┬─────────┬─────────┘
                    │compliance_*  │         │         │
                    └──────────────┘         ▼         ▼
                                    ┌──────────┐ ┌──────────┐
                                    │ORDER_ITEMS│ │ PAYMENTS │
                                    │tenant_id  │ │tenant_id │
                                    │product_id │ │order_id  │
                                    └──────────┘ └──────────┘

┌──────────────────────────────────────────────────────────────────┐
│               PRODUCT CATALOG & PRICING                           │
├────────────────┬──────────────┬───────────────┬──────────────────┤
│ PRODUCT_       │  PRODUCTS    │ PRODUCT_FILES │   PRICING        │
│ CATEGORIES     │ tenant_id    │ tenant_id     │  tenant_id       │
│ tenant_id      │ category_id  │ product_id    │  product_id      │
│ parent_id(self)│ sku (unique  │ file_type     │  area_tiers      │
│                │  per tenant) │ category      │  option_prices   │
│                │              │               │  discount_rules  │
├────────────────┴──────────────┴───────────────┼──────────────────┤
│                                               │ COST_COMPONENTS  │
│                                               │ tenant_id        │
│                                               │ product_id       │
│                                               │ component_type   │
│                                               │ unit_cost        │
└───────────────────────────────────────────────┴──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    SUPPORTING TABLES                              │
├──────────────────┬──────────────────┬────────────────────────────┤
│   DOCUMENTS      │  AUDIT_LOGS      │  USER_SESSIONS             │
│ tenant_id        │ tenant_id        │  tenant_id                 │
│ entity_type/id   │ resource_type/id │  user_id                   │
│ (polymorphic)    │ old/new_values   │  token_hash                │
└──────────────────┴──────────────────┴────────────────────────────┘
```

---

## 3. 表总览 (Table Summary)

### 3.1 完整表清单

| # | 表名 | 类型 | tenant_id | RLS | 审计触发器 | 说明 |
|---|------|------|-----------|-----|-----------|------|
| A1 | `tenants` | 平台 | — | ✅ | — | 租户元数据 |
| A2 | `users` | 基础 | ✅ FK | ✅ | ✅ | 用户/角色 |
| A3 | `user_sessions` | 基础 | ✅ FK | ✅ | — | 登录会话 |
| A4 | `audit_logs` | 基础 | ✅ FK | ✅ | — | 审计日志 |
| A5 | `system_configs` | 基础 | ✅ FK | ✅ | — | 系统配置 |
| B1 | `partners` | 业务 | ✅ FK | ✅ | — | 合作伙伴 |
| B2 | `customers` | 业务 | ✅ FK | ✅ | ✅ | **客户管理** |
| C1 | `product_categories` | 业务 | ✅ FK | ✅ | — | **产品分类** |
| C2 | `products` | 业务 | ✅ FK | ✅ | ✅ | **产品目录** |
| C3 | `product_files` | 业务 | ✅ FK | ✅ | — | **产品文件** |
| C4 | `pricing` | 业务 | ✅ FK | ✅ | ✅ | **定价规则** |
| C5 | `cost_components` | 业务 | ✅ FK | ✅ | — | **成本构成** |
| D1 | `projects` | 业务 | ✅ FK | ✅ | ✅ | 项目管理 |
| D2 | `designs` | 业务 | ✅ FK | ✅ | ✅ | 设计方案 |
| E1 | `orders` | 业务 | ✅ FK | ✅ | ✅ | **订单管理** |
| E2 | `order_items` | 业务 | ✅ FK | ✅ | — | **订单明细** |
| E3 | `payments` | 业务 | ✅ FK | ✅ | ✅ | **支付记录** |
| F1 | `documents` | 业务 | ✅ FK | ✅ | — | 文档管理 |

> **粗体** 标记为本次重点设计的表（Customers / Products / Orders / Pricing）

### 3.2 视图

| 视图 | 说明 |
|------|------|
| `v_tenant_stats` | 租户仪表板统计 (用户数/客户数/产品数/订单数/收入) |
| `v_order_summary` | 订单汇总 (含已付金额/余额/客户/销售) |
| `v_customer_stats` | 客户统计 (订单数/消费总额/项目数) |
| `v_product_pricing` | 产品定价视图 (含当前有效价格/文件数) |

---

## 4. 核心业务表详细设计

### 4.1 客户表 (customers)

```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),

    -- 身份标识
    customer_number VARCHAR(50),                    -- 自动生成: CUS-YYYYMMDD-XXXXXX
    name            VARCHAR(100) NOT NULL,
    company         VARCHAR(200),
    email           VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    wechat          VARCHAR(50),

    -- 地址
    province        VARCHAR(50),
    city            VARCHAR(50),
    district        VARCHAR(50),
    address         TEXT,
    postal_code     VARCHAR(10),

    -- 场地信息
    site_type       VARCHAR(50),                    -- villa|townhouse|apartment|commercial|other
    site_area       DECIMAL(10,2),                  -- 平方米
    site_photos     JSONB DEFAULT '[]',             -- 图片URL数组
    site_notes      TEXT,

    -- 获客追踪
    source          VARCHAR(50),                    -- website|referral|partner|exhibition|social_media|phone|walk_in|other
    partner_id      UUID REFERENCES partners(id),
    assigned_sales  UUID REFERENCES users(id),

    -- 分类
    customer_type   VARCHAR(20) DEFAULT 'standard', -- standard|vip|enterprise
    tags            JSONB DEFAULT '[]',
    notes           TEXT,
    satisfaction_score DECIMAL(3,1),

    -- 状态
    status          VARCHAR(20) DEFAULT 'active',   -- active|inactive|prospect|churned

    -- 审计
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE,

    UNIQUE(tenant_id, customer_number)              -- 编号在租户内唯一
);
```

**关键索引:**
- `(tenant_id)` — 租户隔离查询
- `(tenant_id, phone)` — 按手机号快速查找
- `(tenant_id, status)` — 状态筛选
- `USING gin(tags)` — 标签搜索

---

### 4.2 产品表 (products)

```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES product_categories(id),

    -- 标识
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),
    description     TEXT,
    description_en  TEXT,

    -- 规格参数 (JSONB)
    specs           JSONB DEFAULT '{}',
    /*
    {
        "material": "aluminum_alloy",
        "glass_type": "tempered_double",
        "frame_colors": ["white", "black", "gray"],
        "min_width_mm": 2000, "max_width_mm": 8000,
        "min_depth_mm": 2000, "max_depth_mm": 6000,
        "min_height_mm": 2500, "max_height_mm": 4000,
        "weight_per_sqm_kg": 25
    }
    */

    -- 媒体
    thumbnail_url   TEXT,
    images          JSONB DEFAULT '[]',
    videos          JSONB DEFAULT '[]',

    -- 状态
    status          VARCHAR(20) DEFAULT 'active',   -- active|inactive|discontinued|draft
    is_customizable BOOLEAN DEFAULT TRUE,

    -- SEO
    meta_title      VARCHAR(200),
    meta_description TEXT,

    -- 审计
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE,

    UNIQUE(tenant_id, sku)                          -- SKU 在租户内唯一
);
```

**关联表:**

| 表 | 关系 | 说明 |
|----|------|------|
| `product_files` | 1:N | 产品关联的文件 (图片/CAD/PDF等) |
| `pricing` | 1:N | 产品可有多套定价规则 |
| `cost_components` | 1:N | 产品的成本构成明细 |
| `product_categories` | N:1 | 产品所属分类 |

---

### 4.3 产品文件表 (product_files)

```sql
CREATE TABLE product_files (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(20) NOT NULL,           -- image|pdf|dwg|dxf|skp|obj|step|stl|video|document|other
    mime_type       VARCHAR(100),
    file_size_bytes BIGINT,
    file_url        TEXT NOT NULL,
    storage_path    TEXT,                            -- Supabase Storage path

    category        VARCHAR(50) DEFAULT 'general',  -- general|thumbnail|gallery|technical_drawing|cad_model|3d_model|brochure|installation_guide|certification

    dimensions      JSONB,                          -- {width, height} or {pages}
    metadata        JSONB DEFAULT '{}',

    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,

    status          VARCHAR(20) DEFAULT 'active',   -- active|processing|failed|archived
    processing_info JSONB,                          -- 文件转换状态

    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE
);
```

---

### 4.4 定价规则表 (pricing)

```sql
CREATE TABLE pricing (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    pricing_name    VARCHAR(100),
    pricing_type    VARCHAR(30) DEFAULT 'standard', -- standard|promotional|partner|volume|custom

    -- 基础价格
    base_price      DECIMAL(12,2) NOT NULL,
    price_unit      VARCHAR(20) DEFAULT 'per_sqm',  -- per_sqm|per_unit|per_set|per_linear_m
    currency        VARCHAR(3) DEFAULT 'CNY',

    -- 面积约束
    min_area        DECIMAL(10,2),
    max_area        DECIMAL(10,2),

    -- 分层定价
    area_tiers      JSONB DEFAULT '[]',
    /*
    [
        {"min_sqm": 0,  "max_sqm": 15, "multiplier": 1.2, "label": "小面积"},
        {"min_sqm": 15, "max_sqm": 25, "multiplier": 1.0, "label": "标准"},
        {"min_sqm": 25, "max_sqm": 999, "multiplier": 0.9, "label": "大面积优惠"}
    ]
    */

    -- 选项加价
    option_prices   JSONB DEFAULT '{}',
    /*
    {
        "premium_glass":  {"price": 200, "unit": "per_sqm",      "label": "高级玻璃"},
        "smart_shading":  {"price": 500, "unit": "per_sqm",      "label": "智能遮阳"},
        "heating_system": {"price": 800, "unit": "per_unit",     "label": "加热系统"},
        "led_lighting":   {"price": 150, "unit": "per_linear_m", "label": "LED灯带"}
    }
    */

    -- 折扣规则
    discount_rules  JSONB DEFAULT '{}',
    /*
    {
        "early_bird":       {"percent": 5,  "valid_until": "2026-06-01"},
        "repeat_customer":  {"percent": 3},
        "partner_discount": {"percent": 10, "partner_types": ["distributor"]}
    }
    */

    -- 有效期
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,

    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.5 成本构成表 (cost_components)

> 供 **Pricing & Cost Controller Agent** 使用，实现成本分解和利润分析

```sql
CREATE TABLE cost_components (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,

    component_name  VARCHAR(100) NOT NULL,
    component_type  VARCHAR(30) NOT NULL,           -- material|labor|shipping|installation|permit|overhead|warranty|tax|other

    unit_cost       DECIMAL(12,2) NOT NULL,
    cost_unit       VARCHAR(20) DEFAULT 'per_sqm',  -- per_sqm|per_unit|per_set|per_hour|per_trip|fixed
    currency        VARCHAR(3) DEFAULT 'CNY',

    -- 数量计算公式
    quantity_formula JSONB,
    /*
    {
        "type": "area_based",     -- area_based|fixed|dimension_based
        "factor": 1.1,            -- 10% 损耗率
        "min_quantity": 1
    }
    */

    is_variable     BOOLEAN DEFAULT TRUE,
    margin_percent  DECIMAL(5,2) DEFAULT 0,

    -- 供应商信息
    supplier_name   VARCHAR(200),
    supplier_sku    VARCHAR(100),
    lead_time_days  INTEGER,

    -- 有效期
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, product_id, component_name)
);
```

**成本类型说明:**

| component_type | 说明 | 典型 cost_unit |
|----------------|------|---------------|
| `material` | 原材料成本 (铝合金/玻璃/五金等) | per_sqm |
| `labor` | 工厂生产人工 | per_hour / per_sqm |
| `shipping` | 物流运输 | per_trip / fixed |
| `installation` | 现场安装人工 | per_sqm / fixed |
| `permit` | 许可证/审批费 | fixed |
| `overhead` | 管理费用分摊 | per_unit |
| `warranty` | 质保预留 | per_unit |
| `tax` | 税费 | per_unit |

---

### 4.6 订单表 (orders)

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id),
    project_id      UUID REFERENCES projects(id),
    design_id       UUID REFERENCES designs(id),

    order_number    VARCHAR(50),                    -- 自动生成: ORD-YYYYMMDD-XXXXXX

    -- 金额
    subtotal        DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_reason TEXT,
    tax_amount      DECIMAL(12,2) DEFAULT 0,
    shipping_fee    DECIMAL(10,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',

    -- 3阶段付款计划
    payment_plan    JSONB DEFAULT '{}',
    /*
    {
        "deposit":  {"percent": 30, "amount": 9300,  "due_date": "2026-02-01", "status": "paid"},
        "second":   {"percent": 40, "amount": 12400, "due_date": "2026-03-01", "status": "pending"},
        "final":    {"percent": 30, "amount": 9300,  "due_date": "2026-04-01", "status": "pending"}
    }
    */

    -- 配送 & 安装
    shipping_address    JSONB,
    shipping_method     VARCHAR(50),
    tracking_number     VARCHAR(100),
    installation_address JSONB,
    installation_date   DATE,
    installation_notes  TEXT,
    installation_team   VARCHAR(100),

    -- 合同
    contract_number     VARCHAR(50),
    contract_url        VARCHAR(500),
    contract_signed_at  TIMESTAMPTZ,

    -- 状态流转 (13 个状态)
    status          VARCHAR(30) DEFAULT 'pending',

    -- 时间里程碑
    confirmed_at            TIMESTAMPTZ,
    deposit_paid_at         TIMESTAMPTZ,
    production_started_at   TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,
    quality_checked_at      TIMESTAMPTZ,
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    installed_at            TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,

    -- 销售归属
    sales_rep_id    UUID REFERENCES users(id),
    partner_id      UUID REFERENCES partners(id),
    commission_rate DECIMAL(5,2),

    -- 备注
    internal_notes  TEXT,
    customer_notes  TEXT,

    -- 审计
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE,

    UNIQUE(tenant_id, order_number)
);
```

**订单状态流转:**

```
pending → confirmed → deposit_paid → in_production → quality_check
    → shipped → delivered → installing → installed → completed
                                                         ↓
                        cancelled ← (任意非完成状态均可取消)
                        refunding → refunded
```

---

### 4.7 订单明细表 (order_items)

```sql
CREATE TABLE order_items (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),

    product_snapshot JSONB NOT NULL,     -- 下单时产品快照 (冻结)
    quantity        INTEGER DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,

    customization   JSONB DEFAULT '{}', -- 定制选项
    dimensions      JSONB,              -- {width_mm, depth_mm, height_mm, area_sqm}
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> **设计要点**: `product_snapshot` 冻结下单时的产品信息，防止后续产品修改影响历史订单。

---

### 4.8 支付记录表 (payments)

```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID NOT NULL REFERENCES orders(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),

    payment_number  VARCHAR(50),                    -- 自动生成: PAY-YYYYMMDD-XXXXXX
    payment_type    VARCHAR(30) NOT NULL,           -- deposit|second_payment|final_payment|full_payment|refund|adjustment
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',

    payment_method  VARCHAR(30),                    -- alipay|wechat_pay|bank_transfer|credit_card|cash|other
    transaction_id  VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,

    status          VARCHAR(20) DEFAULT 'pending',  -- pending|processing|completed|failed|refunded|cancelled
    due_date        DATE,
    paid_at         TIMESTAMPTZ,

    -- 退款
    refund_amount   DECIMAL(12,2),
    refund_reason   TEXT,
    refunded_at     TIMESTAMPTZ,

    -- 发票
    invoice_requested BOOLEAN DEFAULT FALSE,
    invoice_info    JSONB,
    invoice_url     VARCHAR(500),

    notes           TEXT,

    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, payment_number)
);
```

---

## 5. 多租户隔离机制

### 5.1 RLS 策略

所有 18 张表均启用 RLS，核心策略：

```sql
-- 获取当前租户 ID (从 JWT claim / session variable)
CREATE FUNCTION get_current_tenant_id() RETURNS UUID ...

-- 检查超管权限
CREATE FUNCTION is_super_admin() RETURNS BOOLEAN ...

-- 通用策略模板 (应用到每张表)
CREATE POLICY rls_{table} ON {table} FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
    );
```

### 5.2 租户上下文设置

```sql
-- Edge Function / API 中间件设置租户上下文
SET LOCAL app.current_tenant_id = '{tenant-uuid}';
SET LOCAL app.current_user_id = '{user-uuid}';
SET LOCAL app.is_super_admin = 'false';
SET LOCAL app.client_ip = '1.2.3.4';
SET LOCAL app.user_agent = 'Mozilla/5.0 ...';
```

### 5.3 复合唯一约束

| 表 | 约束 | 说明 |
|----|------|------|
| users | `UNIQUE(tenant_id, email)` | 同邮箱可在不同租户注册 |
| customers | `UNIQUE(tenant_id, customer_number)` | 客户编号租户内唯一 |
| products | `UNIQUE(tenant_id, sku)` | SKU 租户内唯一 |
| orders | `UNIQUE(tenant_id, order_number)` | 订单号租户内唯一 |
| payments | `UNIQUE(tenant_id, payment_number)` | 支付号租户内唯一 |
| system_configs | `UNIQUE(tenant_id, config_key)` | 配置键租户内唯一 |
| cost_components | `UNIQUE(tenant_id, product_id, component_name)` | 成本项唯一 |
| product_categories | `UNIQUE(tenant_id, name, parent_id)` | 同级分类名唯一 |

---

## 6. 自动编号机制

| 实体 | 格式 | 触发器 |
|------|------|--------|
| Customer | `CUS-YYYYMMDD-XXXXXX` | `generate_customer_number()` |
| Project | `PRJ-YYYYMMDD-XXXXXX` | `generate_project_number()` |
| Design | `DSN-YYYYMMDD-XXXXXX` | `generate_design_number()` |
| Order | `ORD-YYYYMMDD-XXXXXX` | `generate_order_number()` |
| Payment | `PAY-YYYYMMDD-XXXXXX` | `generate_payment_number()` |

---

## 7. 索引策略

### 7.1 主要索引

| 表 | 索引字段 | 类型 | 用途 |
|----|----------|------|------|
| 所有业务表 | `tenant_id` | INDEX | RLS 查询加速 |
| users | `(tenant_id, email)` | UNIQUE | 登录查询 |
| customers | `(tenant_id, phone)` | INDEX | 客户查找 |
| products | `(tenant_id, sku)` | UNIQUE | 产品查询 |
| orders | `(tenant_id, status)` | INDEX | 状态筛选 |
| orders | `(tenant_id, created_at)` | INDEX | 时间排序 |
| pricing | `(tenant_id, is_active, effective_from)` | INDEX | 有效价格查询 |

### 7.2 GIN 索引 (JSONB)

```sql
CREATE INDEX idx_products_specs ON products USING gin(specs);
CREATE INDEX idx_customers_tags ON customers USING gin(tags);
```

---

## 8. 审计追踪

### 8.1 自动时间戳

所有含 `updated_at` 的表通过触发器自动更新：

```sql
CREATE TRIGGER trg_{table}_updated BEFORE UPDATE ON {table}
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8.2 审计日志触发器

关键业务表 (customers, products, pricing, orders, payments, designs, projects, users) 的增删改操作自动记录到 `audit_logs`：

```sql
CREATE TRIGGER audit_{table} AFTER INSERT OR UPDATE OR DELETE ON {table}
    FOR EACH ROW EXECUTE FUNCTION log_audit();
```

记录内容：
- `tenant_id` — 操作所属租户
- `user_id` — 操作人
- `action` — INSERT / UPDATE / DELETE
- `resource_type` — 表名
- `old_values` / `new_values` — 变更前后完整数据 (JSONB)
- `ip_address` / `user_agent` — 客户端信息

---

## 9. AI Agent 数据需求映射

| Agent | 读取表 | 写入表 | 说明 |
|-------|--------|--------|------|
| **AI Designer** | products, product_files, customers (site_info), designs | designs (ai_renders, ai_prompt) | 基于产品目录和场地信息生成设计 |
| **Pricing & Cost Controller** | products, pricing, cost_components, order_items | designs (quoted_price, price_breakdown) | 计算成本、建议定价、保护利润率 |
| **Compliance Manager** | designs, products (specs), customers (site_info) | designs (compliance_status, compliance_notes) | 检查设计合规性 |
| **Customer Service** | customers, orders, payments, designs, projects | — (只读) | 查询订单状态、回答客户问题 |

---

## 10. 数据迁移策略

### 10.1 迁移文件结构

```
migrations/
├── 001_create_tenants.sql
├── 002_create_users.sql
├── 003_create_sessions.sql
├── 004_create_audit_logs.sql
├── 005_create_system_configs.sql
├── 006_create_partners.sql
├── 007_create_customers.sql
├── 008_create_product_categories.sql
├── 009_create_products.sql
├── 010_create_product_files.sql
├── 011_create_pricing.sql
├── 012_create_cost_components.sql
├── 013_create_projects.sql
├── 014_create_designs.sql
├── 015_create_orders.sql
├── 016_create_order_items.sql
├── 017_create_payments.sql
├── 018_create_documents.sql
├── 019_enable_rls.sql
├── 020_create_triggers.sql
├── 021_create_views.sql
└── 022_seed_data.sql
```

### 10.2 种子数据

```sql
-- 默认租户
INSERT INTO tenants (slug, name, plan) VALUES ('default', '默认租户', 'basic');

-- 超管用户
INSERT INTO users (tenant_id, email, password_hash, role, status, email_verified)
VALUES (..., 'admin@nestopia.com', crypt('admin123', gen_salt('bf')), 'super_admin', 'active', TRUE);

-- 产品分类
INSERT INTO product_categories (tenant_id, name, name_en, sort_order) VALUES
(..., '可伸缩阳光房', 'Retractable Sunroom', 1),
(..., '固定阳光房', 'Fixed Sunroom', 2),
(..., '智能阳光房', 'Smart Sunroom', 3),
(..., '配件与附件', 'Accessories', 4);
```

---

## 11. 安全考虑

### 11.1 数据加密

| 层 | 措施 |
|----|------|
| 密码 | bcrypt / argon2 哈希 |
| 传输 | TLS 1.3 |
| 存储 | Supabase Vault (敏感字段) |

### 11.2 访问控制

```
super_admin → 跨租户全局访问
admin       → 本租户所有数据
manager     → 本租户，按分配范围
sales       → 本租户，仅分配的客户/订单
member      → 本租户，仅自己的数据
```

### 11.3 API 安全

- JWT Token 中嵌入 `tenant_id` 和 `role`
- Edge Function 中间件验证并注入租户上下文
- 所有 API 端点通过 RLS 强制租户隔离

---

## 附录

### A. 文件说明

| 文件 | 说明 |
|------|------|
| `supabase/schema.sql` | **规范来源** - 含 RLS / 触发器 / 审计 (Supabase 部署) |
| `database/schema.sql` | 镜像文件 - 适用于非 Supabase 部署 (Aliyun RDS 等) |
| `DATABASE_SCHEMA.md` | 本文档 |
| `docs/multi-tenant-architecture.md` | 多租户架构详细设计 |

### B. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-01-30 | 初始数据库设计，无多租户支持 |
| 2.0.0 | 2026-03-11 | **重大更新**: 全面多租户化；新增 product_files / cost_components；增强 pricing 表 (分层定价/选项加价/折扣规则)；增强 orders 表 (13状态流转)；全表 RLS；审计触发器 |

---

*本文档将随项目迭代持续更新*  
*Last updated: 2026-03-11*
