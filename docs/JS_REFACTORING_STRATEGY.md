# JS 代码重构策略
## company-operations.html 模块化拆分方案

> **文档版本**: v1.4
> **创建日期**: 2026-04-17
> **更新日期**: 2026-04-19
> **状态**: ✅ Phase 0-4B 已完成，Phase 5 待执行
> **目标文件**: `company-operations.html`（起始 16,605 行 → 当前 7,351 行）

### 决策记录

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | Phase 5（构建工具）范围 | Phase 1-4 先行，Phase 5 作为独立里程碑 |
| 2 | 文件版本管理 `?v=hash` | 从 Phase 1 起引入 |
| 3 | 模块封装模式 | **命名空间模式** `window.Nestopia.xxx`（更整洁、可读性强） |
| 4 | 每 Phase 验证截图 | 是，每个 Phase 完成后生成 |

---

## 1. 现状分析

### 1.1 当前架构

```
company-operations.html (16,605 行)
├── <head> CSS / Tailwind 配置                    (1-595)        ~595 行
├── <script> Supabase SDK CDN                     (596)          1 行
├── <script> NestopiaDB 初始化                     (597-671)      75 行
├── <script> NestopiaStorage 存储层                (672-914)      243 行
├── <body> HTML 模板（11 个页面）                   (916-4642)     3,727 行
└── <script> 主应用逻辑                            (4643-16493)   11,851 行
    ├── 认证 / 租户 / i18n                                        ~164 函数行
    ├── 页面路由                                                    ~611 函数行
    ├── AI Designer Agent                                          ~624 函数行
    ├── Pricing Agent（6 策略引擎）                                ~496 函数行
    ├── Compliance / CS Agent                                      ~523 函数行
    ├── Products CRUD                                              ~1,275 函数行
    ├── Customers CRUD                                             ~568 函数行
    ├── Knowledge Base                                             ~458 函数行
    ├── Step 配置数据                                               ~990 函数行
    ├── Step 2-4 实现                                              ~1,776 函数行
    ├── Project CRUD                                               ~770 函数行
    ├── Workflow Pipeline                                          ~540 函数行
    ├── Quotation Editor                                           ~427 函数行
    └── Utilities / Init                                           ~668 函数行
```

### 1.2 痛点

| 问题 | 影响 |
|------|------|
| 16K+ 行单体文件 | 难以定位代码、容易冲突、AI 辅助工具上下文超限 |
| 每次修改需 Python 脚本 | Edit tool 无法安全处理，开发效率极低 |
| HTML + CSS + JS + 数据混合 | 无关注点分离，无法独立测试 |
| 全局变量通信 | 函数间耦合度高，难以重构 |
| 重复的 Supabase 模式 | 每个 CRUD 手写 `.from().select()`，缺少抽象层 |
| 无法单独缓存 JS | 任何改动都使整个 HTML 缓存失效 |

### 1.3 技术约束

| 约束 | 详情 |
|------|------|
| **部署方式** | Cloudflare Pages 静态部署 |
| **构建工具** | Vite 仅处理 `index.html`（React 着陆页）；`company-operations.html` 直接 `cp` 到 `dist/`，**不经过 Vite** |
| **现有模块** | `js/supabase-config.js` + `js/supabase-storage.js` 已存在但未被 company-operations.html 引用 |
| **脚本加载方式** | 经典 `<script>` 标签（非 ES Module） |
| **全局命名空间** | 所有函数直接暴露在 `window` 上，HTML `onclick` 直接调用 |
| **Tailwind** | 通过 CDN 运行时编译（非构建时） |
| **浏览器兼容** | 需支持现代浏览器（Chrome/Safari/Edge 最新 2 版本） |

### 1.4 后端架构（不受本次重构影响）

后端代码已独立拆分，不在 `company-operations.html` 内：

| 层 | 位置 | 行数 | 说明 |
|----|------|------|------|
| Cloudflare Workers | `functions/api/` + `functions/lib/` | 940 | AI 设计生成 API、LLM Chat、Qwen 适配器 |
| Supabase Edge Functions | `supabase/functions/` | 474 | 认证登录、JWT 中间件、租户配置 |
| TypeScript 服务层 | `src/` | 858 | LLM 适配器（与 Workers 有重叠，Phase 5 统一） |
| 数据库 Schema | `database/` + `supabase/migrations/` | 2,989 | 完整 Schema + 4 个迁移 |

---

## 2. 目标架构

### 2.1 命名空间设计（`window.Nestopia`）

所有提取的模块统一挂载到 `window.Nestopia` 命名空间：

