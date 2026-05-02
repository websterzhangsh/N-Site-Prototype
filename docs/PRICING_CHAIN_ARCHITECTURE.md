# 多层定价链架构设计

> **版本:** 1.0 | **日期:** 2026-05-02 | **状态:** 设计中  
> **作者:** Nestopia 产品 & 技术团队  
> **关联文档:** [PRODUCT_MASTER_DATA_ARCHITECTURE.md](PRODUCT_MASTER_DATA_ARCHITECTURE.md), [SECURITY_STRATEGY.md](SECURITY_STRATEGY.md), [DATA_AI_STRATEGY.md](DATA_AI_STRATEGY.md)

---

## 1. 概述 & 业务背景

### 1.1 业务场景

Nestopia 平台采用 **B2B 多层分销模型**，定价链涉及四个角色：

```
平台供货商        Nestopia-CHN(平台)         Omeya-SIN(分销商)         最终客户
─────────  ═══▷  ────────────────  ═══▷  ──────────────────  ═══▷  ──────────
 销售价(A)         进货价(A)                 进货价(B)                  购买价(C)
                   销售价(B)                 销售价(C)
                   B = A × (1+x)             C = B × (1+y)
```

### 1.2 角色定义

| 角色 | 身份 | 定价职责 | 对应租户 |
|------|------|---------|---------|
| **平台供货商** | 中国制造商（如宏创户外） | 提供原始出厂价(A) | — |
| **Nestopia-CHN** | 平台运营方（价格主数据 Owner） | 设定批发加价因子 x → 对分销商售价 B | `nestopia-chn` |
| **Omeya-SIN** | 新加坡分销商（平台租户） | 设定零售加价因子 y → 对客户售价 C | `omeya-sin` |
| **最终客户** | Omeya 的客户 | 接受报价 C | — |

### 1.3 核心公式

```
B = A × (1 + x)     ← Nestopia-CHN 对分销商的批发售价
C = B × (1 + y)     ← 分销商对终端客户的零售售价
  = A × (1 + x) × (1 + y)
```

其中：
- **A** = 供货商原始价格（RMB/m² 或 RMB/套），来源于供货商报价表
- **x** = Nestopia-CHN 的批发加价因子（per-SKU），涵盖平台利润 + 运营成本
- **B** = 分销商进货价 = Nestopia-CHN 的批发售价
- **y** = 分销商的零售加价因子，涵盖本地成本（运费、安装）+ 分销商利润
- **C** = 最终客户支付价格

---

## 2. 定价链数据模型

### 2.1 三层架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 0: 供货商原始价格表 (Source of Truth)                       │
│  ──────────────────────────────────────────                       │
│  数据源: pricing-data.js → zbSKUCatalog / zbDriveSystemCatalog    │
│  管理者: Nestopia-CHN（唯一编辑权限）                               │
│  可见性: 仅 Nestopia-CHN 管理员                                    │
│                                                                   │
│  示例:                                                            │
│    WR120A-63 → ≤6m²: 320 RMB/m², >6m²: 280 RMB/m²              │
│    AOK-45 电机 → 355 RMB/套                                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │ × (1 + x)     ← per-SKU margin factor
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 1: 平台批发价 (Nestopia-CHN → 分销商)                       │
│  ──────────────────────────────────────────                       │
│  计算: B_tier = A_tier × (1 + x_sku)                              │
│  存储: Supabase `platform_wholesale_pricing` 表                   │
│  管理者: Nestopia-CHN 管理员 (设定 x)                              │
│  可见性: Nestopia-CHN + 对应分销商                                  │
│                                                                   │
│  示例 (x = 0.40):                                                 │
│    WR120A-63 → ≤6m²: 448 RMB/m², >6m²: 392 RMB/m²              │
│    AOK-45 电机 → 497 RMB/套                                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │ × (1 + y)     ← 分销商自定义
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 2: 分销商零售价 (Omeya-SIN → 最终客户)                      │
│  ──────────────────────────────────────────                       │
│  计算: C = B × (1 + y) 或 C = B + local_costs + profit           │
│  存储: 现有 step4QuotationState (per-project)                     │
│  管理者: 分销商 (Omeya-SIN)                                       │
│  可见性: 分销商 + 最终客户报价单                                    │
│                                                                   │
│  示例 (y = 0.46):                                                 │
│    WR120A-63 → ≤6m²: 654 RMB/m², >6m²: 572 RMB/m²              │
│    (外币换算后 → ≤6m²: 122 SGD/m²)                                │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 价格元素分类

