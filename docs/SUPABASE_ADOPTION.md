# Supabase 采用度与启用状态报告

> **版本:** 1.1 | **日期:** 2026-04-15 | **状态:** 活跃跟踪  
> **整体完成度:** ~80%

---

## 文档关系

本文档是 **Supabase 实施进度的实时跟踪文档**，与以下文档构成完整的数据基础设施体系：

```
DATA_AI_STRATEGY.md (v3.1)          <- 全局数据 & AI 战略（北极星）
    |                                  定义了"为什么"需要 Supabase
    |
    +-- STORAGE_STRATEGY.md (v1.0)  <- 存储技术选型 & 架构设计
    |       |                          定义了"怎么做"的架构蓝图
    |       |
    |       +-- SUPABASE_ADOPTION.md <- 本文档：实施进度跟踪
    |                                  记录了"做到了哪里"
    |
    +-- KB_STORAGE_DESIGN.md        <- KB 存储架构细节
    +-- ZB_KB_KNOWLEDGE_AGENT_DESIGN.md <- Zip Blinds KB 专项
```

**关键关系说明**：
- **与 DATA_AI_STRATEGY.md**：该文档 §4 定义了 Lakehouse 数据架构（PostgreSQL + Object Store + pgvector），本文档跟踪 PostgreSQL（Supabase）层的实际落地进度。AI Agent 所需的数据基础设施就绪程度直接影响 Phase 1 MVP 的 AI 功能上线时间。
- **与 STORAGE_STRATEGY.md**：该文档 §5 规划了分阶段实施计划（Phase 1→2→3），本文档记录 Phase 2（Supabase 接入）的详细执行状态。存储策略中的 Bucket 设计、RLS 策略、升级路径等架构决策在此得到具体的实施验证。

---

## 1. 基础设施概览

### 1.1 Supabase 项目信息

| 项目 | 值 |
|------|---|
| **项目 URL** | `https://drofojkakxitrqxnxrhh.supabase.co` |
| **区域** | US East |
| **计划** | Free Tier |
| **前端集成** | `NestopiaDB` 全局对象（`js/supabase-config.js`） |
| **存储封装** | `NestopiaStorage` 全局对象（`js/supabase-storage.js`，684 行） |
| **代码引用** | 136 处 `NestopiaDB` 引用遍布项目 |

### 1.2 核心设计模式

```
所有模块统一采用相同的持久化模式：

+---------------------------------------------+
|  用户操作（保存/编辑/删除）                      |
+----------------------+----------------------+
                       v
+---------------------------------------------+
|  1. 更新本地状态（JS 内存 / localStorage）      |
|  2. 异步同步到 Supabase（非阻塞）              |
|  3. Supabase 不可用时静默降级，不影响操作        |
+---------------------------------------------+

加载数据时：
  Supabase 可用？ -> 从 DB 加载 -> 渲染
  Supabase 不可用？ -> 用本地数据/硬编码默认值 -> 渲染
```

---

## 2. 数据库表清单

### 2.1 已创建并对接前端的表（10 张）

| # | 表名 | 用途 | 数据格式 | CRUD 支持 | 前端引用 |
|---|------|------|---------|----------|---------|
| 1 | `kb_documents` | KB 文档元数据 | 关系型 | ✅ 完整 | KB 页面上传/列表/删除/预览 |
| 2 | `tenant_products` | 租户自定义产品目录 | JSONB | ✅ 完整 | Add/Edit/Delete Modal + Cost/Price 双层 |
| 3 | `project_intake_data` | Intake 问卷 + 文件引用 | JSONB | ✅ 读写 | 打开时加载，保存时同步 |
| 4 | `project_designer_state` | 设计师照片/风格/选品 | JSONB | ✅ 读写 | 每次操作自动同步 |
| 5 | `project_measurements` | 项目测量数据 | JSONB | ✅ 读写 | 打开面板时加载 |
| 6 | `project_quotations` | 报价配置 + 已保存报价 | JSONB | ✅ 读写 | 配置变更/保存时同步 |
| 7 | `project_workflow_state` | 工作流步骤推进 | JSONB | ✅ 读写 | 渲染时加载，推进时保存 |
| 8 | `chat_sessions` | B2B 聊天记录 | JSONB | ✅ 读写 | 初始化加载，消息后保存 |
| 9 | `customers` | 客户管理 | 关系型 | ⚠️ 读+写+改 | Intake A.1 同步创建/更新，Overview 实时查询 |
| 10 | `projects` | 项目管理 | 关系型+JSONB | ⚠️ 创建+读取 | 新建项目写入 DB，页面加载时从 DB 恢复 |