```javascript
window.Nestopia = {
    // ── 核心层 (js/core/) ──
    db:       { getClient, isConnected, getTenantId, ... },
    storage:  { uploadProjectFile, getProjectFiles, ... },
    auth:     { checkAuth, getAuthData, logout, ... },
    tenant:   { getCurrentSlug, getUnitSystem, configs, projectsMap, ... },
    i18n:     { getLocalizedName, getQuotText, quotI18n, ... },
    router:   { navigateToPage, navigateToProject, renderSidebar, ... },

    // ── 数据层 (js/data/) ──
    data: {
        i18nDict:      { quotI18n },
        pricing:       { zbProductTiers, zbDriveSystems, ... },
        productCatalog: { ... },
        stepConfig:    { STEP_DETAIL_CONFIG, ZB_STEP_CONFIGS, ... },
        intakeFields:  { INTAKE_MODULE_FIELDS },
        seedProjects:  { greenscapeProjects, omeyaSinProjects, ... },
    },

    // ── 功能模块 (js/modules/) ──
    products:  { init, load, save, delete, render, filter, ... },
    customers: { init, load, save, delete, render, ... },
    orders:    { init, filter, showDetail, ... },
    kb:        { getDocuments, upload, delete, search, ... },
    projects:  { generateId, create, persist, load, render, ... },
    workflow:  { renderPipeline, advanceStep, openDetail, ... },
    overview:  { init, getOrdersData, getCustomersData, ... },

    // ── Agent 模块 (js/agents/) ──
    agents: {
        designer:   { init, selectProduct, handleGenerate, ... },
        pricing:    { init, calculate, selectTier, ... },
        compliance: { init, checkCompliance, ... },
        cs:         { init, updateDetail, sendReply, ... },
    },

    // ── Step 实现 (js/steps/) ──
    steps: {
        step2: { initDesigner, loadData, saveToProject, ... },
        step3: { initMeasurement, rebuild, save, addObstacle, ... },
        step4: { getState, calcCost, togglePanel, loadFromDB, ... },
    },

    // ── 工具 (js/utils/) ──
    utils: {
        helpers:   { getPriorityBadge, getStageBadge, showToast, ... },
        quotEditor:{ open, close, addLineItem, calcTotal, preview, ... },
        chatbot:   { init, ... },
    }
};
```

### 2.2 HTML onclick 兼容策略（关键！）

当前 HTML 中有 **174 个 `onclick` 内联调用**（50+ 个不同函数）。
采用**两阶段迁移**确保零中断：

**阶段 A（Phase 1-4 期间）: 全局别名桥接**

每个模块文件末尾自动注册全局别名，HTML `onclick` **无需修改**：

```javascript
// js/modules/projects.js 末尾
(function() {
    var ns = Nestopia.projects;
    // 全局别名桥接 — HTML onclick 保持原调用方式
    window.selectProject       = ns.selectProject;
    window.openCreateProjectModal = ns.openCreateProjectModal;
    window.submitCreateProject = ns.submitCreateProject;
    window.filterProjectList   = ns.filterProjectList;
    // ... 所有 onclick 中引用的函数
})();
```

这样 HTML 中的 `onclick="selectProject('xxx')"` 继续工作，
同时 JS 代码可以使用 `Nestopia.projects.selectProject('xxx')` 的整洁写法。

**阶段 B（Phase 4 完成后的可选清理）: 迁移 onclick 到命名空间**

```html
<!-- 之前 -->
<button onclick="selectProject('PRJ-001')">View</button>

<!-- 之后 -->
<button onclick="Nestopia.projects.selectProject('PRJ-001')">View</button>
```

阶段 B 完成后移除全局别名，实现完全整洁的命名空间。
**阶段 B 为可选步骤**，可在 Phase 4 之后独立执行。

### 2.3 拆分后文件结构

```
company-operations.html          <-- 精简为 HTML 模板 + 引导脚本（~5,000 行）
|
+-- js/core/
|   +-- namespace.js             <-- [新增] Nestopia 命名空间初始化
|   +-- supabase-config.js       <-- Supabase 客户端初始化
|   +-- supabase-storage.js      <-- 存储操作层
|   +-- auth.js                  <-- 认证 / 会话管理
|   +-- tenant.js                <-- 多租户配置 / slug 管理
|   +-- i18n.js                  <-- 国际化字典 + 工具函数
|   +-- router.js                <-- 页面路由 / 导航
|
+-- js/data/
|   +-- i18n-dict.js             <-- 双语词典
|   +-- pricing-data.js          <-- ZB 定价策略数据
|   +-- product-catalog.js       <-- 产品目录数据
|   +-- step-config.js           <-- 工作流步骤配置
|   +-- intake-fields.js         <-- Intake 问卷字段定义
|   +-- seed-projects.js         <-- 各租户种子项目数据
|
+-- js/modules/
|   +-- products.js              <-- Products CRUD + 渲染
|   +-- customers.js             <-- Customers CRUD + 渲染
|   +-- orders.js                <-- Orders 列表 + 筛选
|   +-- knowledge-base.js        <-- KB 文档管理
|   +-- projects.js              <-- Project CRUD + 列表渲染
|   +-- workflow.js              <-- Workflow Pipeline（调度层）
|   +-- overview.js              <-- Company Overview 仪表盘
|
+-- js/agents/
|   +-- designer.js              <-- AI Designer Agent
|   +-- pricing.js               <-- Pricing Agent（6 策略引擎）
|   +-- compliance.js            <-- Compliance Manager
|   +-- customer-service.js      <-- Customer Service Agent
|
+-- js/steps/
|   +-- step2-design.js          <-- Step 2: AI Design（实现层）
|   +-- step3-measurement.js     <-- Step 3: Measurement 量尺（实现层）
|   +-- step4-quotation.js       <-- Step 4: Quotation 报价（实现层）
|
+-- js/utils/
    +-- helpers.js               <-- 通用辅助函数
    +-- quotation-editor.js      <-- 报价编辑器
    +-- chatbot.js               <-- B2B Chatbot
```