| 价格元素 | 所属层 | 单位 | 来源 | 是否含在 x/y 中 |
|----------|-------|------|------|----------------|
| 供货商面料单价 | Layer 0 | RMB/m² | zbSKUCatalog.priceTiers | 基准 A |
| 供货商电机价格 | Layer 0 | RMB/套 | zbDriveSystemCatalog.price | 基准 A_drive |
| 面料升级附加费 | Layer 0 | RMB/m² | zbBusinessParams.fabricUpgrades | 加在 A 上 |
| 高度附加费 | Layer 0 | RMB/m² | zbBusinessParams.heightSurcharges | 加在 A 上 |
| 样板费 | Layer 0 | RMB/块 | zbSKUCatalog.samplePrice | 单独计 |
| **平台批发加价 x** | **Layer 1** | **系数** | **platform_wholesale_pricing** | **x 本身** |
| 国际运费/清关 | Layer 2 | RMB or SGD | 分销商配置 | 含在 y 中(或单独) |
| 本地安装费 | Layer 2 | SGD/m² | 分销商配置 | 含在 y 中(或单独) |
| **分销商零售加价 y** | **Layer 2** | **系数** | **step4 state** | **y 本身** |

### 2.3 Per-SKU Margin Factor x 数据结构

```javascript
// platform_wholesale_pricing 表中一条记录的逻辑结构
{
    sku_key: 'WR120A-63',           // SKU 唯一标识
    margin_factor_x: 0.40,          // 批发加价因子 (40%)
    effective_date: '2026-05-01',   // 生效日期
    notes: '含平台运营成本+利润',     // 备注
    
    // 计算得出（便于查询，非存储）：
    // wholesale_tiers: [
    //   { maxArea: 6, supplierPrice: 320, wholesalePrice: 448 },
    //   { maxArea: ∞, supplierPrice: 280, wholesalePrice: 392 }
    // ]
}
```

### 2.4 驱动系统 & 配件的 x 处理

驱动系统（电机/手动操控）和配件同样适用 margin factor，但考虑到配件品类多样，提供两种策略：

| 策略 | 适用场景 | 公式 |
|------|---------|------|
| **统一 x** | 驱动系统跟随所属 SKU 的 x | B_drive = A_drive × (1 + x_sku) |
| **独立 x_acc** | 配件/电机有独立的加价因子 | B_drive = A_drive × (1 + x_acc) |

**推荐**: 初期采用**统一 x**（简化管理），后期可扩展为独立 x_acc。

```javascript
// 驱动系统批发价计算
function calcWholesaleDrivePrice(driveKey, skuKey) {
    var drive = zbDriveSystemCatalog[driveKey];
    var xFactor = getMarginFactor(skuKey);  // 获取该 SKU 的 x
    return Math.round(drive.price * (1 + xFactor));
}
```

---

## 3. 数据库设计 (Supabase)

### 3.1 新增表: `platform_wholesale_pricing`

此表由 Nestopia-CHN 管理，存储每个 SKU 的批发加价因子。

