# UI 回归测试套件
## Nestopia SaaS 运营平台 — 冒烟级别

> **版本**: v1.0
> **创建日期**: 2026-04-19
> **适用范围**: `company-operations.html` 全部功能模块
> **测试环境**: Staging (n-site-prototype.pages.dev)
> **前置条件**: 浏览器 Chrome/Edge 最新版，Supabase 连接正常

---

## 1. 测试策略

### 1.1 目标

在每次 Phase 完成或重大代码变更后，通过 **15 个核心冒烟用例** + **Console 自动验证脚本** 快速确认系统关键路径无回归。

### 1.2 方法

| 层级 | 方式 | 工具 | 用例数 |
|------|------|------|--------|
| **L0 — 命名空间 & API 就绪** | 自动 | 浏览器 Console 脚本 `scripts/console-regression.js` | ~30 项检查 |
| **L1 — 冒烟测试** | 手动 | 本文档 Section 3 | 15 个用例 |
| **L2 — 完整回归**（未来） | 自动 | Playwright E2E（Phase 5 引入） | 80+ 用例 |

### 1.3 执行频率

| 触发时机 | 执行范围 |
|---------|---------|
| 每个 Phase 完成 | L0 + L1 |
| 每次 Staging 部署后 | L0 |
| 推送 Production 前 | L0 + L1（全部通过方可推送） |
| 关键 Bug Fix | L0 + 受影响用例 |

### 1.4 测试数据

| 租户 | 说明 | 预置数据 |
|------|------|---------|
| **Greenscape Outdoors** | 美国市场，英制单位 | 3 个种子项目 |
| **Omeya-SIN** | 新加坡市场，公制单位 | 3 个种子项目 |
| **Nestopia-CHN** | 中国市场，公制单位 | 3 个种子项目 |

---

## 2. L0 — Console 自动验证

在浏览器 Console 中粘贴 `scripts/console-regression.js` 的内容，脚本将自动检测：

| 检查类别 | 检查项 | 预期 |
|---------|--------|------|
| 命名空间存在性 | `Nestopia`, `Nestopia.auth`, `Nestopia.router`, ... | 全部为 `object` |
| 数据层加载 | `Nestopia.data.pricing.zbProductTiers` | 非空数组 |
| 模块注册 | `Nestopia.modules.projects`, `Nestopia.agents.designer`, ... | 全部为 `object` |
| 全局别名一致性 | `window.showToast === Nestopia.utils.showToast` | `true` |
| onclick 命名空间绑定 | 随机采样 onclick 属性值包含 `Nestopia.` | 通过 |
| Supabase 连接 | `NestopiaDB.isConnected()` | `true` |
| 页面 DOM 完整性 | 14 个 `#page-*` 元素存在 | 全部存在 |
| 无 JS 报错 | `window.__consoleErrors` 为空 | `[]` |

**执行方式**:
```
1. 打开 Staging 站点
2. F12 → Console
3. 粘贴 scripts/console-regression.js 内容
4. 查看输出（✅ PASS / ❌ FAIL）
```

---

## 3. L1 — 冒烟测试用例

### 用例格式说明

```
TC-XX: [用例名称]
优先级: P0(阻断) / P1(核心) / P2(重要)
前置: [前提条件]
步骤: [操作步骤]
预期: [期望结果]
验证: [具体检查点]
```

---

### TC-01: 登录 & Dashboard 加载
**优先级**: P0
**前置**: 无
**步骤**:
1. 打开 `https://n-site-prototype.pages.dev/company-operations.html`
2. 等待页面加载完成

**预期**: Dashboard 页面正确显示
**验证**:
- [ ] 顶栏显示 "Nestopia" 品牌名 + 用户头像
- [ ] 侧边栏显示所有导航项
- [ ] Company Overview 数据卡片（Orders / Customers / Products）已渲染
- [ ] Console 无 `Nestopia is not defined` 或 `Cannot read properties of undefined` 报错

---