**总计**：10 张业务表已对接前端（8 张完整 CRUD + 2 张部分 CRUD） + 2 个 Storage Bucket 已集成

### 2.2 已定义 SQL 但未对接前端的表（来自 schema.sql）

这些表在 `supabase/schema.sql` 中有完整 DDL + 种子数据设计，但前端尚未调用：

| # | 表名 | 用途 | 当前前端状态 | 对接优先级 |
|---|------|------|------------|----------|
| 1 | `tenants` | 租户管理 | 硬编码 `tenantConfigs` 对象 | P1（Auth 集成时） |
| 2 | `users` | 用户管理 | 无登录系统 | P1（Auth 集成时） |
| 3 | `user_sessions` | 会话管理 | 无 | P1（Auth 集成时） |
| 4 | `partners` | 渠道合作伙伴 | `partners.html` 中硬编码 | P2 |
| 5 | `products` | 产品（原始 schema 版） | 已被 `tenant_products` 取代 | — |
| 6 | `product_categories` | 产品分类 | 硬编码 `productCategories` | P2 |
| 7 | `product_files` | 产品文件版本管理 | 未实现 | P2 |
| 8 | `pricing` | 多层级定价规则 | 嵌入 `tenant_products.product_data`（含 cost/price 双层） | P2 |
| 9 | `cost_components` | 成本分析 | 未实现 | P3 |
| 10 | `designs` | 设计方案 | AI 占位符 | P2 |
| 11 | `orders` | 订单管理 | 硬编码 HTML 表格 | P0 |
| 12 | `order_items` | 订单明细 | 未实现 | P0 |
| 13 | `payments` | 支付记录 | 未实现 | P2 |
| 14 | `audit_logs` | 审计日志 | 未实现 | P2 |
| 15 | `system_configs` | 系统配置 | 未实现 | P3 |
| 16 | `documents` | 通用文档（多态） | 未实现 | P3 |

### 2.3 Storage Bucket 状态

| Bucket | 可见性 | 文件大小限制 | RLS 状态 | 对接状态 |
|--------|-------|------------|---------|---------|
| `kb-tenant-files` | Private | 50MB | ✅ 正式策略 + ⚠️ DEV-ONLY 临时策略 | ✅ 已集成 |
| `kb-project-files` | Private | 50MB | ✅ 正式策略 + ⚠️ DEV-ONLY 临时策略 | ✅ 已集成 |

> ⚠️ **上线前必须操作**：移除 `003_storage_buckets.sql` 中的 DEV-ONLY anon 策略（行 199-234）

---

## 3. 功能模块覆盖度

### 3.1 完全就绪（10/16 模块 — 62.5%）

| 模块 | 描述 | 完成度 |
|------|------|--------|
| ✅ KB 文档管理 | 上传/列表/删除/预览/状态管理 | 100% |
| ✅ 产品目录 CRUD | 新增/编辑/删除/租户隔离/Seed/Cost+Price 双层 | 100% |
| ✅ Intake 问卷 | 8 模块表单数据持久化 | 100% |
| ✅ Intake 文件引用 | 上传文件元数据跟随问卷同步 | 100% |
| ✅ 设计师状态 | 照片/风格/选品状态持久化 | 100% |
| ✅ 项目测量 | Step 3 测量数据跨设备可见 | 100% |
| ✅ 项目报价 | Step 4 配置 + 已保存报价列表 | 100% |
| ✅ 工作流管理 | 步骤推进 + 状态覆盖 | 100% |
| ✅ 聊天记录 | 会话列表 + 消息历史 | 100% |
| ✅ 文件存储 | 项目级/租户级文件上传到 Storage | 100% |

### 3.2 部分就绪（3/16 模块）

| 模块 | 已完成 | 缺失 | 完成度 |
|------|--------|------|--------|
| ⚠️ 客户管理 | Intake A.1 自动创建/更新客户到 DB，Overview 实时查询 | 独立 Customer 页面的 Delete + 高级搜索/筛选 | 70% |
| ⚠️ 项目管理 | 新建项目持久化到 `projects` 表，页面刷新后从 DB 恢复 | 项目编辑/删除/状态更新同步到 DB，Demo 数据仍硬编码 | 40% |
| ⚠️ 订单管理 | 列表展示（hardcoded） | Create/Detail/Edit CRUD + DB | 10% |

### 3.3 未开始（3/16 模块）