```sql
-- ═══════════════════════════════════════════════════════
--  平台批发定价表 — Nestopia-CHN 对分销商的定价策略
-- ═══════════════════════════════════════════════════════

CREATE TABLE platform_wholesale_pricing (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 产品标识
    sku_key         TEXT NOT NULL,                    -- SKU 唯一标识 (如 'WR120A-63')
    product_type    TEXT NOT NULL DEFAULT 'blinds',   -- 'blinds' | 'drive' | 'accessory'
    
    -- 定价参数
    margin_factor_x NUMERIC(5,4) NOT NULL DEFAULT 0.40,  -- 加价因子 (0.40 = 40%)
    
    -- 生效控制
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,   -- 生效日期
    effective_to    DATE,                                  -- 失效日期 (NULL = 长期有效)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 备注 & 审计
    notes           TEXT,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：同一 SKU 同一时间只能有一条有效定价
    CONSTRAINT uq_sku_active UNIQUE (sku_key, effective_from)
);

-- 索引
CREATE INDEX idx_wholesale_sku ON platform_wholesale_pricing (sku_key);
CREATE INDEX idx_wholesale_active ON platform_wholesale_pricing (is_active, effective_from);

-- RLS 策略：仅 Nestopia-CHN 管理员可读写
ALTER TABLE platform_wholesale_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nestopia_chn_admin_all" ON platform_wholesale_pricing
    FOR ALL
    USING (auth.jwt() ->> 'tenant_slug' = 'nestopia-chn')
    WITH CHECK (auth.jwt() ->> 'tenant_slug' = 'nestopia-chn');
```

### 3.2 新增表: `distributor_price_list`

分销商可见的批发价目表（由系统根据 `platform_wholesale_pricing` 自动生成）。

```sql
-- ═══════════════════════════════════════════════════════
--  分销商价目表 — 分销商可见的进货价
-- ═══════════════════════════════════════════════════════

CREATE TABLE distributor_price_list (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 分销商标识
    tenant_id       UUID NOT NULL,                   -- 分销商租户 ID
    
    -- 产品标识
    sku_key         TEXT NOT NULL,
    product_type    TEXT NOT NULL DEFAULT 'blinds',
    
    -- 价格信息 (已含 x 加价)
    price_tiers     JSONB NOT NULL,                  -- [{ maxArea, wholesalePrice }]
    currency        TEXT NOT NULL DEFAULT 'RMB',
    
    -- 同步元数据
    source_margin_x NUMERIC(5,4),                    -- 生成时使用的 x 值 (审计用)
    synced_at       TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束
    CONSTRAINT uq_tenant_sku UNIQUE (tenant_id, sku_key)
);

-- RLS 策略：分销商只能看到自己的价目表
ALTER TABLE distributor_price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distributor_read_own" ON distributor_price_list
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "platform_manage_all" ON distributor_price_list
    FOR ALL
    USING (auth.jwt() ->> 'tenant_slug' = 'nestopia-chn')
    WITH CHECK (auth.jwt() ->> 'tenant_slug' = 'nestopia-chn');
```

### 3.3 现有表变更

#### `projects` 表 — `quotation_data` JSONB 扩展

```jsonc
// quotation_data 新增字段
{
    // ...现有字段...
    "pricingSource": "wholesale",      // "wholesale" (从批发价开始) | "supplier" (从供货商价开始，仅 CHN)
    "wholesalePriceSnapshot": {        // 报价时的批发价快照（锁价）
        "WR120A-63": {
            "marginX": 0.40,
            "tiers": [
                { "maxArea": 6, "wholesalePrice": 448 },
                { "maxArea": "Infinity", "wholesalePrice": 392 }
            ]
        }
    }
}
```

### 3.4 ER 关系图

```
                        ┌──────────────────────┐
                        │ platform_wholesale_   │
                        │ pricing               │
                        │ ─────────────────     │
                        │ sku_key          (PK) │
                        │ margin_factor_x       │
                        │ effective_from        │
                        │ product_type          │
                        └──────────┬───────────┘
                                   │
                     [系统计算 B = A × (1+x)]
                                   │
                                   ▼
┌────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ zbSKUCatalog       │   │ distributor_price_    │   │ projects             │
│ (pricing-data.js)  │   │ list                  │   │                      │
│ ────────────────── │   │ ─────────────────     │   │ quotation_data (JSON)│
│ 供货商原价 A       │──▷│ tenant_id             │   │  └─ wholesalePrice-  │
│ priceTiers[]       │   │ sku_key               │──▷│    Snapshot          │
│ samplePrice        │   │ price_tiers (JSON)    │   │  └─ pricingSource    │
└────────────────────┘   │ source_margin_x       │   └──────────────────────┘
                         └──────────────────────┘
```

