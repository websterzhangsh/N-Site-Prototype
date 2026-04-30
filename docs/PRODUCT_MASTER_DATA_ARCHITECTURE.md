# 产品主数据加载架构

> **版本:** 1.0 | **日期:** 2026-04-30 | **状态:** 已实施  
> **关联文档:** [STORAGE_STRATEGY.md](STORAGE_STRATEGY.md), [SUPABASE_ADOPTION.md](SUPABASE_ADOPTION.md), [DATA_AI_STRATEGY.md](DATA_AI_STRATEGY.md)

---

## 1. 概述

产品目录（Product Catalog）是 Nestopia B2B 平台的**核心主数据**，贯穿 6-Step 工作流的多个环节：

| 消费场景 | 模块 | 依赖字段 |
|---------|------|---------|
| Step 2 - AI 设计选品 | `step2-design.js` | `name`, `series`, `control`, `leadTime`, `cost.tiers` |
| Products 页面 | `products.js` | 完整产品对象 |
| 侧栏项目显示 | `overview.js` | `name`, `icon`, `category` |
| 报价计算 | `quotation.js` | `cost`, `price`, `optionSet` |
| B2B Chatbot | `chatbot.js` | 产品知识上下文 |

由于产品数据来自**三个不同的数据源**，且加载时序严格依赖 `<script>` 标签顺序，本文档记录完整的数据加载架构、合并策略、以及历史踩坑经验。

---

## 2. 三层数据加载架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    productCatalog（运行时内存）                    │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │ Layer 1       │  │ Layer 2       │  │ Layer 3             │  │
│  │ 静态基线数据    │→│ ZB SKU 注入    │→│ Supabase 增量加载    │  │
│  │               │  │               │  │                     │  │
│  │ 10 个标准产品   │  │ 15+ 个 ZB SKU  │  │ 租户自定义产品       │  │
│  │ Sunroom(6)    │  │ WR100 系列     │  │ 仅添加新产品         │  │
│  │ Pergola(2)    │  │ WR120 系列     │  │ 不覆盖静态产品       │  │
│  │ ADU(2)        │  │ WR150 系列     │  │                     │  │
│  │               │  │ WR200 系列     │  │                     │  │
│  └───────┬───────┘  └───────┬───────┘  └──────────┬──────────┘  │
│          │                  │                      │             │
│    ★ 权威数据源        动态转换注入           增量补充（仅新产品）    │
│    (不可被覆盖)      (IIFE 初始化时)          (异步, initProductsPage) │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据优先级

```
优先级（高 → 低）:

  Layer 1: 静态产品目录     ★ 最高优先级 — 权威数据源，绝不被覆盖
      ↓
  Layer 2: ZB SKU 注入     中等优先级 — 动态生成，写入同一 productCatalog 对象
      ↓
  Layer 3: Supabase DB     最低优先级 — 仅添加 Layer 1/2 中不存在的新产品
```

**核心原则**: 静态文件中的产品是**真理之源 (Source of Truth)**。DB 中可能存储了缺字段的旧版本数据，不允许覆盖静态版本。

---

## 3. 各层详细说明

### 3.1 Layer 1: 静态基线数据（product-catalog.js）

**文件**: `js/data/product-catalog.js`  
**加载方式**: `<script>` 同步加载  
**命名空间**: `Nestopia.data.productCatalog`

```javascript
// product-catalog.js
(function() {
    var N = window.Nestopia;
    N.data.productCatalog = {
        'sr-l-classic': {
            name: 'L-Classic Sunroom',
            category: 'sunroom',
            catLabel: 'Sunroom',
            series: 'Classic Series',
            control: 'Manual',
            leadTime: '3-4 weeks',
            cost: {
                unit: 'sqft', currency: 'USD',
                tiers: [
                    { span: '≤4m', priceRange: [26, 30] },
                    { span: '≤5m', priceRange: [28, 32] },
                    // ...
                ]
            },
            price: { /* 零售/批发价格 */ }
        },
        // 共 10 个产品: Sunroom(6) + Pergola(2) + ADU(2)
    };
})();
```

**数据来源**: 手动从 `产品选型与报价表.xlsx` 转录，包含完整的 `cost`/`price` 定价层级。

**产品清单 (10 SKUs)**:

