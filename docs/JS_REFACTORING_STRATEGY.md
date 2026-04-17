# JS 代码重构策略
## company-operations.html 模块化拆分方案

> **文档版本**: v1.0
> **创建日期**: 2026-04-17
> **状态**: 待审核（PENDING REVIEW）
> **目标文件**: `company-operations.html`（16,605 行 / ~302 个函数 / ~1.15 MB）

---

## 1. 现状分析

### 1.1 当前架构

```
company-operations.html (16,605 行)
├── <head> CSS / Tailwind 配置                    (1–595)        ~595 行
├── <script> Supabase SDK CDN                     (596)          1 行
├── <script> NestopiaDB 初始化                     (597–671)      75 行
├── <script> NestopiaStorage 存储层                (672–914)      243 行
├── <body> HTML 模板（11 个页面）                   (916–4642)     3,727 行
└── <script> 主应用逻辑                            (4643–16493)   11,851 行
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

---

## 2. 目标架构

### 2.1 拆分后结构

```
company-operations.html          ← 精简为 HTML 模板 + 引导脚本（~5,000 行）
│
├── js/core/
│   ├── supabase-config.js       ← Supabase 客户端初始化（已存在，合并）
│   ├── supabase-storage.js      ← 存储操作层（已存在，合并）
│   ├── auth.js                  ← 认证 / 会话管理
│   ├── tenant.js                ← 多租户配置 / slug 管理
│   ├── router.js                ← 页面路由 / 导航
│   └── i18n.js                  ← 国际化字典 + 工具函数
│
├── js/data/
│   ├── product-catalog.js       ← 产品目录数据 + 定价表
│   ├── step-config.js           ← 工作流步骤配置 / ZB 变体
│   ├── intake-fields.js         ← Intake 问卷字段定义
│   ├── seed-projects.js         ← 各租户种子项目数据
│   └── pricing-data.js          ← ZB 定价策略数据（层级/驱动/面料/高度）
│
├── js/modules/
│   ├── products.js              ← Products CRUD + 渲染
│   ├── customers.js             ← Customers CRUD + 渲染
│   ├── orders.js                ← Orders 列表 + 筛选
│   ├── knowledge-base.js        ← KB 文档管理
│   ├── projects.js              ← Project CRUD + 列表渲染
│   ├── workflow.js              ← Workflow Pipeline + 步骤推进
│   └── overview.js              ← Company Overview 仪表盘
│
├── js/agents/
│   ├── designer.js              ← AI Designer Agent
│   ├── pricing.js               ← Pricing Agent（6 策略引擎）
│   ├── compliance.js            ← Compliance Manager
│   └── customer-service.js      ← Customer Service Agent
│
├── js/steps/
│   ├── step2-design.js          ← Step 2: AI Design 实现
│   ├── step3-measurement.js     ← Step 3: Measurement 量尺
│   └── step4-quotation.js       ← Step 4: Quotation 报价
│
└── js/utils/
    ├── helpers.js               ← 通用辅助函数（badge、format 等）
    ├── quotation-editor.js      ← 报价编辑器完整逻辑
    └── chatbot.js               ← B2B Chatbot