---

## 4. Nestopia-CHN 管理界面设计

### 4.1 功能入口

在 Nestopia-CHN 租户的管理面板中新增 **"Wholesale Pricing"** 页面，入口位于侧栏导航（Products 下方）。

### 4.2 主界面: 批发定价总表

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏷️ Wholesale Pricing — Platform Price Management                       │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  [Filter by Series: ▼ All]  [Search SKU...]         [Publish to ▼ All]  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ SKU          │ Series │ Supplier(A) │  x   │ Wholesale(B) │ Δ%   │  │
│  │──────────────│────────│─────────────│──────│──────────────│──────│  │
│  │ WR100A-63    │ WR100  │ 270/250     │ 0.35 │ 365/338      │ +35% │  │
│  │ WR100B-63    │ WR100  │ 275/240     │ 0.35 │ 371/324      │ +35% │  │
│  │ WR110A-63    │ WR110  │ 295/270     │ 0.38 │ 407/373      │ +38% │  │
│  │ WR110A-78    │ WR110  │ 315/295     │ 0.38 │ 435/407      │ +38% │  │
│  │ WR110B-63    │ WR110  │ 265/250     │ 0.38 │ 366/345      │ +38% │  │
│  │ WR110B-78    │ WR110  │ 295/280     │ 0.38 │ 407/386      │ +38% │  │
│  │ WR120A-63    │ WR120  │ 320/280     │ 0.40 │ 448/392      │ +40% │  │
│  │ WR120A-78    │ WR120  │ 345/305     │ 0.40 │ 483/427      │ +40% │  │
│  │ WR120B-63    │ WR120  │ 275/260     │ 0.40 │ 385/364      │ +40% │  │
│  │ WR120B-78    │ WR120  │ 330/295     │ 0.40 │ 462/413      │ +40% │  │
│  │ WR120C-63    │ WR120  │ 325/295     │ 0.40 │ 455/413      │ +40% │  │
│  │ WR120C-78    │ WR120  │ 365/315     │ 0.40 │ 511/441      │ +40% │  │
│  │ ...          │        │             │      │              │      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Drive Systems ────────────────────────────────────────────────────┐  │
│  │ Drive        │ Type      │ Supplier(A) │  x   │ Wholesale(B) │ Δ% │  │
│  │──────────────│───────────│─────────────│──────│──────────────│────│  │
│  │ AOK-35       │ Motorized │ 255         │ 0.35 │ 344          │+35%│  │
│  │ AOK-45       │ Motorized │ 355         │ 0.35 │ 479          │+35%│  │
│  │ WEISIDA-50N  │ Motorized │ 386         │ 0.35 │ 521          │+35%│  │
│  │ SPRING-SM    │ Manual    │ 155         │ 0.30 │ 202          │+30%│  │
│  │ SOLAR-M45    │ Motorized │ 860         │ 0.30 │ 1,118        │+30%│  │
│  │ ...          │           │             │      │              │    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [💾 Save All]  [📤 Publish to Distributors]                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**说明：**
- **Supplier(A)** 列：显示供货商原价（分区间，如 "320/280" 表示 ≤6m²=320、>6m²=280）
- **x** 列：可编辑的加价因子（输入框），支持按系列批量设置
- **Wholesale(B)** 列：实时计算 B = A × (1+x)，只读显示
- **Δ%** 列：加价百分比标签，视觉辅助

### 4.3 批量操作

```
┌─ Batch Set Margin ────────────────────────────────┐
│                                                    │
│  Apply to:  ○ All SKUs                            │
│             ● Selected Series: [WR120 ▼]          │
│             ○ Selected SKUs: [multi-select]        │
│                                                    │
│  Margin Factor x: [ 0.40 ]  (40%)                │
│                                                    │
│  Preview:                                          │
│    6 SKUs will be updated                          │
│    Average wholesale price: +40% over supplier     │
│                                                    │
│  [Cancel]  [Apply]                                 │
└────────────────────────────────────────────────────┘
```

### 4.4 发布到分销商

点击 "Publish to Distributors" 后，系统将：