| 产品 Key | 产品名 | 类别 | 系列 |
|----------|-------|------|------|
| `sr-l-classic` | L-Classic Sunroom | Sunroom | Classic |
| `sr-l-smart` | L-Smart Sunroom | Sunroom | Smart |
| `sr-l-pro` | L-Pro Sunroom | Sunroom | Pro |
| `sr-m-classic` | M-Classic Sunroom | Sunroom | Classic |
| `sr-m-smart` | M-Smart Sunroom | Sunroom | Smart |
| `sr-m-pro` | M-Pro Sunroom | Sunroom | Pro |
| `pg-basic` | Basic Pergola | Pergola | Basic |
| `pg-classic` | Classic Pergola | Pergola | Classic |
| `adu-studio` | Studio ADU | ADU | Studio |
| `adu-2bed` | 2-Bedroom ADU | ADU | 2-Bed |

### 3.2 Layer 2: ZB SKU 动态注入（pricing-data.js → products.js）

**数据源文件**: `js/data/pricing-data.js`  
**转换逻辑**: `products.js` → `_injectZBProducts()`  
**触发时机**: IIFE 初始化时同步执行（第 86 行）

Zip Blinds 产品源自独立的 SKU 目录（`zbSKUCatalog`），数据格式与标准 `productCatalog` 不同。`_injectZBProducts()` 函数负责将 ZB SKU 转换为标准格式并注入：

```javascript
// products.js — _injectZBProducts()
function _injectZBProducts() {
    var skuCat = window.zbSKUCatalog;       // 来自 pricing-data.js
    var driveCat = window.zbDriveSystemCatalog;
    if (!skuCat || !productCatalog) return;

    Object.keys(skuCat).forEach(function(key) {
        var s = skuCat[key];
        // 判断驱动类型（Motorized/Manual）
        var hasMotor = /* ... 遍历 drives 数组 ... */;
        // 转换为标准 productCatalog 格式
        productCatalog[key] = {
            name: s.name,
            category: 'blinds',
            catLabel: 'Zip Blinds',
            series: s.series,
            control: hasMotor ? 'Motorized' : 'Manual',
            leadTime: '2-3 weeks',
            cost: {
                unit: 'm²', currency: 'RMB',
                tiers: s.priceTiers.map(/* ... 转换面积区间定价 ... */)
            },
            _zbSKU: key,     // 保留原始 SKU 引用
            _zbData: s        // 保留原始数据（用于详细定价面板）
        };
        productIcons[key] = '/images/products/icons/zip-blinds.png';
    });

    // 向后兼容别名
    productCatalog['zb-manual']    = productCatalog[firstKey];
    productCatalog['zb-motorized'] = productCatalog[firstKey];
}
_injectZBProducts();  // IIFE 内同步调用
```

**数据转换映射**:

| zbSKUCatalog 字段 | productCatalog 字段 | 转换逻辑 |
|-------------------|--------------------|---------| 
| `name` / `nameZh` | `name` / `nameZh` | 直接映射 |
| `series` | `series` | 直接映射 |
| `housing` | `shape` | 直接映射 |
| `drives[]` + `zbDriveSystemCatalog` | `control` | 遍历判断 `type === 'motorized'` |
| `priceTiers[]` | `cost.tiers[]` | 格式转换：`{ maxArea, price }` → `{ span, priceRange }` |
| `features` | `desc` | 直接映射 |

**ZB SKU 产品清单 (15 SKUs)**:

| 系列 | 型号示例 | 面料 | 护罩形状 |
|------|---------|------|---------|
| WR100 | WR100A-63, WR100A-70, WR100A-73 | NP4000/NP5000/NP6000 | 100×100mm 方形 |
| WR120 | WR120A-63, WR120A-70, WR120A-73 | NP4000/NP5000/NP6000 | 120×120mm 方形 |
| WR150 | WR150C-63, WR150C-73 | NP4000/NP6000 | 150×80mm 弧形 |
| WR200 | WR200-70, WR200-70R | NP5000 | 200×135mm 大弧形 |

### 3.3 Layer 3: Supabase 增量加载（tenant_products 表）

**数据库表**: `tenant_products`  
**加载函数**: `loadProductCatalogFromDB()`  
**触发时机**: `initProductsPage()` — 用户导航到 Products 页面时异步调用