### TC-02: 租户切换
**优先级**: P1
**前置**: TC-01 通过
**步骤**:
1. 点击侧边栏的租户选择区域
2. 切换到 "Omeya-SIN"
3. 观察页面数据刷新
4. 再切换到 "Nestopia-CHN"

**预期**: 页面数据跟随租户切换
**验证**:
- [ ] 侧边栏项目列表更新为对应租户的种子项目
- [ ] Overview 统计数据更新
- [ ] Console 无报错

---

### TC-03: 创建新项目
**优先级**: P0
**前置**: TC-01 通过
**步骤**:
1. 点击侧边栏 "+ New Project" 按钮
2. 填写项目名称（如 "Smoke Test Project"）
3. 选择客户（如果有选项）
4. 点击 "Create" 提交

**预期**: 项目创建成功
**验证**:
- [ ] 弹窗关闭
- [ ] 新项目出现在侧边栏项目列表中
- [ ] Workflow Pipeline 页面中可见新项目
- [ ] Console 显示 Supabase 持久化成功（无错误）

---

### TC-04: 项目详情 & Workflow Pipeline
**优先级**: P0
**前置**: TC-03 通过（或有种子项目）
**步骤**:
1. 导航到 "Service Workflow" 页面
2. 点击任意项目卡片
3. 查看项目详情面板

**预期**: 项目详情面板正确显示
**验证**:
- [ ] 6-Step Pipeline 横向展示，当前步骤高亮
- [ ] 项目基本信息（客户、状态、阶段）正确
- [ ] "Advance Step" 按钮可见
- [ ] 点击 Step 圆圈可展开/收起详情

---

### TC-05: Step 推进 (Advance Step)
**优先级**: P1
**前置**: TC-04 通过
**步骤**:
1. 在项目详情面板点击 "Advance to Step X"
2. 观察步骤推进

**预期**: 步骤推进成功
**验证**:
- [ ] Pipeline 高亮步骤更新
- [ ] showToast 提示 "Project advanced to Step X"
- [ ] 项目卡片状态更新

---

### TC-06: AI Designer — 选产品 & 生成设计
**优先级**: P1
**前置**: TC-01 通过
**步骤**:
1. 导航到 "AI Designer" 页面
2. 从产品目录中选择一个产品（如 Zip Blinds）
3. 选择跨度 (Span)
4. 选择颜色 (Color)
5. 上传一张院子照片
6. 点击 "Generate Design"

**预期**: 设计生成流程启动
**验证**:
- [ ] 产品选择后参数面板更新
- [ ] 颜色按钮高亮正确（onclick → `Nestopia.agents.designer.selectDesignerColor`）
- [ ] Generate 按钮可点击
- [ ] 点击后进入 SSE 流式加载状态
- [ ] 生成成功 → 结果图展示 + showToast 成功

---

### TC-07: Pricing Agent — 选 Tier & 计算报价
**优先级**: P1
**前置**: TC-01 通过
**步骤**:
1. 导航到 "Pricing Agent" 页面
2. 选择产品 Tier（Good / Better / Best）
3. 输入宽度和高度
4. 调整数量 (+/-)
5. 点击 "Calculate"

**预期**: 6 策略定价引擎计算完成
**验证**:
- [ ] Tier 卡片选中高亮（onclick → `Nestopia.agents.pricing.selectProductTier`）
- [ ] 数量调整按钮工作（onclick → `Nestopia.agents.pricing.adjustZbQty`）
- [ ] Retail / Wholesale 模式切换生效（onclick → `Nestopia.agents.pricing.setPricingMode`）
- [ ] 计算结果面板展示 6 种策略价格
- [ ] showToast 提示 "Zip Blinds pricing calculated"

---

### TC-08: Step 2 — AI 设计面板
**优先级**: P1
**前置**: 有项目处于 Step 2
**步骤**:
1. 在项目详情中展开 Step 2
2. 选择产品
3. 上传照片（最多 3 张）
4. 点击 "Generate AI Design"