| 模块 | schema.sql 表 | 前端状态 | 优先级 |
|------|-------------|---------|--------|
| ❌ Auth 认证 | `users` + `user_sessions` | 无登录，硬编码 tenant_id | P1 |
| ❌ 支付流程 | `payments` | 完全未实现 | P2 |
| ❌ AI 设计生成 | `designs` | alert 占位符 | P2 |

---

## 4. 占位符功能清单（待实现）

### 4.1 Toast / Alert 占位符

| # | 功能 | 位置 | 当前行为 | 优先级 |
|---|------|------|---------|--------|
| 1 | 订单创建 | Order Create button | `showToast('...will open here')` | P0 |
| 2 | 订单详情 | Order Detail button | `showToast('...will open here')` | P0 |
| 3 | AI 设计生成 | Generate Design button | `alert('will be connected')` | P2 |
| 4 | 继续编辑设计 | Continue Editing button | `alert('will be connected')` | P2 |
| 5 | 下载设计 | Download Design button | `alert('will be available')` | P2 |
| 6 | 许可证流程 | Permit workflow | 占位符 | P2 |
| 7 | 工单系统 | Ticket system | `coming soon` | P3 |
| 8 | 报告问题 | Report Issue button | 占位符 | P3 |
| 9 | 团队成员管理 | Team Member buttons | 占位符 | P3 |

### 4.2 硬编码数据（待迁移到 DB）

| 数据 | 变量/位置 | 数量 | 当前状态 |
|------|---------|------|--------|
| 项目列表 | `greenscapeProjects`/`omeyaSinProjects` 等 | 12 个 Demo 项目 | ⚠️ 用户新建项目已持久化；Demo 数据仍硬编码，DB 加载后合并去重 |
| 客户数据 | `dummyCustomers` 对象 | 3 个客户 | ⚠️ Intake A.1 创建的客户已持久化；Overview 从 DB 实时查询 |
| 订单数据 | HTML 表格内嵌 | ~5 个订单 | ❌ 需 Order CRUD + Supabase |
| 工作流项目 | `workflowProjects` 数组 | 4 个项目 | ✅ 已有 DB 覆盖，默认值硬编码作为 fallback |
| 租户配置 | `tenantConfigs` 对象 | 4 个租户 | ⏳ 需 Auth 集成后迁移 |
| 产品分类显示 | `allProductCategories` 数组 | 3-4 类 | ⏳ 低优先级，可后续迁移 |
| Stats 数字 | HTML hardcoded (10, 10, 3, 156) | — | ⚠️ 产品已动态，客户部分动态，订单待处理 |

---

## 5. localStorage 使用清单

| 键名/模式 | 用途 | 迁移状态 | 策略 |
|----------|------|---------|------|
| `nestopia_pf_{projectId}` | 项目文件本地缓存 | ✅ 已合理降级 | Supabase 优先，localStorage 回退 |
| `auth_token` | 认证令牌 | ⏳ 待 Auth 集成 | 迁移到 Supabase Auth |
| `auth_data` | 用户数据 | ⏳ 待 Auth 集成 | 迁移到 Supabase Auth |
| `tenant_slug` | 租户标识 | ⏳ 待 Auth 集成 | 从 JWT 获取 |
| `getQuotStorageKey()` | 报价数据 | ✅ 已双写 | Supabase 同步 + localStorage 保留 |
| `preferredLang` | UI 语言偏好 | ⏳ 低优先级 | 可保留 localStorage |

---

## 6. 安全状态

### 6.1 当前安全模型

| 层面 | 状态 | 说明 |
|------|------|------|
| **认证 (AuthN)** | ❌ 未启用 | 使用固定 anon key，无用户登录 |
| **授权 (AuthZ)** | ⚠️ 部分 | RLS 策略已定义但基于 `true`（全开放） |
| **租户隔离** | ⚠️ 应用层 | 前端代码中硬编码 `PRODUCT_TENANT_ID` |
| **传输加密** | ✅ HTTPS | Supabase 默认 TLS |
| **Storage 访问** | ⚠️ DEV-ONLY | 临时 anon 策略允许任何人读写 |

### 6.2 上线前必须完成

| # | 任务 | 风险等级 | 关联模块 |
|---|------|---------|---------|
| 1 | 接入 Supabase Auth | 🔴 高 | 所有模块 |
| 2 | 移除 DEV-ONLY Storage RLS | 🔴 高 | Storage Buckets |
| 3 | 将 `FOR ALL USING (true)` 策略替换为真实租户隔离 | 🔴 高 | 所有 10 张表 |
| 4 | 将 `PRODUCT_TENANT_ID` 从硬编码改为 Auth JWT | 🟡 中 | 所有 DB helper 函数 |