```javascript
// products.js — loadProductCatalogFromDB()
async function loadProductCatalogFromDB() {
    if (typeof NestopiaDB === 'undefined') return false;
    const res = await fetch(
        NestopiaDB.url + '/rest/v1/tenant_products?tenant_id=eq.' + PRODUCT_TENANT_ID
    );
    const rows = await res.json();
    if (rows.length === 0) return false;

    // ★ 核心合并策略: 仅添加新产品，不覆盖已有产品
    let added = 0;
    rows.forEach(r => {
        if (!productCatalog[r.product_key]) {    // ← 关键判断
            productCatalog[r.product_key] = r.product_data;
            added++;
        }
        // 图标始终从 DB 更新（不影响产品数据完整性）
        if (r.product_data.icon) productIcons[r.product_key] = r.product_data.icon;
        else if (r.product_data.image) productIcons[r.product_key] = r.product_data.image;
    });
    return true;
}
```

**DB Seed 机制**: 首次加载 Products 页面时，如果 DB 中无数据，会将当前内存中的 `productCatalog` 全量写入 `tenant_products` 表（`seedProductCatalogToDB()`），使用 `Prefer: resolution=ignore-duplicates` 避免重复写入。

**tenant_products 表结构**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `tenant_id` | UUID | 租户 ID |
| `product_key` | TEXT | 产品唯一标识（如 `sr-l-classic`） |
| `product_data` | JSONB | 完整产品对象 |
| `sort_order` | INTEGER | 排序序号 |
| `is_active` | BOOLEAN | 是否激活 |

---

## 4. 脚本加载顺序

**关键约束**: 三层数据的加载依赖于 `company-operations.html` 中 `<script>` 标签的严格顺序。

```html
<!-- company-operations.html 中的加载顺序 (行号约 4390-4420) -->

<!-- 1. 命名空间初始化 -->
<script src="js/namespace.js"></script>           <!-- 创建 window.Nestopia = {} -->

<!-- 2. Layer 1 + Layer 2 数据源 -->
<script src="js/data/pricing-data.js"></script>   <!-- 设置 window.zbSKUCatalog -->
<script src="js/data/product-catalog.js"></script><!-- 设置 Nestopia.data.productCatalog -->

<!-- 3. 产品管理模块（Layer 2 注入 + Layer 3 加载逻辑） -->
<script src="js/modules/products.js"></script>    <!-- 读取 Layer 1, 注入 Layer 2 -->
```

**执行时序图**:

```
时间 ─────────────────────────────────────────────────────────→

[1] namespace.js 加载
    └─ window.Nestopia = {}
    └─ Nestopia.data = {}

[2] pricing-data.js 加载
    └─ window.zbSKUCatalog = { WR100A-63: {...}, ... }       (15 SKUs)
    └─ window.zbDriveSystemCatalog = { AOK-35: {...}, ... }  (12 drives)

[3] product-catalog.js 加载
    └─ Nestopia.data.productCatalog = { sr-l-classic: {...}, ... }  (10 products)

[4] products.js IIFE 立即执行
    ├─ var productCatalog = Nestopia.data.productCatalog || {}   ← 读取 Layer 1
    ├─ _injectZBProducts()                                       ← 注入 Layer 2 (15 ZB SKUs)
    ├─ Object.defineProperty(window, 'productCatalog', {...})    ← 暴露全局 getter/setter
    └─ window.initProductsPage = initProductsPage                ← 注册 Products 页面入口

[5] DOMContentLoaded（稍后）
    └─ 用户导航到 Products 页面
        └─ initProductsPage()
            ├─ loadProductCatalogFromDB()                        ← Layer 3: 增量加载
            │   └─ DB 有数据？ → 仅添加新产品
            │   └─ DB 无数据？ → return false
            ├─ seedProductCatalogToDB()                           ← 首次：全量写入 DB
            └─ renderProductList()                                ← 渲染产品网格
```

---

## 5. 全局访问机制

`productCatalog` 变量定义在 `products.js` 的 IIFE 内部，通过 `Object.defineProperty` 创建全局访问代理：

```javascript
// products.js 第 1293 行
Object.defineProperty(window, 'productCatalog', {
    get: function() { return productCatalog; },   // 代理到 IIFE 内部变量
    set: function(v) { productCatalog = v; },
    configurable: true
});
```