**预计行数分布**：
- `company-operations.html`: ~4,500 行（HTML 模板 + `<script>` 引用 + 引导初始化）
- `js/` 目录: ~12,000 行（分布在 22 个文件中，平均每个文件 400-600 行）

### 2.4 设计原则

1. **渐进式迁移** — 每个 Phase 独立可部署、可回滚
2. **命名空间 + 全局别名桥接** — 模块挂载到 `Nestopia.xxx`，同时保留全局函数别名，HTML 零改动
3. **零构建依赖** — 不引入新的构建步骤，`<script src>` 直接加载
4. **按依赖顺序加载** — namespace → core → data → modules → agents → steps → utils → router
5. **文件版本控制** — 所有 `<script src>` 加 `?v=hash` 防止 CDN 缓存
6. **测试先行** — 每个 Phase 完成后必须通过功能回归验证 + 截图存档

### 2.5 模块文件标准模板

```javascript
/**
 * Nestopia - [模块名称]
 * 命名空间: Nestopia.[namespace]
 */
(function() {
    'use strict';

    // 确保命名空间存在
    var N = window.Nestopia = window.Nestopia || {};

    // ── 模块私有变量 ──
    var _internalState = {};

    // ── 公开 API ──
    N.moduleName = {
        init: function() { /* ... */ },
        doSomething: function(arg) { /* ... */ },
    };

    // ── 全局别名桥接（Phase A — onclick 兼容） ──
    window.doSomething = N.moduleName.doSomething;

})();
```

---

## 3. 分阶段执行计划

### Phase 0: 基础设施准备（预计工作量：小）

**目标**: 建立安全网，确保后续迁移可验证

| 步骤 | 任务 | 详情 |
|------|------|------|
| 0.1 | 创建功能回归清单 | 列出所有需要验证的用户流程 |
| 0.2 | 更新 `build` 脚本 | 确保 `vite build` 也将 `js/` 子目录复制到 `dist/` |
| 0.3 | 更新 `_headers` | 为 `js/**/*.js` 添加 Cache-Control |
| 0.4 | 创建目录结构 | `js/core/` `js/data/` `js/modules/` `js/agents/` `js/steps/` `js/utils/` |
| 0.5 | 创建 `js/core/namespace.js` | 初始化 `window.Nestopia` 根命名空间 + 子命名空间 |
| 0.6 | 更新 `.gitignore` 确认 | 确保 `js/` 不在 ignore 列表中 |
| 0.7 | 生成版本 hash 机制 | 简单的 git short hash 或时间戳方案 |

`js/core/namespace.js` 内容：
```javascript
/**
 * Nestopia 全局命名空间初始化
 * 必须作为第一个加载的 JS 文件
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.data   = N.data   || {};
    N.agents = N.agents || {};
    N.steps  = N.steps  || {};
    N.utils  = N.utils  || {};
    N.VERSION = '1.0.0';
})();
```

**交付物**: 目录结构 + namespace.js + build 脚本更新 + 回归清单
**风险**: 极低（无业务逻辑变更）
**回滚**: 删除空目录 + namespace.js

---

### Phase 1: 提取数据/配置层（预计工作量：中）

**目标**: 将纯数据对象提取到独立 JS 文件，零逻辑变更

| 步骤 | 提取内容 | 源行范围 | 目标命名空间 | 目标文件 | 约行数 |
|------|---------|---------|-------------|---------|-------|
| 1.1 | `quotI18n` 双语词典 | 4722-4802 | `Nestopia.data.i18nDict` | `js/data/i18n-dict.js` | ~80 |
| 1.2 | ZB 定价数据 | 6122-6173 | `Nestopia.data.pricing` | `js/data/pricing-data.js` | ~60 |
| 1.3 | `productCatalog` | 7188-7563 | `Nestopia.data.productCatalog` | `js/data/product-catalog.js` | ~380 |
| 1.4 | Step/Workflow 配置 | 9803-10550 | `Nestopia.data.stepConfig` | `js/data/step-config.js` | ~750 |
| 1.5 | Intake 字段定义 | 10561-10793 | `Nestopia.data.intakeFields` | `js/data/intake-fields.js` | ~230 |
| 1.6 | 种子项目数据 | 10794-12487 | `Nestopia.data.seedProjects` | `js/data/seed-projects.js` | ~1,700 |

**迁移模式示例**：

```javascript
// js/data/pricing-data.js
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.pricing = {
        zbProductTiers:       [ /* ... */ ],
        zbDriveSystems:       [ /* ... */ ],
        zbFabricUpgrades:     [ /* ... */ ],
        zbHeightSurcharges:   [ /* ... */ ],
        zbHardwareCostPerUnit: 85
    };

    // ── 全局别名桥接 ──
    window.zbProductTiers       = N.data.pricing.zbProductTiers;
    window.zbDriveSystems       = N.data.pricing.zbDriveSystems;
    window.zbFabricUpgrades     = N.data.pricing.zbFabricUpgrades;
    window.zbHeightSurcharges   = N.data.pricing.zbHeightSurcharges;
    window.zbHardwareCostPerUnit = N.data.pricing.zbHardwareCostPerUnit;
})();
```

