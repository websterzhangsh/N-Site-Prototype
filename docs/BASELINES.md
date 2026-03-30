# Nestopia Code Baselines Registry

> 本文档记录所有主要代码基线（Git Tags），包括关键信息、功能范围、技术栈变更和注意事项。
>
> **仓库**: `websterzhangsh/N-Site-Prototype`
> **部署**: Cloudflare Pages (`n-site-prototype.pages.dev`)
> **分支**: `main`

---

## Baseline 概览

| # | Tag | 日期 | Commit | 关键里程碑 |
|---|-----|------|--------|------------|
| 1 | `v1.0-netlify-baseline` | 2026-02-06 | `a242bb3` | Netlify 时代最终版本，迁移前快照 |
| 2 | `v1.0-pre-hero-gallery` | 2026-02-13 | `d6398e1` | Cloudflare Pages 迁移完成，产品分类切换前快照 |
| 3 | `v1.0-ui-baseline` | 2026-03-03 | `2de768a` | 暗色主题基线，主题/配色大改前快照 |
| 4 | `v20260330` | 2026-03-30 | `19b1b45` | B2B 运营平台 + 6-Step Workflow + AI Agent 集成 |

---

## Baseline 1: `v1.0-netlify-baseline`

**创建日期**: 2026-02-06  
**Commit**: `a242bb32dc02334811ac9c3b54c4cce940823d9a`  
**标注说明**: Baseline before Cloudflare Pages migration — Netlify + GitHub Pages version

### 功能范围
- 单页面阳光房产品着陆页 (`index.html`, ~1,468 行)
- AI Designer 工具 — 基于 Qwen 模型的设计图生成
- Netlify Functions 后端 API
- 双语支持（中/英）
- 基础 Tailwind CSS + Vite 构建

### 技术栈
| 层级 | 技术 |
|------|------|
| 前端 | HTML + Tailwind CSS + Vite |
| 后端 | Netlify Functions (Node.js) |
| AI | Qwen (DashScope API) |
| 部署 | Netlify + GitHub Pages |
| 构建 | Vite |

### 核心文件
```
index.html                          — 主着陆页
api/design/generate.js              — AI 设计生成 API
netlify/functions/design-generate.js — Netlify Function
tailwind.config.js                  — Tailwind 配置
```

### 累计规模
- 39 files, ~10,683 行代码（相对初始提交）
- 44 commits（含初始提交）
- 0 docs/ 文档

### 注意事项
- 此版本之后项目从 Netlify 迁移至 Cloudflare Pages
- Netlify 相关配置文件已在后续标记为 `.deprecated`
- 产品范围仅限阳光房（Sunroom）

---

## Baseline 2: `v1.0-pre-hero-gallery`

**创建日期**: 2026-02-13  
**Commit**: `d6398e12d4a428b829cdca08842f6cd4cf67a676`  
**标注说明**: Baseline: UI before hero/gallery product category switching changes

### 与上一基线差异 (17 commits)
- **平台迁移**: Netlify → Cloudflare Pages (Wrangler)
- **LLM Chatbot**: 新增基于 qwen-turbo 的聊天机器人
- **LLM 统一接口**: 实现 `llm-factory.js` + adapter 模式
- **UI 改版**: 解决方案导向的用户体验 + 真实项目照片
- **品牌升级**: "阳光房专家" → "庭院定制专家"
- **API 稳定性**: 增加重试、超时和错误处理机制

### 功能范围
- 着陆页 (`index.html`, ~1,601 行)
- Cloudflare Pages Functions 后端
- LLM Chatbot 集成
- 统一 LLM 接口（adapter pattern: qwen-adapter）
- 产品图片库（Hero/Gallery）

### 技术栈变更
| 变更项 | 旧 | 新 |
|--------|-----|-----|
| 部署平台 | Netlify | Cloudflare Pages |
| 后端函数 | Netlify Functions | Cloudflare Pages Functions |
| 部署命令 | — | `wrangler pages deploy dist` |
| 新增能力 | — | LLM Chatbot (qwen-turbo) |

### 新增核心文件
```
functions/api/chat.js               — Chatbot API
functions/api/design-generate.js    — 迁移后的设计 API
functions/lib/llm-config.js         — LLM 配置
functions/lib/llm-factory.js        — LLM 工厂模式
functions/lib/qwen-adapter.js       — Qwen 适配器
src/adapters/base.adapter.ts        — TS 基础适配器
images/hero/*, images/gallery/*     — 产品图片
```

### 累计规模
- 70 files, ~11,814 行代码
- 61 commits
- 0 docs/ 文档