这意味着：
- 其他模块（`step2-design.js`、`overview.js`）通过 `window.productCatalog` 访问时，实际读取的是 IIFE 内同一个对象引用
- Layer 2/3 对 `productCatalog` 的修改对所有消费者立即可见
- 同时也注册到命名空间: `Nestopia.modules.products.productCatalog`

**安全访问模式**（所有消费者必须遵循）:

```javascript
// ✅ 正确：防御性访问
var product = (typeof productCatalog !== 'undefined' && productCatalog[catalogId]) || null;

// ❌ 错误：直接访问（如果 products.js IIFE 崩溃，productCatalog 不存在）
var product = productCatalog[catalogId];  // → 可能 TypeError
```

---

## 6. 合并策略详解

### 6.1 策略对比

| 策略 | 描述 | 当前采用 | 风险 |
|------|------|---------|------|
| **全量覆盖** | DB 数据完全替换内存数据 | ❌ | DB 中旧版本缺字段 → 渲染崩溃 |
| **按 key 合并** | DB 数据按 key 逐个覆盖 | ❌ | 同上，单个产品被覆盖 |
| **仅添加新产品** | DB 中已存在于静态目录的 key 跳过 | ✅ | 安全 — 静态数据不受影响 |

### 6.2 当前策略：Additive-Only（仅新增）

```
Layer 1 (静态)                  Layer 3 (DB)
┌──────────────────┐            ┌──────────────────┐
│ sr-l-classic ✓   │            │ sr-l-classic      │ → 跳过（已存在）
│ sr-m-classic ✓   │            │ sr-m-classic      │ → 跳过（已存在）
│ pg-basic     ✓   │            │ pg-basic          │ → 跳过（已存在）
│                  │            │ custom-product-1  │ → ✅ 添加（新产品）
│                  │            │ custom-product-2  │ → ✅ 添加（新产品）
└──────────────────┘            └──────────────────┘
```

### 6.3 图标合并例外

即使产品数据不被覆盖，`productIcons` 映射表始终从 DB 更新。这允许租户通过 DB 自定义产品图标，而不影响产品的核心数据结构：

```javascript
// 图标更新不受 additive-only 限制
if (r.product_data.icon) productIcons[r.product_key] = r.product_data.icon;
else if (r.product_data.image) productIcons[r.product_key] = r.product_data.image;
```

---

## 7. 历史问题与经验教训

### 7.1 TDZ 崩溃（2026-04-30 修复，Commit `330341f`）

**问题**: `let productCatalog = Nestopia.data.productCatalog;` 使用了 `let` 声明。如果初始化表达式在执行到此行之前被其他代码引用（例如 `_injectZBProducts()` 在 hoisting 阶段尝试访问），会触发 **Temporal Dead Zone (TDZ)** 错误：

```
Uncaught ReferenceError: Cannot access 'productCatalog' before initialization
  at products.js:13
  at Array.forEach
  at _injectZBProducts (products.js:27)
```

**影响链**:
```
TDZ 崩溃 → IIFE 中断执行 → Object.defineProperty 未执行
→ window.productCatalog = undefined → window.initProductsPage = undefined
→ Products 页面空白 + Step 2 产品 spec 全部显示 "—"
```

**修复**: `let` → `var`（`var` 不存在 TDZ，hoisting 阶段值为 `undefined` 而非抛错）+ 防御性初始化：

```javascript
// ★ 修复后
var productCatalog = (Nestopia && Nestopia.data && Nestopia.data.productCatalog) || {};
```

**经验规则**: 在 IIFE 内部、被同 scope 其他函数引用的变量，**必须使用 `var`** 以避免 TDZ。或者确保函数声明（不是函数表达式）在引用变量之后。

### 7.2 DB 覆盖导致字段丢失（2026-04-30 修复，Commit `acb5183`）

**问题**: 初版 `loadProductCatalogFromDB()` 使用全量覆盖策略：

```javascript
// ❌ 旧逻辑（全量覆盖）
rows.forEach(r => {
    productCatalog[r.product_key] = r.product_data;  // 覆盖静态版本
});
```

当 DB 中的产品数据是较早 seed 的版本（缺少后续新增的 `cost.tiers` 结构），覆盖后导致 Step 2 的 `product.cost.tiers[0].priceRange` 访问失败。

**修复**: 改为 Additive-Only 策略（详见 §6.2）。