1. 读取所有 `is_active = true` 的 `platform_wholesale_pricing` 记录
2. 对每个目标分销商租户，计算 B = A × (1+x) 并写入 `distributor_price_list`
3. **不暴露供货商原价 A 和加价因子 x** — 分销商只能看到最终的 B

```javascript
// 伪代码：发布批发价到分销商
async function publishWholesalePrices(targetTenantIds) {
    var wholesalePricing = await loadAllWholesalePricing();  // from platform_wholesale_pricing
    
    for (var tenantId of targetTenantIds) {
        var priceList = [];
        
        Object.keys(zbSKUCatalog).forEach(function(skuKey) {
            var sku = zbSKUCatalog[skuKey];
            var xFactor = wholesalePricing[skuKey]?.margin_factor_x || 0.40;
            
            // 计算批发价区间
            var wholesaleTiers = sku.priceTiers.map(function(tier) {
                return {
                    maxArea: tier.maxArea,
                    wholesalePrice: Math.round(tier.price * (1 + xFactor))
                };
            });
            
            priceList.push({
                tenant_id: tenantId,
                sku_key: skuKey,
                product_type: 'blinds',
                price_tiers: wholesaleTiers,
                source_margin_x: xFactor
            });
        });
        
        // Upsert 到 distributor_price_list
        await supabaseUpsert('distributor_price_list', priceList, ['tenant_id', 'sku_key']);
    }
}
```

---

## 5. 分销商（Omeya-SIN）视角

### 5.1 定价流程变化

**现有流程（Omeya 能看到供货商价 A）：**
```
A (pricing-data.js) → ×0.9 → +运费 → +安装 → ×2.92 → ×0.50 = 售价
     ↑ 透明可见
```

**新流程（Omeya 只看到批发价 B）：**
```
B (distributor_price_list) → +本地成本 → ×(1+y) = 售价 C
     ↑ 批发价，无法反推 A
```

### 5.2 Omeya 的 Step 4 报价计算变化

在新模型下，Omeya 的 `calcStep4Cost()` 输入从供货商价 A 变为批发价 B：

```javascript
// ─── 现有 (直接读供货商价) ───
var supplierUnit = lookupUnitPrice(skuKey, billedArea);   // ← A
var discountedUnit = supplierUnit * 0.9;                   // ← A × 0.9
var shippingUnit = discountedUnit * 0.30;                  // ← 运费
var installUnit = 191;                                     // ← 安装
var cogsUnit = discountedUnit + shippingUnit + installUnit;

// ─── 新模型 (读批发价) ───
var wholesaleUnit = lookupWholesalePrice(skuKey, billedArea);  // ← B (已含 x)
var localShippingUnit = localParams.shippingPerSqm || 0;       // ← 本地运费（可选）
var installUnit = localParams.installPerSqm || 0;              // ← 本地安装费（可选）
var costUnit = wholesaleUnit + localShippingUnit + installUnit; // ← 分销商 COGS
var sellUnit = costUnit * (1 + y);                              // ← 售价 C
```

### 5.3 与现有 `zbBusinessParams` 的对应关系

| 现有参数 | 新模型归属 | 说明 |
|---------|-----------|------|
| `supplierDiscountRate: 0.9` | **Layer 1 (Nestopia-CHN)** | 内含在 x 中，分销商不可见 |
| `shippingCostRate: 0.30` | **Layer 2 (分销商)** | 分销商配置本地运费参数 |
| `installationFeePerSqm: 191` | **Layer 2 (分销商)** | 分销商配置本地安装费 |
| `marketMarkup: 2.92` | **Layer 2 (分销商)** → y 的一部分 | 可简化为单一 y 或保留详细分解 |
| `preferentialDiscount: 0.50` | **Layer 2 (分销商)** → y 的一部分 | 可简化为单一 y 或保留详细分解 |
| `accessoryMarkupRate: 0.13` | **Layer 1 (Nestopia-CHN)** | 内含在 x_acc 中 |

### 5.4 分销商两种模式选择

为兼容现有逻辑，分销商可以在两种定价模式间切换：