**验证方法**:
1. Console: `Nestopia.data.pricing.zbProductTiers` 返回正确数据
2. Console: `window.zbProductTiers === Nestopia.data.pricing.zbProductTiers` 返回 `true`
3. Pricing Agent 页面执行报价计算，结果一致
4. 截图存档

**交付物**: 6 个数据文件 + namespace.js，HTML 文件减少 ~3,200 行
**风险**: 低（纯数据搬迁，全局别名保持兼容）
**回滚**: 将 `<script src>` 替换回内联数据块

---

### Phase 2: 提取核心基础层（预计工作量：中）

**目标**: 提取认证、租户、路由等基础设施函数

| 步骤 | 提取内容 | 目标命名空间 | 目标文件 | 约行数 |
|------|---------|-------------|---------|-------|
| 2.1 | Supabase 客户端 | `Nestopia.db` | `js/core/supabase-config.js` | ~75 |
| 2.2 | 存储操作层 | `Nestopia.storage` | `js/core/supabase-storage.js` | ~243 |
| 2.3 | 认证 / 会话 | `Nestopia.auth` | `js/core/auth.js` | ~50 |
| 2.4 | 租户管理 | `Nestopia.tenant` | `js/core/tenant.js` | ~100 |
| 2.5 | 国际化 | `Nestopia.i18n` | `js/core/i18n.js` | ~40 |
| 2.6 | 页面路由 | `Nestopia.router` | `js/core/router.js` | ~300 |

**加载依赖链**：
```
namespace.js -> supabase-config.js -> supabase-storage.js -> auth.js -> tenant.js -> i18n.js
                                                                                       |
router.js <-- 在所有模块之后加载（依赖 DOM + 模块就绪）
```

**注意**: `NestopiaDB` 和 `NestopiaStorage` 已作为 `window` 全局对象存在，
Phase 2 将它们同时挂载到 `Nestopia.db` / `Nestopia.storage`，保留原始全局名称作为别名。

**交付物**: 6 个核心文件，HTML 再减少 ~800 行
**风险**: 中（涉及加载顺序）
**回滚**: 逐文件回退

---

### Phase 3: 提取功能模块（预计工作量：大）

**目标**: 将业务功能逐个提取为独立模块

| 步骤 | 模块 | 目标命名空间 | 目标文件 | 约行数 |
|------|------|-------------|---------|-------|
| 3.1 | 辅助函数 | `Nestopia.utils.helpers` | `js/utils/helpers.js` | ~250 |
| 3.2 | Orders | `Nestopia.orders` | `js/modules/orders.js` | ~60 |
| 3.3 | Customers | `Nestopia.customers` | `js/modules/customers.js` | ~570 |
| 3.4 | Knowledge Base | `Nestopia.kb` | `js/modules/knowledge-base.js` | ~460 |
| 3.5 | Products | `Nestopia.products` | `js/modules/products.js` | ~1,280 |
| 3.6 | Company Overview | `Nestopia.overview` | `js/modules/overview.js` | ~270 |
| 3.7 | Projects | `Nestopia.projects` | `js/modules/projects.js` | ~770 |
| 3.8 | Workflow | `Nestopia.workflow` | `js/modules/workflow.js` | ~540 |

**交付物**: 8 个模块文件，HTML 再减少 ~4,200 行
**风险**: 中高（函数间有交叉引用）
**回滚**: 每个 Step 独立可回滚

---

### Phase 4: 提取 Agent 和 Step 实现（预计工作量：大）

**目标**: 将各 Agent 和 Step 实现提取为独立文件

| 步骤 | 模块 | 目标命名空间 | 目标文件 | 约行数 |
|------|------|-------------|---------|-------|
| 4.1 | AI Designer Agent | `Nestopia.agents.designer` | `js/agents/designer.js` | ~630 |
| 4.2 | Pricing Agent | `Nestopia.agents.pricing` | `js/agents/pricing.js` | ~500 |
| 4.3 | Compliance Manager | `Nestopia.agents.compliance` | `js/agents/compliance.js` | ~300 |
| 4.4 | Customer Service | `Nestopia.agents.cs` | `js/agents/customer-service.js` | ~220 |
| 4.5 | Step 2: AI Design | `Nestopia.steps.step2` | `js/steps/step2-design.js` | ~480 |
| 4.6 | Step 3: Measurement | `Nestopia.steps.step3` | `js/steps/step3-measurement.js` | ~500 |
| 4.7 | Step 4: Quotation | `Nestopia.steps.step4` | `js/steps/step4-quotation.js` | ~810 |
| 4.8 | Quotation Editor | `Nestopia.utils.quotEditor` | `js/utils/quotation-editor.js` | ~430 |
| 4.9 | B2B Chatbot | `Nestopia.utils.chatbot` | `js/utils/chatbot.js` | ~50 |

**交付物**: 9 个文件，HTML 最终精简到 ~4,500 行
**风险**: 中
**回滚**: 逐文件回退