### 7.3 Stats 字段空值崩溃（2026-04-30 修复，Commit `acb5183`）

**问题**: `step2-design.js` 中的 `selectStep2Product()` 直接访问深层嵌套字段：

```javascript
// ❌ 无空值保护
var tier0 = product.cost.tiers[0].priceRange;  // 任一层为 null → TypeError
```

**修复**: 完整的空值安全链 + try-catch：

```javascript
// ✅ 修复后
try {
    var tier0 = (product.cost && product.cost.tiers && product.cost.tiers[0])
              ? product.cost.tiers[0].priceRange : null;
    if (controlEl) controlEl.textContent = product.control || '—';
    if (priceEl) priceEl.textContent = (tier0 && tier0[0] != null)
              ? ('$' + tier0[0] + '-' + tier0[1]) : '—';
} catch (e) {
    console.warn('[Step2] Stats update error for', catalogId, e);
}
```

---

## 8. 关键代码位置索引

| 模块 | 文件路径 | 关键行号 | 职责 |
|------|---------|---------|------|
| **静态产品目录** | `js/data/product-catalog.js` | 10 | `N.data.productCatalog = { ... }` |
| **ZB SKU 目录** | `js/data/pricing-data.js` | 45 | `zbSKUCatalog = { ... }` (15 SKUs) |
| **ZB 驱动系统目录** | `js/data/pricing-data.js` | 19 | `zbDriveSystemCatalog = { ... }` (12 drives) |
| **产品目录初始化** | `js/modules/products.js` | 21 | `var productCatalog = ...` |
| **ZB 注入** | `js/modules/products.js` | 24-86 | `_injectZBProducts()` |
| **DB 加载** | `js/modules/products.js` | 93-119 | `loadProductCatalogFromDB()` |
| **DB Seed** | `js/modules/products.js` | 122-147 | `seedProductCatalogToDB()` |
| **Products 页面入口** | `js/modules/products.js` | 612-625 | `initProductsPage()` |
| **全局 getter/setter** | `js/modules/products.js` | 1293-1297 | `Object.defineProperty(window, 'productCatalog')` |
| **产品图标映射** | `js/modules/products.js` | 597-610 | `productIcons = { ... }` |
| **Step 2 选品统计** | `js/steps/step2-design.js` | 290+ | `selectStep2Product()` |
| **脚本加载顺序** | `company-operations.html` | 4400-4412 | `<script>` 标签顺序 |

---

## 9. 扩展规划

### 9.1 短期（当前状态）

- 静态文件作为权威数据源，DB 仅做增量补充
- 租户自定义产品通过 DB CRUD（Add/Edit/Delete Modal）管理
- ZB SKU 从 `pricing-data.js` 动态转换

### 9.2 中期（多租户上线后）

| 改进项 | 描述 |
|-------|------|
| **租户级产品目录分离** | 每个租户维护独立的产品集，不再共享静态基线 |
| **DB 升级为权威源** | 静态文件仅作为 fallback/seed，DB 产品数据成为真理之源 |
| **版本化产品数据** | 每次编辑创建新版本，支持回滚 |

### 9.3 长期（商业规模化）

| 改进项 | 描述 |
|-------|------|
| **产品数据 API** | 后端 API 统一管理产品 CRUD，替代前端直连 DB |
| **批量导入** | 支持 Excel/CSV 批量导入产品数据 |
| **多语言支持** | 产品名称、描述支持 i18n |
| **变更审计日志** | 记录谁在什么时间修改了哪个产品 |

---

## 10. 文档架构关系

```
DATA_AI_STRATEGY.md (v3.1)           ← 全局数据战略（北极星）
    │
    ├── STORAGE_STRATEGY.md (v1.0)   ← 存储选型 & 架构
    │       │
    │       ├── SUPABASE_ADOPTION.md  ← Supabase 实施进度
    │       │
    │       └── ★ PRODUCT_MASTER_DATA_ARCHITECTURE.md ← 本文档
    │                                   产品主数据加载架构
    │
    ├── KB_STORAGE_DESIGN.md          ← KB 存储架构
    │
    └── ZB_KB_KNOWLEDGE_AGENT_DESIGN.md ← ZB KB 专项
```

---

**文档负责人**: Nestopia 产品 & 技术团队  
**审阅周期**: 每季度一次；产品数据架构重大变更时立即更新