---

## 7. 实施历史（Git Commits）

| 日期 | Commit | 说明 |
|------|--------|------|
| 2026-04-10 | `3d37d8c` | fix: 修正 Supabase Project URL（dtrsfsjl -> drofojk） |
| 2026-04-10 | `e8cd088` | feat: KB 页面对接 Supabase 后端 |
| 2026-04-10 | `61da055` | feat: Intake Form 数据持久化到 Supabase |
| 2026-04-10 | `6cd5701` | feat: 测量数据 + 报价数据持久化到 Supabase |
| 2026-04-10 | `a2b3c57` | feat: 设计师状态 + Intake 文件引用持久化到 Supabase |
| 2026-04-10 | `571ecfc` | feat: 工作流状态 + 聊天记录持久化到 Supabase |
| 2026-04-13 | `7c5df19` | feat: 产品目录 CRUD — 租户可自定义产品 |
| 2026-04-13 | `a8d16b7` | feat: Intake Form + Workflow Step 文件上传接入 Supabase Storage |
| 2026-04-13 | `a6c02b2` | feat: Customer CRUD + A.1 Intake 同步到 Customer Info Card |
| 2026-04-13 | `942f310` | fix: Company Overview Customers 表格改为使用 Supabase 实时数据 |
| 2026-04-14 | `4e2cba9` | fix: 综合修复文件预览 4 个关联 Bug — 签名 URL + mimeType 检测 |
| 2026-04-14 | `410270d` | fix: Intake 文件预览失败 — kb_documents CHECK 约束拒绝 intake category |
| 2026-04-14 | `326e056` | feat: Product Cost vs Price 双层管理 — pricing 重构为 cost + price |
| 2026-04-15 | `4125ea1` | fix: Project 创建持久化到 Supabase — 刷新后不再丢失 |

---

## 8. 优先级路线图

### Phase 当前：数据持久化 ✅ 基本完成

已覆盖 13/16 功能模块（10 完整 + 3 部分）。所有用户可变数据（Intake/设计/测量/报价/工作流/聊天/产品/客户/项目）均已持久化或部分持久化。

### Phase 下一步：业务 CRUD 完善（P0）

| 任务 | 表 | 工作量 | 前置条件 |
|------|---|--------|---------|
| Project 编辑/删除/状态同步 | `projects` | 中 | 无 |
| Order CRUD | `orders` + `order_items` | 大 | 无 |
| Customer 独立页面完善 | `customers` | 小 | 无 |

### Phase 后续：Auth + 安全（P1）

| 任务 | 说明 | 工作量 |
|------|------|--------|
| Supabase Auth 集成 | 登录/注册/JWT/OAuth | 大 |
| RLS 策略升级 | `true` -> `auth.jwt() ->> 'tenant_id'` | 中 |
| 移除 DEV-ONLY 策略 | Storage Bucket 安全加固 | 小 |

### Phase 远期：AI + 高级功能（P2-P3）

| 任务 | 关联文档 |
|------|---------|
| AI 设计生成后端 | DATA_AI_STRATEGY.md §3.1 |
| pgvector 语义搜索 | DATA_AI_STRATEGY.md §4.1 |
| 支付流程 | schema.sql `payments` 表 |
| 成本分析 Agent | DATA_AI_STRATEGY.md §3.2 |
| Cloudflare R2 扩展 | STORAGE_STRATEGY.md §Phase 3 |

---

## 9. 免费层资源使用评估

| 资源 | 额度 | 当前预估 | 风险 |
|------|------|---------|------|
| 数据库存储 | 500MB | ~35MB（10 张表 + 种子数据 + 用户数据） | 🟢 低 |
| 文件存储 | 1GB | ~100MB（KB 文档 + 项目文件） | 🟢 低 |
| 出站带宽 | 5GB/月 | ~1GB/月 | 🟢 低 |
| 活跃项目 | 2 个 | 1 个（Staging/Production 共用） | 🟢 低 |
| 闲置暂停 | 7 天 | Demo 间歇使用可能触发 | 🟡 中 |

**升级触发条件**：参见 [STORAGE_STRATEGY.md §8.2](STORAGE_STRATEGY.md) 的升级决策流程。

---

**文档负责人**: Nestopia 产品 & 技术团队  
**更新频率**: 每次 Supabase 相关代码变更后更新  
**下次重大里程碑**: Order CRUD + Project 完整 CRUD 完成后