### 注意事项
- 此版本后将进行 Hero/Gallery 产品分类切换改造
- Netlify 配置已重命名为 `.deprecated` 文件
- Chatbot `max_tokens` 经历了 300 → 500 → 300 的调优过程

---

## Baseline 3: `v1.0-ui-baseline`

**创建日期**: 2026-03-03  
**Commit**: `2de768aa4f84a5679052c41568db063eefcbc223`  
**标注说明**: UI Baseline: dark theme before major theme/color scheme change

### 与上一基线差异 (24 commits)
- **产品分类切换**: Hero & Gallery 支持 Sunroom / Pavilion / Windproof 三类产品
- **AI Designer 增强**:
  - 自定义 Prompt 输入（800 字符限制）
  - 支持最多 3 张照片上传
  - 迭代编辑（最多 9 轮）
  - SSE 流式生成替代异步轮询
  - 模型优先级回退（6 模型链）
- **内容精修**: Why Choose Us 卡片文案、Hero 标语优化
- **技术文档**: 新增 AI Platform Architecture 设计文档

### 功能范围
- 着陆页 (`index.html`, ~2,040 行)
- 三大产品线展示（Sunroom / Pavilion / Windproof Roller Shutter）
- 完整 AI Designer 工作流（上传 → 生成 → 迭代精修）
- SSE 流式 API 通信
- 多产品图片库管理

### 技术栈变更
| 变更项 | 描述 |
|--------|------|
| API 通信 | 异步轮询 → SSE 流式 |
| AI 模型 | 单模型 → 6 模型优先级回退链 |
| 设计迭代 | 不支持 → 最多 9 轮迭代编辑 |
| 图片输入 | 单张 → 最多 3 张 |

### 新增核心文件
```
AI_PLATFORM_ARCHITECTURE.md              — AI 平台架构设计
functions/api/design-status.js           — 设计状态查询 API
public/images/products/sunroom/*         — 阳光房产品图片
public/images/products/pavilion/*        — 凉亭产品图片
public/images/products/windproof/*       — 防风卷帘产品图片
```

### 累计规模
- 102 files, ~13,608 行代码
- 85 commits
- 0 docs/ 文档（架构文档在根目录）

### 注意事项
- 此版本之后将进行主题/配色方案大改
- 暗色主题的最终状态快照
- Chatbot 模型也增加了优先级回退机制
- 产品图片每类 3 张 Hero + 6 张 Gallery

---

## Baseline 4: `v20260330`

**创建日期**: 2026-03-30  
**Commit**: `19b1b451f0fb808d2b6c145791529d2cc9b5d0c0`  
**标注说明**: Baseline 20260330: Agent Toolbar 重构, Step 警告系统, Overview 滚动条, 项目步骤重分配

### 与上一基线差异 (53 commits) — 重大版本跨越
这是一个**里程碑式的基线**，代表了从单一着陆页到完整 B2B 运营平台的跨越。

#### 主要功能增量

**1. B2B Company Operations 平台 (`company-operations.html`)**
- 全新 12,588 行运营管理系统
- 多租户架构（Greenscape Builders 等）
- Overview 仪表盘（Orders / Customers / Products / Revenue 统计卡片）
- 完整 CRUD 管理模块（Products / Orders / Customers / Pricing）
- Team Management 团队管理
- Settings 系统设置

**2. 6-Step Service Workflow 六步服务流程**
- Step 1: Intent（客户意向）
- Step 2: AI Design（AI 设计）— 内联 AI Designer
- Step 3: Measurement & Design（测量与设计）
- Step 4: Quotation（报价）— 完整定价引擎
- Step 5: Production（生产）
- Step 6: Installation（安装）
- 每步可展开查看详细内容和交互面板

**3. 5 个 AI Agent 集成**
- AI Designer Agent（步骤内联）
- Pricing & Cost Controller Agent
- Compliance Manager Agent
- Customer Service Executive Agent
- Knowledge Base Builder Agent
- Agent Toolbar（独立工具栏，位于 Service Workflow 下方）
- AI Agent Collaboration（步骤内嵌，随步骤变化）

**4. Step 警告系统**
- 前进警告：点击未来步骤（n+1, n+2）时提示前置条件未完成
- 回退警告：点击已完成步骤（< n）时提示可能覆盖已有成果
- 报价风险警告：Step 5/6 打开报价面板时提示合同重新生成风险
- AI Designer 重启警告：Step 3+ 重新启动设计器时的确认提示

**5. 产品定价引擎**
- Zip Blinds 6-Strategy Pricing Engine
- Sunroom / Pergola / Zip Blinds 全产品线定价
- Material Cost 查看与跳转
- 2C/2B 双模式 System Prompt