```

**预计行数分布**：
- `company-operations.html`: ~4,500 行（HTML 模板 + `<script>` 引用 + 引导初始化）
- `js/` 目录: ~12,000 行（分布在 20+ 个文件中，平均每个文件 400-600 行）

### 2.2 设计原则

1. **渐进式迁移** — 每个 Phase 独立可部署、可回滚
2. **保持全局兼容** — 提取的函数仍挂载到 `window`，HTML `onclick` 无需改动
3. **零构建依赖** — 不引入新的构建步骤，`<script src>` 直接加载
4. **按依赖顺序加载** — core → data → modules → agents → steps → utils
5. **测试先行** — 每个 Phase 完成后必须通过功能回归验证

---

## 3. 分阶段执行计划

### Phase 0: 基础设施准备（预计工作量：小）

**目标**: 建立安全网，确保后续迁移可验证

| 步骤 | 任务 | 详情 |
|------|------|------|
| 0.1 | 创建功能回归清单 | 列出所有需要验证的用户流程（登录→项目创建→量尺→报价等） |
| 0.2 | 更新 `build` 脚本 | 确保 `vite build` 也将 `js/` 目录复制到 `dist/` |
| 0.3 | 更新 `_headers` | 为 `js/*.js` 添加正确的 Cache-Control |
| 0.4 | 创建目录结构 | `js/core/` `js/data/` `js/modules/` `js/agents/` `js/steps/` `js/utils/` |
| 0.5 | 更新 `.gitignore` 确认 | 确保 `js/` 不在 ignore 列表中 |

**交付物**: 目录结构就绪 + build 脚本更新 + 回归清单
**风险**: 极低（无代码逻辑变更）
**回滚**: 删除空目录即可

---

### Phase 1: 提取数据/配置层（预计工作量：中）

**目标**: 将纯数据对象提取到独立 JS 文件，零逻辑变更

**提取顺序**（按依赖关系，从无依赖到有依赖）：

| 步骤 | 提取内容 | 源行范围 | 目标文件 | 约行数 |
|------|---------|---------|---------|-------|
| 1.1 | `quotI18n` 双语词典 | 4722-4802 | `js/data/i18n-dict.js` | ~80 |
| 1.2 | `zbProductTiers`, `zbDriveSystems`, `zbFabricUpgrades`, `zbHeightSurcharges`, `zbHardwareCostPerUnit` | 6122-6173 | `js/data/pricing-data.js` | ~60 |
| 1.3 | `productCatalog` 产品目录 | 7188-7563 | `js/data/product-catalog.js` | ~380 |
| 1.4 | `STEP_DETAIL_CONFIG` + `ZB_STEP_CONFIGS` + `ZB_WORKFLOW_STEPS` + `zbProductKB` | 9803-10550 | `js/data/step-config.js` | ~750 |
| 1.5 | `INTAKE_MODULE_FIELDS` | 10561-10793 | `js/data/intake-fields.js` | ~230 |
| 1.6 | 种子项目数据 | 10794-12487 | `js/data/seed-projects.js` | ~1,700 |

**迁移模式**（每个文件相同）：

```javascript
// js/data/pricing-data.js
(function() {
    'use strict';

    window.zbProductTiers = [ /* ... 原始数据 ... */ ];
    window.zbDriveSystems = [ /* ... */ ];
    window.zbFabricUpgrades = [ /* ... */ ];
    window.zbHeightSurcharges = [ /* ... */ ];
    window.zbHardwareCostPerUnit = 85;
})();
```

```html
<!-- company-operations.html 中原始位置替换为 -->
<script src="js/data/pricing-data.js"></script>
```

**验证方法**:
1. 浏览器 Console 检查 `window.zbProductTiers` 等全局变量是否正确加载
2. 打开 Pricing Agent 页面，执行报价计算，对比结果一致
3. 每个 Step 提取后单独部署验证

**交付物**: 6 个数据文件提取完成，HTML 文件减少 ~3,200 行
**风险**: 低（纯数据搬迁，无逻辑变更）
**回滚**: 将 `<script src>` 替换回内联 `<script>` 块

---

### Phase 2: 提取核心基础层（预计工作量：中）

**目标**: 提取认证、租户、路由等基础设施函数

| 步骤 | 提取内容 | 关键函数 | 目标文件 | 约行数 |
|------|---------|---------|---------|-------|
| 2.1 | Supabase 客户端 | `NestopiaDB` IIFE | `js/core/supabase-config.js`（合并已有） | ~75 |
| 2.2 | 存储操作层 | `NestopiaStorage` IIFE | `js/core/supabase-storage.js`（合并已有） | ~243 |
| 2.3 | 认证 / 会话 | `checkAuth()`, `getAuthData()`, `logout()`, `toggleUserDropdown()` | `js/core/auth.js` | ~50 |
| 2.4 | 租户管理 | `getCurrentTenantSlug()`, `getTenantUnitSystem()`, `getTenantLanguage()`, `tenantConfigs`, `tenantProjectsMap` | `js/core/tenant.js` | ~100 |
| 2.5 | 国际化 | `getLocalizedName()`, `getQuotText()`, `quotI18n` 引用 | `js/core/i18n.js` | ~40 |
| 2.6 | 页面路由 | `navigateToPage()`, `navigateToProject()`, `renderSidebarProjects()` 等 | `js/core/router.js` | ~300 |

**依赖关系**：
```
supabase-config.js -> supabase-storage.js -> auth.js -> tenant.js -> i18n.js -> router.js
```

**注意事项**:
- `js/core/supabase-config.js` 和 `js/core/supabase-storage.js` 需与已有 `js/supabase-config.js`、`js/supabase-storage.js` 合并（保留新路径，移除旧文件）
- `router.js` 依赖 DOM 元素，必须在 `<body>` 之后加载

**交付物**: 6 个核心文件，HTML 文件再减少 ~800 行
**风险**: 中（涉及加载顺序，函数间有依赖）
**回滚**: 逐文件回退，每个文件独立可回滚

---

### Phase 3: 提取功能模块（预计工作量：大）

**目标**: 将业务功能逐个提取为独立模块

**提取顺序**（按独立性从高到低，每个模块单独提交/验证）：

| 步骤 | 模块 | 关键函数 | 目标文件 | 约行数 |
|------|------|---------|---------|-------|
| 3.1 | 辅助函数 | `getPriorityBadge()`, `getStageBadge()`, `showToast()`, dummy data | `js/utils/helpers.js` | ~250 |
| 3.2 | Orders | `initOrdersPage()`, `filterOrders()`, `showOrderDetail()` | `js/modules/orders.js` | ~60 |
| 3.3 | Customers | `loadCustomersFromDB()`, `saveCustomerToDB()`, CRUD 全套 | `js/modules/customers.js` | ~570 |
| 3.4 | Knowledge Base | `getKBDocuments()`, upload/delete/search | `js/modules/knowledge-base.js` | ~460 |
| 3.5 | Products | `productCatalog` 操作, `loadProductCatalogFromDB()`, CRUD 全套 | `js/modules/products.js` | ~1,280 |
| 3.6 | Company Overview | `initCompanyOverview()`, overview 数据汇总 | `js/modules/overview.js` | ~270 |
| 3.7 | Projects | `generateProjectId()`, `submitCreateProject()`, `persistProjectToDB()`, 列表渲染 | `js/modules/projects.js` | ~770 |
| 3.8 | Workflow | `renderWorkflowPipeline()`, `advanceStep()`, `openProjectDetail()` | `js/modules/workflow.js` | ~540 |

**交付物**: 8 个模块文件，HTML 文件再减少 ~4,200 行
**风险**: 中高（函数间有交叉引用，需逐个验证）
**回滚**: 每个 Step 独立可回滚

---

### Phase 4: 提取 Agent 和 Step 实现（预计工作量：大）

**目标**: 将各 Agent 和 Step 实现提取为独立文件

| 步骤 | 模块 | 目标文件 | 约行数 |
|------|------|---------|-------|
| 4.1 | AI Designer Agent | `js/agents/designer.js` | ~630 |
| 4.2 | Pricing Agent | `js/agents/pricing.js` | ~500 |
| 4.3 | Compliance Manager | `js/agents/compliance.js` | ~300 |
| 4.4 | Customer Service | `js/agents/customer-service.js` | ~220 |
| 4.5 | Step 2: AI Design | `js/steps/step2-design.js` | ~480 |
| 4.6 | Step 3: Measurement | `js/steps/step3-measurement.js` | ~500 |
| 4.7 | Step 4: Quotation | `js/steps/step4-quotation.js` | ~810 |
| 4.8 | Quotation Editor | `js/utils/quotation-editor.js` | ~430 |
| 4.9 | B2B Chatbot | `js/utils/chatbot.js` | ~50 |

**交付物**: 9 个文件，HTML 文件最终精简到 ~4,500 行（纯 HTML 模板 + script 引用）
**风险**: 中（Agent 间耦合度较低，Step 之间有状态传递）
**回滚**: 逐文件回退

---

### Phase 5（未来可选）: 引入构建工具

**目标**: 将 `company-operations.html` 也纳入 Vite 构建管线

| 步骤 | 任务 |
|------|------|
| 5.1 | Vite 多入口配置 — 添加 `company-operations.html` 为额外入口 |
| 5.2 | 将 `<script src>` 改为 ES Module `import` |
| 5.3 | 启用 tree-shaking — 自动消除未使用代码 |
| 5.4 | 启用代码分割 — 按路由懒加载各模块 |
| 5.5 | 将 Tailwind 从 CDN 切换到构建时编译 |

**注意**: Phase 5 是**可选**的长期优化，Phase 1-4 完成后系统已经可维护。

---

## 4. 脚本加载顺序

Phase 1-4 完成后，`company-operations.html` 的 `<script>` 标签顺序如下：

```html
<!-- 1 外部依赖 -->
<script src="https://cdn.tailwindcss.com"></script>
<script>/* tailwind.config 内联 */</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