---

### Phase 4B（可选清理）: onclick 迁移到命名空间

**目标**: 将 174 个 HTML `onclick` 调用从全局函数迁移到命名空间，然后移除全局别名

**示例**:
```html
<!-- 之前（全局别名） -->
<button onclick="selectProject('PRJ-001')">View</button>
<button onclick="openQuotationEditor('PRJ-001')">Quote</button>

<!-- 之后（命名空间） -->
<button onclick="Nestopia.projects.selectProject('PRJ-001')">View</button>
<button onclick="Nestopia.utils.quotEditor.open('PRJ-001')">Quote</button>
```

完成后移除各模块文件末尾的 `window.xxx = N.xxx.yyy` 全局别名行。

**注意**: Phase 4B 为可选步骤，Phase 4 完成后系统已完全功能正常。

---

### Phase 5（独立里程碑）: 引入构建工具

**目标**: 将 `company-operations.html` 纳入 Vite 构建管线

| 步骤 | 任务 |
|------|------|
| 5.1 | Vite 多入口配置 |
| 5.2 | `<script src>` 改为 ES Module `import` |
| 5.3 | 启用 tree-shaking |
| 5.4 | 启用代码分割（按路由懒加载） |
| 5.5 | Tailwind CDN 切换到构建时编译 |
| 5.6 | 统一 `src/` TypeScript 重复代码与 `functions/lib/` |

---

## 4. 脚本加载顺序

Phase 1-4 完成后的 `<script>` 标签（含版本 hash）：

```html
<!-- [1] 外部依赖 -->
<script src="https://cdn.tailwindcss.com"></script>
<script>/* tailwind.config 内联 */</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

</head>
<body>
    <!-- ... HTML 模板 (~4,000 行) ... -->

    <!-- [2] 命名空间初始化（必须第一个加载） -->
    <script src="js/core/namespace.js?v=__HASH__"></script>

    <!-- [3] 核心基础层（有顺序依赖） -->
    <script src="js/core/supabase-config.js?v=__HASH__"></script>
    <script src="js/core/supabase-storage.js?v=__HASH__"></script>
    <script src="js/core/auth.js?v=__HASH__"></script>
    <script src="js/core/tenant.js?v=__HASH__"></script>
    <script src="js/core/i18n.js?v=__HASH__"></script>

    <!-- [4] 数据层（无顺序依赖） -->
    <script src="js/data/i18n-dict.js?v=__HASH__"></script>
    <script src="js/data/pricing-data.js?v=__HASH__"></script>
    <script src="js/data/product-catalog.js?v=__HASH__"></script>
    <script src="js/data/step-config.js?v=__HASH__"></script>
    <script src="js/data/intake-fields.js?v=__HASH__"></script>
    <script src="js/data/seed-projects.js?v=__HASH__"></script>

    <!-- [5] 工具层 -->
    <script src="js/utils/helpers.js?v=__HASH__"></script>

    <!-- [6] 功能模块（依赖 core + data） -->
    <script src="js/modules/orders.js?v=__HASH__"></script>
    <script src="js/modules/customers.js?v=__HASH__"></script>
    <script src="js/modules/knowledge-base.js?v=__HASH__"></script>
    <script src="js/modules/products.js?v=__HASH__"></script>
    <script src="js/modules/overview.js?v=__HASH__"></script>
    <script src="js/modules/projects.js?v=__HASH__"></script>
    <script src="js/modules/workflow.js?v=__HASH__"></script>

    <!-- [7] Agent 模块 -->
    <script src="js/agents/designer.js?v=__HASH__"></script>
    <script src="js/agents/pricing.js?v=__HASH__"></script>
    <script src="js/agents/compliance.js?v=__HASH__"></script>
    <script src="js/agents/customer-service.js?v=__HASH__"></script>

    <!-- [8] Step 实现 -->
    <script src="js/steps/step2-design.js?v=__HASH__"></script>
    <script src="js/steps/step3-measurement.js?v=__HASH__"></script>
    <script src="js/steps/step4-quotation.js?v=__HASH__"></script>

    <!-- [9] 独立工具 -->
    <script src="js/utils/quotation-editor.js?v=__HASH__"></script>
    <script src="js/utils/chatbot.js?v=__HASH__"></script>

    <!-- [10] 页面路由（依赖所有模块就绪） -->
    <script src="js/core/router.js?v=__HASH__"></script>

    <!-- [11] 引导初始化（内联） -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            Nestopia.auth.checkAuth();
            Nestopia.router.loadDashboardData();
            Nestopia.projects.loadFromDB();
        });
    </script>
</body>
```

`__HASH__` 在每次 git push 时由 build 脚本自动替换为 git short hash。

---

## 5. 风险管控

### 5.1 每步回滚策略

| 阶段 | 回滚方式 | 耗时 |
|------|---------|------|
| Phase 0 | `git revert` — 删除目录 + namespace.js | < 1 分钟 |
| Phase 1 | 将 `<script src>` 替换回内联数据块 | < 5 分钟 |
| Phase 2-4 | `git revert` 单个提交 | < 2 分钟 |
| **紧急回滚** | `git revert --no-commit HEAD~N && git commit` | < 5 分钟 |