**预期**: Step 2 设计面板功能正常
**验证**:
- [ ] 产品选择卡片可点击（onclick → `Nestopia.steps.step2.selectStep2Product`）
- [ ] 照片上传槽位可点击（onclick → `Nestopia.steps.step2.triggerStep2PhotoUpload`）
- [ ] 清除照片按钮工作（onclick → `Nestopia.steps.step2.clearStep2Photo`）
- [ ] Generate 按钮启用条件正确
- [ ] 生成成功后显示下载和迭代按钮

---

### TC-09: Step 3 — 量尺数据录入
**优先级**: P1
**前置**: 有项目处于 Step 3
**步骤**:
1. 在项目详情中展开 Step 3
2. 填入量尺数据（宽度、高度、开口数）
3. 添加一个障碍物
4. 点击 "Save Measurement"

**预期**: 量尺数据保存成功
**验证**:
- [ ] 数据输入面板渲染正确
- [ ] 添加障碍物（onclick → `Nestopia.steps.step3.addStep3Obstacle`）
- [ ] 移除障碍物按钮工作（onclick → `Nestopia.steps.step3.removeStep3Obstacle`）
- [ ] Save 后 showToast "Measurement data saved"
- [ ] Supabase 持久化成功

---

### TC-10: Step 4 — 报价面板
**优先级**: P1
**前置**: 有项目处于 Step 4，Step 3 数据已填
**步骤**:
1. 在项目详情中展开 Step 4
2. 选择 Tier
3. 选择报价方案 (Conservative / Recommended / Premium)
4. 点击 "Calculate Pricing"

**预期**: 报价面板继承 Step 3 数据并计算
**验证**:
- [ ] Tier 选择工作（onclick → `Nestopia.steps.step4.selectTier`）
- [ ] 报价方案选择工作（onclick → `Nestopia.steps.step4.selectQuote`）
- [ ] 数量调整工作（onclick → `Nestopia.steps.step4.adjustQty`）
- [ ] Calculate 后显示价格明细
- [ ] showToast "Pricing recalculated"

---

### TC-11: 报价编辑器
**优先级**: P1
**前置**: TC-04 通过（有项目）
**步骤**:
1. 在项目详情中点击 "Generate Quotation"
2. 添加 1-2 个产品行项
3. 检查总价计算
4. 点击 "Save"
5. 点击 "Preview"

**预期**: 报价编辑器完整工作
**验证**:
- [ ] 编辑器弹窗打开（onclick → `Nestopia.utils.quotEditor.openQuotationEditor`）
- [ ] 添加行项工作（onclick → `Nestopia.utils.quotEditor.addQuotLineItem`）
- [ ] 总价自动更新
- [ ] Save 成功 + showToast
- [ ] Preview 弹出打印预览窗口
- [ ] 关闭编辑器（onclick → `Nestopia.utils.quotEditor.closeQuotationEditor`）

---

### TC-12: Knowledge Base — 上传文档
**优先级**: P2
**前置**: TC-01 通过
**步骤**:
1. 导航到 "Knowledge Base" 页面
2. 点击 "Upload Document"
3. 选择文件 + 分类 + 添加标签
4. 提交上传

**预期**: 文档上传到 Supabase Storage
**验证**:
- [ ] 上传弹窗打开（onclick → `Nestopia.modules.knowledgeBase.openKBUploadModal`）
- [ ] 标签添加/建议标签工作（onclick → `Nestopia.modules.knowledgeBase.addKBSuggestedTag`）
- [ ] 上传成功 → 文档出现在列表中
- [ ] 翻页按钮工作（onclick → `Nestopia.modules.knowledgeBase.kbPrevPage` / `kbNextPage`）

---

### TC-13: B2B Chatbot
**优先级**: P2
**前置**: TC-01 通过
**步骤**:
1. 导航到 "B2B Chatbot" 页面（或点击浮动按钮）
2. 创建新会话
3. 输入消息 "Hello, I need a quote for zip blinds"
4. 发送