</head>
<body>
    <!-- ... HTML 模板 (~4,000 行) ... -->

    <!-- 2 核心基础层（有顺序依赖） -->
    <script src="js/core/supabase-config.js"></script>
    <script src="js/core/supabase-storage.js"></script>
    <script src="js/core/auth.js"></script>
    <script src="js/core/tenant.js"></script>
    <script src="js/core/i18n.js"></script>

    <!-- 3 数据层（无顺序依赖，可并行加载） -->
    <script src="js/data/i18n-dict.js"></script>
    <script src="js/data/pricing-data.js"></script>
    <script src="js/data/product-catalog.js"></script>
    <script src="js/data/step-config.js"></script>
    <script src="js/data/intake-fields.js"></script>
    <script src="js/data/seed-projects.js"></script>

    <!-- 4 工具层 -->
    <script src="js/utils/helpers.js"></script>

    <!-- 5 功能模块（依赖 core + data） -->
    <script src="js/modules/orders.js"></script>
    <script src="js/modules/customers.js"></script>
    <script src="js/modules/knowledge-base.js"></script>
    <script src="js/modules/products.js"></script>
    <script src="js/modules/overview.js"></script>
    <script src="js/modules/projects.js"></script>
    <script src="js/modules/workflow.js"></script>

    <!-- 6 Agent 模块 -->
    <script src="js/agents/designer.js"></script>
    <script src="js/agents/pricing.js"></script>
    <script src="js/agents/compliance.js"></script>
    <script src="js/agents/customer-service.js"></script>

    <!-- 7 Step 实现 -->
    <script src="js/steps/step2-design.js"></script>
    <script src="js/steps/step3-measurement.js"></script>
    <script src="js/steps/step4-quotation.js"></script>

    <!-- 8 独立工具 -->
    <script src="js/utils/quotation-editor.js"></script>
    <script src="js/utils/chatbot.js"></script>

    <!-- 9 页面路由（依赖所有模块就绪） -->
    <script src="js/core/router.js"></script>

    <!-- 10 引导初始化（内联，极少量） -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            loadDashboardData();
            loadProjectsFromDB();
        });
    </script>