| 模式 | 描述 | 公式 | 适用场景 |
|------|------|------|---------|
| **简化模式** | 单一加价因子 y | C = B × (1+y) | 快速报价、经验定价 |
| **详细模式** | 分项成本 + 加价 | C = (B + shipping + install) × markup | 精确成本分析 |

**简化模式** 是推荐默认模式，与流程图一致。**详细模式** 保留现有 `zbBusinessParams` 的分项功能，向后兼容。

---

## 6. 与现有定价引擎的关系

### 6.1 改造范围

```
文件                          改造内容                            优先级
────────────────────────────  ──────────────────────────────────  ──────
js/data/pricing-data.js       新增 getMarginFactor() 工具函数      P0
                              新增 calcWholesalePrice() 工具函数
                              保持供货商价 A 不变
                              
js/steps/step4-quotation.js   calcStep4Cost() 支持双源价格         P0
                              (供货商价 A / 批发价 B)
                              分销商读 B，平台读 A
                              
js/modules/products.js        loadDistributorPriceList()          P1
                              从 DB 加载批发价
                              
company-operations.html       新增 Wholesale Pricing 页面入口      P1
                              
新增: wholesale-pricing.js     Wholesale Pricing 管理页面逻辑      P1
```

### 6.2 数据流向（改造后）

```
┌────────────────────┐
│ pricing-data.js    │
│ 供货商价 A         │
│ (zbSKUCatalog)     │
└────────┬───────────┘
         │
         ├──────── [Nestopia-CHN 视角] ──────────────────────────┐
         │                                                       │
         │  × (1 + x)                                           │
         ▼                                                       │
┌────────────────────┐                                          │
│ Wholesale Pricing  │  ← Nestopia-CHN 管理员设定 x              │
│ 管理界面           │                                           │
└────────┬───────────┘                                          │
         │                                                       │
         │  [Publish]                                            │
         ▼                                                       │
┌────────────────────┐     ┌────────────────────┐               │
│ distributor_price_ │     │ calcStep4Cost()    │               │
│ list (DB)          │────▷│ source = 'A'       │ ← CHN 用 A   │
│ 批发价 B           │     │ 看到原价+加价       │               │
└────────┬───────────┘     └────────────────────┘               │
         │                                                       │
         ├──────── [Omeya-SIN 视角] ─────────────────────────────┘
         │
         ▼
┌────────────────────┐     ┌────────────────────┐
│ Omeya Step 4       │     │ calcStep4Cost()    │
│ 报价面板           │────▷│ source = 'B'       │ ← Omeya 用 B
│ 进货价 = B         │     │ 看不到原价 A        │
└────────────────────┘     └────────────────────┘
```

### 6.3 向后兼容策略

| 场景 | 处理方式 |
|------|---------|
| `platform_wholesale_pricing` 表为空 | 降级为现有逻辑，直接使用 `pricing-data.js` |
| 分销商无 `distributor_price_list` | 降级为现有逻辑（透明供货商价） |
| 部分 SKU 有 x，部分没有 | 未设置 x 的 SKU 使用系列默认值或全局默认值 |
| 旧项目已保存的报价 | 保持原数据不变，不追溯重算 |

---

## 7. 数据隔离 & 权限控制

### 7.1 信息可见性矩阵

| 数据项 | Nestopia-CHN 管理员 | Omeya-SIN 管理员 | Omeya 业务员 | 最终客户 |
|--------|:------------------:|:----------------:|:------------:|:-------:|
| 供货商原价 A | ✅ | ❌ | ❌ | ❌ |
| 加价因子 x | ✅ | ❌ | ❌ | ❌ |
| 批发价 B | ✅ | ✅ | ✅ | ❌ |
| 分销商加价 y | ✅ (审计) | ✅ | ✅ | ❌ |
| 最终售价 C | ✅ (审计) | ✅ | ✅ | ✅ (报价单) |
| 分销商利润率 | ❌ | ✅ | 🔒 (权限) | ❌ |

### 7.2 Supabase RLS 策略摘要