**6. 首页增强 (`index.html`, 1,830+ 行增量)**
- Product Matrix — Pergola (Residential/Commercial)
- Before/After 设计对比 + 3D 动画视频
- Gallery 弹窗（Learn More）
- Learn More 锚点滚动导航
- 导航双击高亮修复

**7. 项目管理**
- Risk Heat Map（高/中/低/正常）
- Issues Tracker（优先级、状态、负责人）
- 3 个核心演示项目对齐 Step 2/3/4：
  - PRJ-003 Smith Sunroom → Step 2 (AI Design)
  - PRJ-004 Chen Pergola → Step 3 (Measurement)
  - PRJ-005 Davis Zip Blinds → Step 4 (Quotation)

### 技术栈变更
| 变更项 | 描述 |
|--------|------|
| 新增页面 | `company-operations.html` (12,588 行) |
| 首页增长 | `index.html` 2,040 → 3,870 行 |
| 文档体系 | 新增 42 份 docs/ 文档 |
| AI Agent | 5 个 AI Agent + Chatbot |
| 定价引擎 | Zip Blinds 6-Strategy 完整实现 |
| 工作流管理 | 6-Step per-project 状态机 |
| Qoder 集成 | `.qoder/` 规则和设置文件 |

### 新增核心文件
```
company-operations.html              — B2B 运营管理平台 (12,588 行)
.qoder/rules/webster-guidance.md     — Qoder AI 助手规则
.qoder/settings.local.json           — Qoder 本地设置
_headers / _redirects / _routes.json — Cloudflare Pages 路由配置
docs/PRODUCT_DEMO.md                 — 产品演示脚本
docs/AI_Agents_Strategy_Whitepaper.md — AI Agent 战略白皮书
docs/AI_Designer_Agent_Spec.md       — AI Designer 规格
docs/Compliance_Manager_Agent_Spec.md — 合规管理 Agent 规格
docs/Customer_Service_Executive_Agent_Spec.md — 客服 Agent 规格
docs/Pricing_Cost_Controller_Agent_Spec.md — 定价 Agent 规格
docs/B2B_Operations_UX_Design.md     — B2B 运营 UX 设计
docs/DATA_AI_STRATEGY.md             — 数据 + AI 战略
Pricing/*.pdf                        — 防风卷帘定价原始报价表
```

### 累计规模
- 381 files, ~47,007 行代码
- 278 commits
- 42 docs/ 文档

### 已知遗留项
- Overview 统计数据为演示样本（8 Orders, 24 Customers）
- 顶栏搜索/通知图标已隐藏（`display: none`）
- Agent Toolbar 中 Chatbot 按钮已移除
- Products 和 Revenue 卡片保持可见但数据未调整

---

## 附录

### A. 如何恢复到某个基线

```bash
# 查看某个基线的代码
git checkout v1.0-netlify-baseline

# 基于某个基线创建新分支
git checkout -b feature/xxx v20260330

# 查看两个基线之间的差异
git diff v1.0-ui-baseline v20260330 --stat

# 查看某基线的详细提交信息
git log -1 --format=full v20260330
```

### B. 基线之间的 Commit 数量

| 区间 | Commits | 主要变更方向 |
|------|---------|-------------|
| 初始 → v1.0-netlify-baseline | 44 | 项目初建 + AI Designer 原型 |
| v1.0-netlify-baseline → v1.0-pre-hero-gallery | 17 | 平台迁移 + Chatbot |
| v1.0-pre-hero-gallery → v1.0-ui-baseline | 24 | 产品分类 + AI 迭代编辑 |
| v1.0-ui-baseline → v20260330 | 53 | B2B 平台 + Workflow + Agents |

### C. 代码规模增长

| Baseline | Files | Lines | 增量 |
|----------|-------|-------|------|
| v1.0-netlify-baseline | 39 | ~10,683 | — |
| v1.0-pre-hero-gallery | 70 | ~11,814 | +1,131 |
| v1.0-ui-baseline | 102 | ~13,608 | +1,794 |
| v20260330 | 381 | ~47,007 | +33,399 |

### D. 部署平台变迁

```
v1.0-netlify-baseline    Netlify + GitHub Pages
         ↓
v1.0-pre-hero-gallery    Cloudflare Pages (Wrangler)
         ↓
v1.0-ui-baseline         Cloudflare Pages
         ↓
v20260330                Cloudflare Pages (n-site-prototype.pages.dev)
```

---

*本文档随每次新基线创建时更新。*
*最后更新: 2026-03-30*