**预期**: Chatbot 功能正常
**验证**:
- [ ] 创建会话按钮工作（onclick → `Nestopia.utils.chatbot.b2bChat.createSession`）
- [ ] 消息发送（onclick → `Nestopia.utils.chatbot.b2bChat.send`）
- [ ] AI 回复显示在对话区
- [ ] Quick Action 快捷按钮可点击（onclick → `Nestopia.utils.chatbot.b2bChat.quickAction`）
- [ ] 浮动窗口展开/收起工作（onclick → `Nestopia.utils.chatbot.b2bChat.toggleFloating`）

---

### TC-14: Products & Customers CRUD
**优先级**: P2
**前置**: TC-01 通过
**步骤**:
1. 导航到 "Products" 页面，查看产品列表
2. 点击产品查看详情
3. 导航到 "Customers" 页面
4. 检查客户列表渲染

**预期**: 列表和详情正确渲染
**验证**:
- [ ] Products 列表显示产品卡片
- [ ] 产品详情面板展开
- [ ] Customers 列表显示客户数据
- [ ] 筛选/搜索功能工作

---

### TC-15: 命名空间 onclick 一致性
**优先级**: P0
**前置**: TC-01 通过
**步骤**:
1. F12 打开 Console
2. 执行 `scripts/console-regression.js` 中的命名空间验证部分
3. 检查输出

**预期**: 所有命名空间路径有效
**验证**:
- [ ] `typeof Nestopia === 'object'` → true
- [ ] 所有 `Nestopia.modules.*` 存在且为 object
- [ ] 所有 `Nestopia.agents.*` 存在且为 object
- [ ] 所有 `Nestopia.steps.*` 存在且为 object
- [ ] 所有 `Nestopia.utils.*` 存在且为 object
- [ ] 全局别名与命名空间指向同一引用
- [ ] 随机点击 5 个按钮确认 onclick 响应正常

---

## 4. 测试结果记录模板

```markdown
## 回归测试报告 — [Phase/版本号]

**测试日期**: YYYY-MM-DD
**测试人**: [姓名]
**环境**: Staging / Production
**Commit**: [hash]
**L0 Console 验证**: ✅ PASS (30/30) / ❌ FAIL (X/30)

| 用例 | 名称 | 结果 | 备注 |
|------|------|------|------|
| TC-01 | 登录 & Dashboard | ✅/❌ | |
| TC-02 | 租户切换 | ✅/❌ | |
| TC-03 | 创建新项目 | ✅/❌ | |
| TC-04 | 项目详情 & Workflow | ✅/❌ | |
| TC-05 | Step 推进 | ✅/❌ | |
| TC-06 | AI Designer | ✅/❌ | |
| TC-07 | Pricing Agent | ✅/❌ | |
| TC-08 | Step 2 AI 设计 | ✅/❌ | |
| TC-09 | Step 3 量尺 | ✅/❌ | |
| TC-10 | Step 4 报价 | ✅/❌ | |
| TC-11 | 报价编辑器 | ✅/❌ | |
| TC-12 | Knowledge Base | ✅/❌ | |
| TC-13 | B2B Chatbot | ✅/❌ | |
| TC-14 | Products & Customers | ✅/❌ | |
| TC-15 | 命名空间验证 | ✅/❌ | |

**总结**: X/15 通过 | 阻断问题: [列出]
```

---

## 5. 未来扩展（Phase 5+）

| 扩展方向 | 说明 |
|---------|------|
| **Playwright E2E** | Phase 5 引入 Node.js 后，将 L1 用例转为 Playwright 自动化 |
| **视觉回归** | 对关键页面截图对比（Playwright + pixelmatch） |
| **API 契约测试** | 验证 `/api/chat`、`/api/design-generate` 接口响应格式 |
| **性能基准** | 首屏加载时间 < 3s，JS 文件总大小 < 500KB |
| **多租户矩阵** | 3 租户 × 15 用例 = 45 用例全覆盖 |

---

*文档版本: v1.0 | 适用: Phase 0-4B 回归验证*