### 5.2 主要风险与缓解措施

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 脚本加载顺序错误 | 高 | 页面崩溃 | namespace.js 最先加载 + 防御性 `N = window.Nestopia = window.Nestopia \|\| {}` |
| 全局别名遗漏 | 中 | onclick 失效 | 自动化脚本检查：HTML 中每个 onclick 函数必须有对应全局别名 |
| 命名空间路径写错 | 中 | 运行时错误 | 每个文件开头验证 `if (!N.data) throw new Error(...)` |
| Cloudflare 缓存旧版 JS | 中 | 版本不一致 | `?v=__HASH__` 版本后缀 |
| 多个 HTTP 请求 | 低 | 首屏变慢 | HTTP/2 多路复用 + Phase 5 打包 |
| 全局别名与命名空间不一致 | 低 | 数据不同步 | 别名直接引用对象（非拷贝），修改会同步 |

### 5.3 缓存策略

```
# _headers 新增
/js/core/*
  Cache-Control: public, max-age=3600, must-revalidate

/js/data/*
  Cache-Control: public, max-age=86400

/js/modules/*
  Cache-Control: public, max-age=3600, must-revalidate

/js/agents/*
  Cache-Control: public, max-age=3600, must-revalidate

/js/steps/*
  Cache-Control: public, max-age=3600, must-revalidate

/js/utils/*
  Cache-Control: public, max-age=3600, must-revalidate
```

---

## 6. 功能回归清单

每个 Phase 完成后必须验证（含截图存档）：

### 基础功能
- [ ] 登录 -> Dashboard 正确加载
- [ ] 租户切换（Greenscape / Omeya-SIN / Nestopia-CHN）
- [ ] 侧边栏项目列表（含 DB 项目）
- [ ] Console 无报错（特别检查 `Nestopia is not defined`）

### 页面导航
- [ ] Company Overview 加载
- [ ] Service Workflow Pipeline 渲染
- [ ] Products 列表 + 筛选 + 详情
- [ ] Customers 列表 + 新增/编辑
- [ ] Orders 列表 + 筛选
- [ ] Knowledge Base 文档列表 + 上传

### Agent 模块
- [ ] AI Designer — 选择产品 -> 生成设计
- [ ] Pricing Agent — 选 Tier -> 输入尺寸 -> 计算报价
- [ ] Compliance Manager — 运行合规检查
- [ ] Customer Service — 查看对话 + 发送回复

### 工作流步骤
- [ ] Step 1 (Intent) — Intake 表单填写
- [ ] Step 2 (Design) — AI 设计面板
- [ ] Step 3 (Measurement) — 量尺数据录入 -> Save
- [ ] Step 4 (Quotation) — 报价面板 -> 继承 Step 3 数据
- [ ] 步骤推进 Advance Step

### Project CRUD
- [ ] 创建新项目 -> Supabase 持久化
- [ ] 项目列表加载 + 筛选
- [ ] 项目详情 Master-Detail

### 报价编辑器
- [ ] 打开/关闭报价编辑器
- [ ] 添加产品行项 + 计算总价
- [ ] 保存/加载报价
- [ ] 打印预览

### 命名空间验证（新增）
- [ ] `typeof Nestopia === 'object'`
- [ ] `typeof Nestopia.data.pricing.zbProductTiers === 'object'`
- [ ] `window.zbProductTiers === Nestopia.data.pricing.zbProductTiers` (别名一致)

---

## 7. 执行时间线

```
Phase 0 --> Phase 1 --> Phase 2 --> Phase 3 --> Phase 4 --> [Phase 4B]
准备基础     数据提取     核心层       功能模块     Agent/Step    onclick 清理
(0.5 天)    (1 天)      (1 天)      (2 天)      (2 天)       (0.5 天, 可选)
                                                    |
                                                    v
                                              HTML ~4,500 行
                                              22 个 JS 模块
                                              Nestopia.* 命名空间
```

**总预计工作量**: 6-8 个工作日（含测试验证 + 截图）

---

## 8. 成功指标

| 指标 | 目标 |
|------|------|
| `company-operations.html` 行数 | <= 5,000 行（降低 70%） |
| 最大 JS 文件行数 | <= 800 行 |
| 独立 JS 模块数 | 22 个 |
| 功能回归通过率 | 100% |
| 页面首屏加载时间 | 与重构前持平或更优 |
| 可直接 Edit 的文件 | 所有 JS 文件 |
| Console 零报错 | 无 undefined / namespace 错误 |
| 命名空间覆盖率 | 100% 公开函数挂载到 `Nestopia.*` |

---

*文档已审核通过。Phase 0-3 已完成，Phase 4 待执行。*

---

## 9. 执行记录（Phase 0-3）

> 更新日期: 2026-04-19

### 9.1 总体进度

| 指标 | 目标值 | 当前值 | 状态 |
|------|-------|--------|------|
| HTML 行数 | ≤ 5,000 | 7,351 | 🔄 进行中 (-55.7%) |
| 已提取模块数 | 22 | 24 (30 文件) | ✅ 超额完成 |
| onclick 命名空间覆盖率 | 100% | 70% (91/130) | 🔄 剩余为未提取的内联函数 |
| 功能回归通过 | 100% | Phase 0-4B 均通过 | ✅ |
| Console 零报错 | 无 | 通过 | ✅ |