```sql
-- platform_wholesale_pricing: 仅 Nestopia-CHN
POLICY: tenant_slug = 'nestopia-chn'

-- distributor_price_list: 平台全权 + 分销商只读自己的
POLICY (SELECT): tenant_id = jwt.tenant_id  OR  tenant_slug = 'nestopia-chn'
POLICY (INSERT/UPDATE/DELETE): tenant_slug = 'nestopia-chn'
```

### 7.3 前端数据隔离

```javascript
// 在 Omeya-SIN 租户中，pricing-data.js 的供货商原价不应暴露给报价引擎
// 报价引擎根据 tenant_slug 决定价格来源

function getPriceSource(tenantSlug) {
    if (tenantSlug === 'nestopia-chn') {
        return 'supplier';  // 平台管理员看到供货商价 A
    }
    return 'wholesale';     // 分销商看到批发价 B
}
```

> **⚠️ 注意**: 当前架构中 `pricing-data.js` 是前端静态文件，所有租户都能读取。
> **短期方案**: 分销商前端不加载 `pricing-data.js`，或加载后 UI 层不显示原价。
> **长期方案**: 将供货商价格迁移至 Supabase（受 RLS 保护），前端仅通过 API 获取允许的价格层级。

---

## 8. 实施路线图

### Phase 1: 数据层 (1-2 周)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1.1 | 创建 `platform_wholesale_pricing` 表 + RLS | SQL migration |
| 1.2 | 创建 `distributor_price_list` 表 + RLS | SQL migration |
| 1.3 | 为所有 15 个 ZB SKU 设定初始 x 值 | Seed data |
| 1.4 | 在 `pricing-data.js` 中新增 `calcWholesalePrice()` 工具函数 | JS |

### Phase 2: Nestopia-CHN 管理界面 (2-3 周)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 2.1 | 新增 `wholesale-pricing.js` 模块 | JS 模块 |
| 2.2 | 在 `company-operations.html` 添加 Wholesale Pricing 页面模板 | HTML |
| 2.3 | 实现 SKU 定价表 CRUD + 批量设置 | UI + CRUD |
| 2.4 | 实现 "Publish to Distributors" 功能 | JS + DB |

### Phase 3: 分销商报价集成 (1-2 周)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 3.1 | `calcStep4Cost()` 支持双源价格 (A/B) | JS 改造 |
| 3.2 | 分销商加载 `distributor_price_list` | JS + DB |
| 3.3 | Step 4 面板显示进货价(B)而非供货商价(A) | UI 调整 |
| 3.4 | 报价单锁价机制（快照 B 到 `quotation_data`） | JS |

### Phase 4: 审计 & 优化 (持续)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 4.1 | 价格变更历史日志 | DB + UI |
| 4.2 | 供货商价格从 JS 迁移到 Supabase | 数据迁移 |
| 4.3 | 批量导入供货商价格表 (Excel/CSV) | 导入功能 |

---

## 9. 算例演示

### 9.1 WR120A-63 防风卷帘 — 完整定价链

**供货商报价 (A):**

| 面积区间 | 供货商单价 A (RMB/m²) |
|---------|---------------------|
| ≤6 m² | 320 |
| >6 m² | 280 |

**Nestopia-CHN 批发价 (B), x = 0.40:**

| 面积区间 | B = A × 1.40 (RMB/m²) |
|---------|----------------------|
| ≤6 m² | 320 × 1.40 = **448** |
| >6 m² | 280 × 1.40 = **392** |

**Omeya-SIN 零售价 (C), y = 0.46:**

| 面积区间 | C = B × 1.46 (RMB/m²) | C (SGD/m², @5.36) |
|---------|----------------------|-------------------|
| ≤6 m² | 448 × 1.46 = **654** | 654 / 5.36 = **122** |
| >6 m² | 392 × 1.46 = **572** | 572 / 5.36 = **107** |

### 9.2 完整项目报价示例

**项目参数:**
- SKU: WR120A-63
- 5 个窗户 Openings，每个 2m × 3m = 6 m²
- 电机: AOK-45 (供货商价 355 RMB)

**Nestopia-CHN 视角 (x_blinds = 0.40, x_drive = 0.35):**