</body>
```

---

## 5. 风险管控

### 5.1 每步回滚策略

| 阶段 | 回滚方式 | 耗时 |
|------|---------|------|
| Phase 0 | `git revert` — 删除空目录 | < 1 分钟 |
| Phase 1 | 将 `<script src>` 替换回内联数据块 | < 5 分钟 |
| Phase 2-4 | `git revert` 单个提交 — 每个模块独立提交 | < 2 分钟 |
| **紧急回滚** | `git revert --no-commit HEAD~N && git commit` 一次性回退 | < 5 分钟 |

### 5.2 主要风险与缓解措施

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 脚本加载顺序错误导致 undefined | 高 | 页面崩溃 | 每个文件使用 IIFE 包裹 + 防御性检查 |
| 全局变量命名冲突 | 低 | 功能异常 | 提取时保持原始变量名不变 |
| 跨模块引用遗漏 | 中 | 特定功能失效 | 每步提取后全量回归测试 |
| Cloudflare 缓存旧版 JS | 中 | 版本不一致 | 文件名加版本后缀 `?v=1.0` 或使用 hash |
| 多个 HTTP 请求增加加载时间 | 低 | 首屏变慢 | HTTP/2 多路复用 + 未来 Phase 5 打包 |

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

每个 Phase 完成后必须验证的关键流程：

### 基础功能
- [ ] 登录 -> 正确跳转到 Dashboard
- [ ] 租户切换（Greenscape / Omeya-SIN / Nestopia-CHN）
- [ ] 侧边栏项目列表加载（含 DB 项目）

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
- [ ] 创建新项目 -> 持久化到 Supabase
- [ ] 项目列表加载 + 筛选
- [ ] 项目详情 Master-Detail 视图

### 报价编辑器
- [ ] 打开报价编辑器
- [ ] 添加产品行项
- [ ] 计算总价
- [ ] 保存/加载报价
- [ ] 打印预览

---

## 7. 执行时间线（建议）

```
Phase 0 --> Phase 1 --> Phase 2 --> Phase 3 --> Phase 4
准备基础     数据提取     核心层提取    功能模块      Agent/Step
(0.5 天)    (1 天)      (1 天)      (2 天)       (2 天)
                                                    |
                                                    v
                                              完成！HTML ~4,500 行
                                              JS 分布在 20+ 文件中
```

**总预计工作量**: 5-7 个工作日（含测试验证）

---

## 8. 成功指标

| 指标 | 目标 |
|------|------|
| `company-operations.html` 行数 | <= 5,000 行（从 16,605 行降低 70%） |
| 最大 JS 文件行数 | <= 800 行 |
| 独立 JS 模块数 | 20-25 个 |
| 功能回归通过率 | 100%（零功能退化） |
| 页面首屏加载时间 | 与重构前持平或更优（HTTP/2 并行加载） |
| 可直接 Edit 的文件 | 所有 JS 文件（告别 Python 脚本修改模式） |

---

## 9. 决策点（需确认）

1. **Phase 5（构建工具）是否纳入本次重构范围？**
   建议先完成 Phase 1-4，Phase 5 作为独立里程碑

2. **是否在 Phase 1 就引入文件版本管理（`?v=hash`）？**
   建议是，防止 CDN 缓存问题

3. **提取后的 IIFE 模式 vs 命名空间模式？**
   - IIFE: `(function(){ window.xxx = ...; })()`（推荐，与现有代码一致）
   - 命名空间: `window.Nestopia.pricing = { ... }`（更整洁但改动更大）

4. **每个 Phase 是否需要生成验证截图/录屏？**
   取决于验证偏好

---

*本文档待 Webster 审核确认后，从 Phase 0 开始执行。*