```
Phase 0 ✅ → Phase 1 ✅ → Phase 2 ✅ → Phase 3 ✅ → Phase 4 ✅ → Phase 4B ✅ → [Phase 5 ⬜]
16,605行       -980行         -482行         -3,635行       -4,158行     onclick迁移
```

### 9.2 Phase 0: 基础设施准备 ✅

**完成日期**: 2026-04-17
**Commit**: `f361ec5`

| 交付物 | 状态 |
|--------|------|
| 目录结构 `js/core/` `js/data/` `js/modules/` `js/agents/` `js/steps/` `js/utils/` | ✅ |
| `js/core/namespace.js` (62 行) | ✅ |
| `vite.config.js` build 脚本更新（cp js/ 到 dist/） | ✅ |
| `_headers` 缓存策略 | ✅ |
| 版本 hash 注入机制 (`?v=__HASH__`) | ✅ |

### 9.3 Phase 1: 提取数据/配置层 ✅

**完成日期**: 2026-04-18
**Commit**: `c267841`
**HTML 行数**: 16,604 → 15,624 (-980 行)

| 步骤 | 文件 | 行数 | 命名空间 | 状态 |
|------|------|------|---------|------|
| 1.1 | `js/data/i18n-dict.js` | ~80 | `Nestopia.data.i18nDict` | ✅ |
| 1.2 | `js/data/pricing-data.js` | ~60 | `Nestopia.data.pricing` | ✅ |
| 1.3 | `js/data/product-catalog.js` | ~380 | `Nestopia.data.productCatalog` | ✅ |
| 1.4 | `js/data/step-config.js` | ~750 | `Nestopia.data.stepConfig` | ✅ |
| 1.5 | `js/data/intake-fields.js` | ~230 | `Nestopia.data.intakeFields` | ✅ |
| 1.6 | `js/data/seed-projects.js` | ~1,700 | `Nestopia.data.seedProjects` | ✅ |

**修改脚本**: `scripts/phase1_extract_data.py`

### 9.4 Phase 2: 提取核心基础层 ✅

**完成日期**: 2026-04-18
**Commit**: `0ff7c6a`
**HTML 行数**: 15,624 → 15,142 (-482 行)

| 步骤 | 文件 | 行数 | 命名空间 | 状态 |
|------|------|------|---------|------|
| 2.1 | `js/core/supabase-config.js` | ~75 | `Nestopia.db` (+ `window.NestopiaDB`) | ✅ |
| 2.2 | `js/core/supabase-storage.js` | ~243 | `Nestopia.storage` (+ `window.NestopiaStorage`) | ✅ |
| 2.3 | `js/core/auth.js` | ~50 | `Nestopia.auth` | ✅ |
| 2.4 | `js/core/tenant.js` | ~100 | `Nestopia.tenant` | ✅ |
| 2.5 | `js/core/i18n.js` | ~40 | `Nestopia.i18n` | ✅ |
| 2.6 | `js/core/router.js` | ~300 | `Nestopia.router` | ✅ |

**修改脚本**: `scripts/phase2_extract_core.py` + `scripts/fix_script_order.py`
**关键修复**: 发现并修复脚本加载顺序 bug — `namespace.js` 必须在所有模块之前加载。

### 9.5 Phase 3: 提取功能模块 ✅

**完成日期**: 2026-04-18
**Commit**: `b1e11b3` (主提交) + `fd0e31c` (修复重复代码)
**HTML 行数**: 15,145 → 11,510 (-3,635 行)

| 步骤 | 文件 | 行数 | 命名空间 | 状态 |
|------|------|------|---------|------|
| 3.1 | `js/utils/helpers.js` | 84 | `Nestopia.utils` | ✅ |
| 3.2 | `js/modules/orders.js` | 78 | `Nestopia.modules.orders` | ✅ |
| 3.3 | `js/modules/customers.js` | 625 | `Nestopia.modules.customers` | ✅ |
| 3.4 | `js/modules/knowledge-base.js` | 523 | `Nestopia.modules.knowledgeBase` | ✅ |
| 3.5 | `js/modules/products.js` | 969 | `Nestopia.modules.products` | ✅ |
| 3.6 | `js/modules/overview.js` | 304 | `Nestopia.modules.overview` | ✅ |
| 3.7 | `js/modules/projects.js` | 950 | `Nestopia.modules.projects` | ✅ |
| 3.8 | `js/modules/workflow.js` | 566 | `Nestopia.modules.workflow` | ✅ |

**修改脚本**: `scripts/phase3_extract_modules.py`
**关键修复**: Agent 创建文件时出现代码重复 — `overview.js` 3x (920→304行)、`products.js` 2x (1939→969行)，通过截断修复。

### 9.6 当前脚本加载顺序