| 项目 | 供货商价(A) | x | 批发价(B) | 数量 | 小计(B) |
|------|-----------|---|----------|------|--------|
| WR120A-63 卷帘 (≤6m²) | 320/m² | 0.40 | 448/m² | 5×6=30m² | 13,440 |
| AOK-45 电机 | 355/套 | 0.35 | 479/套 | 5 套 | 2,395 |
| **合计** | | | | | **15,835 RMB** |

**Omeya-SIN 视角 (y = 0.46):**

| 项目 | 进货价(B) | 数量 | 进货小计 | y | 售价(C) |
|------|----------|------|---------|---|--------|
| WR120A-63 卷帘 | 448/m² | 30m² | 13,440 | 0.46 | 19,622 |
| AOK-45 电机 | 479/套 | 5 套 | 2,395 | 0.46 | 3,497 |
| **合计** | | | **15,835** | | **23,119 RMB** |
| **换算 SGD** | | | **2,954 SGD** | | **4,313 SGD** |

**各方利润:**

| 角色 | 成本 | 收入 | 利润 | 利润率 |
|------|------|------|------|-------|
| Nestopia-CHN | 11,325 RMB (A) | 15,835 RMB (B) | 4,510 RMB | 28.5% |
| Omeya-SIN | 15,835 RMB (B) | 23,119 RMB (C) | 7,284 RMB | 31.5% |

### 9.3 驱动系统单独定价

| 驱动系统 | 供货商价(A) RMB | x_drive | 批发价(B) RMB |
|---------|---------------|---------|-------------|
| AOK-35 | 255 | 0.35 | 344 |
| AOK-45 | 355 | 0.35 | 479 |
| K45-XIAOMI | 250 | 0.35 | 338 |
| WEISIDA-20N | 320 | 0.35 | 432 |
| WEISIDA-50N | 386 | 0.35 | 521 |
| SPRING-SM | 155 | 0.30 | 202 |
| SPRING-LG | 195 | 0.30 | 254 |
| BEAD-CHAIN | 55 | 0.30 | 72 |
| SOLAR-M45 | 860 | 0.30 | 1,118 |

---

## 10. 开放问题

| # | 问题 | 建议 | 状态 |
|---|------|------|------|
| 1 | x 值是否需要按目标分销商不同而异？（同一 SKU 对不同分销商给不同 x） | 初期统一 x，后期可扩展为 per-distributor x | 待定 |
| 2 | 供货商价格更新（换版报价表）如何处理已发出的报价？ | 已发出报价使用锁价快照，不受价格更新影响 | 待定 |
| 3 | 是否需要支持多供货商（不同 SKU 来自不同供货商）？ | 当前为单一供货商，数据模型预留 supplier_id 字段 | 待定 |
| 4 | 面料升级费和高度附加费是否也乘以 (1+x)？ | 建议是 — 这些是供货商报价的一部分 | 待定 |
| 5 | `pricing-data.js` 长期是否迁移到 Supabase 以实现真正的数据隔离？ | 是，Phase 4 规划 | 待定 |
| 6 | 分销商的 y 是简化的单一系数，还是保留现有的详细分解（运费+安装+加价+折扣）？ | 默认提供简化模式 y，可选切换为详细模式 | 待定 |

---

## 11. 文档架构关系

```
DATA_AI_STRATEGY.md (v3.1)                ← 全局数据战略
    │
    ├── PRODUCT_MASTER_DATA_ARCHITECTURE.md ← 产品主数据加载架构
    │       │
    │       └── ★ PRICING_CHAIN_ARCHITECTURE.md ← 本文档
    │               多层定价链设计（供货商 → 平台 → 分销商 → 客户）
    │
    ├── SECURITY_STRATEGY.md               ← 安全策略（RLS, 多租户隔离）
    │
    └── STORAGE_STRATEGY.md                ← 存储架构（Supabase + R2）
```

---

**文档负责人**: Nestopia 产品 & 技术团队  
**审阅周期**: 重大定价策略变更时立即更新  
**下一步**: 确认设计后进入 Phase 1 数据层实施