```html
<!-- 1. 命名空间 -->
<script src="js/core/namespace.js"></script>
<!-- 2. 核心基础层 (Phase 2) -->
<script src="js/core/supabase-config.js"></script>
<script src="js/core/supabase-storage.js"></script>
<script src="js/core/auth.js"></script>
<script src="js/core/tenant.js"></script>
<script src="js/core/i18n.js"></script>
<script src="js/core/router.js"></script>
<!-- 3. 数据层 (Phase 1) -->
<script src="js/data/i18n-dict.js"></script>
<script src="js/data/pricing-data.js"></script>
<script src="js/data/product-catalog.js"></script>
<script src="js/data/step-config.js"></script>
<script src="js/data/intake-fields.js"></script>
<script src="js/data/seed-projects.js"></script>
<!-- 4. 工具层 (Phase 3) -->
<script src="js/utils/helpers.js"></script>
<!-- 5. 功能模块 (Phase 3) -->
<script src="js/modules/orders.js"></script>
<script src="js/modules/customers.js"></script>
<script src="js/modules/knowledge-base.js"></script>
<script src="js/modules/products.js"></script>
<script src="js/modules/overview.js"></script>
<script src="js/modules/projects.js"></script>
<script src="js/modules/workflow.js"></script>
<!-- 6. 内联主脚本 (~7,046 行, 待 Phase 4 提取) -->
```

### 9.7 经验教训

| 问题 | 解决方案 | 预防措施 |
|------|---------|---------|
| Write tool 创建 0 字节文件 | 改用 bash heredoc | 创建后立即 `wc -l` 验证 |
| Agent 重复复制代码 | 截断文件保留首份完整 IIFE | 创建后 grep 检查函数出现次数 |
| 脚本加载顺序错误 | `fix_script_order.py` 统一整理 | `<script>` 标签集中管理 |
| Python 脚本锚点匹配失败 | 手动 Edit 插入 | `find_line()` 改用 `strip()` |
| 顺序替换导致中间标记消失 | 先收集所有行号再统一替换 | 替换前在原始文件上定位全部标记 |
| Phase 4 chatbot.js / step4 又遇 0 字节 | Agent 内用 Bash 验证 `wc -l` | 创建后必须验证非空 |

### 9.8 剩余内联代码分析（Phase 4 完成后）

Phase 4 完成后，`company-operations.html` 内联 `<script>` 仍有约 2,986 行，分布如下：

| 区域 | 约行数 | 说明 |
|------|-------|------|
| `loadDashboardData` | ~40 | Dashboard 初始化 |
| `projectAgentPanelData` + Agent Panel 渲染 | ~460 | 项目 Agent 面板数据和导航 |
| `zbProductKB` + KB 推荐引擎 | ~440 | Zip Blinds 租户级 KB 样本数据 |
| Intake 表单 + Demo 数据 | ~1,790 | 预填充演示数据 |
| `DOMContentLoaded` | ~30 | 引导初始化 |
| Team Management + Settings | ~90 | 团队和设置页面 |
| Phase 2/3 占位注释 | ~20 | 已提取模块的注释标记 |
| **合计** | **~2,870** | |

这些代码可在后续 Phase 4B/5 中进一步提取。
<script src="js/utils/quotation-editor.js"></script>
<script src="js/utils/chatbot.js"></script>
```

### 9.6 Phase 4: 提取 Agent 和 Step 实现 ✅

**完成日期**: 2026-04-19
**Commit**: (本次提交)
**HTML 行数**: 11,509 → 7,351 (-4,158 行)

| 步骤 | 文件 | 行数 | 命名空间 | 状态 |
|------|------|------|---------|------|
| 4.1 | `js/agents/designer.js` | 739 | `Nestopia.agents.designer` | ✅ |
| 4.2 | `js/agents/pricing.js` | 501 | `Nestopia.agents.pricing` | ✅ |
| 4.3 | `js/agents/compliance.js` | 289 | `Nestopia.agents.compliance` | ✅ |
| 4.4 | `js/agents/customer-service.js` | 339 | `Nestopia.agents.cs` | ✅ |
| 4.5 | `js/steps/step2-design.js` | 536 | `Nestopia.steps.step2` | ✅ |
| 4.6 | `js/steps/step3-measurement.js` | 541 | `Nestopia.steps.step3` | ✅ |
| 4.7 | `js/steps/step4-quotation.js` | 493 | `Nestopia.steps.step4` | ✅ |
| 4.8 | `js/utils/quotation-editor.js` | 716 | `Nestopia.utils.quotEditor` | ✅ |
| 4.9 | `js/utils/chatbot.js` | 438 | `Nestopia.utils.chatbot` | ✅ |

**修改脚本**: `scripts/phase4_extract_agents_steps.py`
**关键改进**: 先收集所有行号范围再统一替换（修复了 Phase 3 中顺序替换导致标记消失的问题）。

### 9.7 经验教训

| 问题 | 解决方案 | 预防措施 |
|------|---------|---------|
| Write tool 创建 0 字节文件 | 改用 bash heredoc | 创建后立即 `wc -l` 验证 |
| Agent 重复复制代码 | 截断文件保留首份完整 IIFE | 创建后 grep 检查函数出现次数 |
| 脚本加载顺序错误 | `fix_script_order.py` 统一整理 | `<script>` 标签集中管理 |
| Python 脚本锚点匹配失败 | 手动 Edit 插入 | `find_line()` 改用 `strip()` |
