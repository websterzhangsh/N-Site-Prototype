# Nestopia B2B Platform - Product Demo
## 平台功能演示脚本

**演示日期**: 2026-03-29  
**版本**: v3.2.0  
**演示时长**: 约 18-22 分钟  
**Live URL**: https://n-site-prototype.pages.dev

---

## 🎯 演示目标

向利益相关者展示 Nestopia B2B 合作伙伴平台的核心功能，包括：
1. 公共网站产品展示（Product Matrix with Before/After + 3D Video）
2. 多租户架构下的完整数据隔离
3. **5 个 AI Agent + Chatbot 统一入口** 的业务流程集成（含 Knowledge Base Builder）
4. Projects 项目管理（Issues Tracker + Risk Heat Map）
5. Team Management 团队管理
6. Settings 系统设置
7. Products / Orders / Customers / Pricing 完整管理功能

---

## 📋 演示大纲

### 第一部分：公共网站 (3 分钟)
- Homepage 产品展示
- Product Matrix — Pergola（Residential / Commercial）
- Before/After 设计对比 + 3D 动画视频
- Gallery 弹窗（Learn More）

### 第二部分：平台登录与概览 (2 分钟)
- 多租户登录
- Company Operations 概览页
- 统计卡片与 Activity Feed

### 第三部分：项目管理 (3 分钟)
- Projects 项目列表与筛选
- Risk Heat Map（高/中/低/正常）
- Issues Tracker（优先级、状态、负责人）

### 第四部分：团队管理与设置 (2 分钟)
- Team Management 团队成员、角色、绩效
- Settings 公司信息、集成、通知、计费

### 第五部分：5 个 AI Agent + Chatbot (6 分钟)
- AI Designer Agent
- Pricing & Cost Controller Agent
- Compliance Manager Agent
- Customer Service Executive Agent
- **Knowledge Base Builder Agent**
- **B2B Chatbot 统一对话入口（新增 2026-03-24）**

### 第六部分：技术架构 (3 分钟)
- 数据库 Schema 设计
- 多租户隔离机制
- Cloudflare Pages 部署

---

## 🎬 详细演示脚本

### 【开场 - 30秒】

**画面**: 浏览器打开 https://n-site-prototype.pages.dev

**旁白**:
> "大家好，今天我将演示 Nestopia B2B 合作伙伴平台的最新版本。这是一个面向户外生活定制行业（阳光房、ADU、Pergola、Zip Blinds）的小型企业主和合作伙伴的 SaaS 平台，由 5 个 AI Agent 驱动。"

---

### 【第一部分：公共网站产品展示 - 3分钟】

**画面**: Homepage hero carousel

**操作**:
1. 展示 3-slide hero carousel（自动轮播）
2. 滚动到 "Explore Our Product Range" 区域
3. 点击 "Pergola" 标签
4. 展示 Residential 标签内容：
   - Before Design / After Design 图片对比
   - 3D 动画视频
   - Icon 行：Aluminum Alloy, Smart Shade, Quick Install, 10-Year Warranty
5. 点击 "Learn More" 按钮
6. 展示 Gallery 弹窗（4 张 Residential Pergola 样图）
7. 关闭 Gallery，切换到 Commercial 标签
8. 展示 Commercial Before/After + Video
9. 点击 Commercial "Learn More"，展示 Commercial Gallery

**旁白**:
> "公共网站的产品展示采用 Before/After 对比设计，配合 3D 渲染动画视频，让终端消费者直观感受产品效果。每个产品类别（Residential / Commercial）都有独立的图片库，用户可以点击 'Learn More' 查看更多案例。"

---

### 【第二部分：多租户登录与 Company Operations - 2分钟】

**画面**: 打开 https://n-site-prototype.pages.dev/login.html

**操作**:
1. 展示租户定制化登录页面（Greenscape Builders 品牌）
2. 输入演示账号登录
3. 进入 Company Operations 页面（原 Dashboard，已更名）
4. 展示 Overview 页面：
   - 统计卡片：Total Revenue, Active Projects, Pending Orders, Customer Satisfaction
   - Recent Activity 时间线
   - Quick Actions 快捷操作

**旁白**:
> "登录后进入 Company Operations 页面。Overview 提供业务全景概览，关键指标一目了然。"

---

### 【第三部分：Projects 项目管理 - 3分钟】

**画面**: 点击左侧菜单 "Projects"

**操作**:
1. 展示统计卡片：
   - Active Projects: 3
   - Open Issues: 1
   - High Risks: 0
   - On-Time Rate: 98%
   - Total Value: $62.5K
2. 展示 **Risk Heat Map**：
   - 🟡 Medium Risk (2 Projects): Smith Sunroom - Material Delay, Chen Pergola - Weather
   - 🟢 Low Risk (1 Project): Davis Zip Blinds
3. 展示 **Issues Tracker** 表格：
   - Glass panel backorder 2 weeks (Medium, In Progress, Mike Johnson)
   - 展示 Priority 徽章、Status 标签、Assigned To、Due Date
4. 展示项目列表（3 个核心项目，支持搜索和阶段筛选）

**旁白**:
> "Projects 模块重点突出 Issues Tracker 和 Risk Management。Risk Heat Map 以四色分级直观展示所有项目风险。Issues Tracker 追踪阻碍因素、延误和解决状态。"

---

### 【第四部分：Team Management & Settings - 2分钟】

**画面**: 点击左侧菜单 "Team Management"

**操作**:
1. 展示团队统计：8 Members, 24 Active Projects, 4.8 Avg Rating, 96% On-Time
2. 展示成员表格：角色、邮箱、电话、项目数、绩效星级、在线状态
3. 切换到 "System Settings"
4. 展示 Settings Tabs：
   - Company：公司信息、Logo、地址
   - Integrations：CRM、支付、邮件服务连接
   - Notifications：告警规则和模板
   - Billing：订阅计划、发票历史

**旁白**:
> "Team Management 支持成员角色分配和绩效追踪。Settings 页面提供公司配置、第三方集成、通知规则和计费管理。"

---

### 【第五部分：5 个 AI Agent - 5分钟】

#### Agent 1: AI Designer — "签单武器"

**画面**: 点击左侧菜单 "AI Designer"

**操作**:
1. 展示上传场地照片区域
2. 展示产品类型选择：Sunroom / Pergola / ADU / Zip Blinds
3. 展示风格偏好、颜色方案
4. 展示 AI 渲染结果（场景融合效果）

**旁白**:
> "AI Designer 是'签单武器'——上传客户院子照片，30 秒内 AI 将产品植入真实场景，自然光照、阴影、比例完美还原。"

#### Agent 2: Pricing & Cost Controller — "利润保镖"

**画面**: 点击 "Pricing and Cost Controller"

**操作**:
1. 展示项目选择和产品配置
2. 展示成本分解表格
3. 展示利润分析和风险告警

**旁白**:
> "Pricing Agent 自动计算成本，提供三档报价，利润率低于阈值时自动警告。"

#### Agent 3: Compliance Manager — "风险雷达"

**画面**: 点击 "Compliance Manager"

**操作**:
1. 展示地址输入和合规检查
2. 展示合规检查清单（Setback、Height、Fire Safety、Permit）
3. 展示所需文件列表

**旁白**:
> "Compliance Manager 自动扫描项目地址的建筑法规和 HOA 要求，生成合规清单和许可申请路线图。"

#### Agent 4: Customer Service Executive — "增长引擎"

**画面**: 点击 "Customer Service Executive"

**操作**:
1. 展示对话列表（5 个客户对话）
2. 点击客户对话，展示完整聊天历史
3. 展示 AI 自动回复建议
4. 展示情绪分析标签

**旁白**:
> "Customer Service Agent 提供 7×24 智能客服，自动识别客户情绪，主动跟进，推动复购。"

#### Agent 5: Knowledge Base Builder — "智识引擎" (NEW)

**画面**: 点击 "Knowledge Base Builder"

**操作**:
1. 展示 Knowledge Base 统计：47 Documents, 6 Categories
2. 展示分类筛选：Installation / Compliance / Sales / Design / Training / After-Sales
3. 展示文档列表：
   - 文件名、分类、大小、状态（Indexed / Processing）
   - Agent 标签（Designer / Pricing / Compliance / Service）
   - Tags 标签
4. 展示搜索功能
5. 展示上传功能（支持 PDF, DOCX, XLSX, PPTX, 图片, 视频）
6. 展示 Agent 路由配置（选择哪些 Agent 可以访问此文档）

**旁白**:
> "Knowledge Base Builder 是第五个 Agent，也是其他四个 Agent 的'智识引擎'。上传公司私有领域数据——产品手册、合规法规、定价分析、设计指南——AI 自动分类、切片、向量化、索引，构建 RAG 知识库。每份文档可以路由到特定 Agent，让 AI Designer 了解产品规格，让 Compliance Manager 掌握最新法规。目前已索引 47 份文档，覆盖 6 大分类。"

#### B2B Chatbot — "统一对话入口" (NEW — 2026-03-24)

**画面**: 在 Company Operations 任意页面，展示右下角浮动气泡

**操作**:
1. 展示右下角 🤖 浮动 FAB 按钮
2. 点击打开浮动对话面板
3. 展示面板头部：Nestopia Assistant · Online · Routes to 5 Agents
4. 在浮动面板中输入 "How much for a 400 sqft sunroom?"
5. 展示 AI 回复 + **Via Pricing Agent** 彩色 Badge
6. 点击 Quick Action 芯片 "Compliance"
7. 点击面板中的 ↗ 展开按钮 → 自动跳转到全页面模式
8. 展示全页面布局：左侧会话列表 + 右侧聊天区域
9. 切换左侧 3 个 Demo 会话：
   - "Sunshine Villa — Design & Quote" (Via Pricing Agent)
   - "CA Sunroom Compliance Check" (Via Compliance Mgr)
   - "Pergola Product Specs" (Via Knowledge Base)
10. 点击 "+ New Chat" 创建新对话
11. 展示图片上传功能（📷 按钮）→ 触发 AI Designer 流程

**旁白**:
> "B2B Chatbot 是统一对话入口，嵌入在 Company Operations 中。经销商不需要学习 5 个 Agent 界面——在一个对话框里用自然语言提问，Chatbot 自动识别意图并路由到对应 Agent。每条回复标注来源 Agent（紫色=设计、绿色=报价、蓝色=合规、黄色=客服、灰色=知识库）。浮动气泡在任何页面可快速对话，全页面模式提供会话管理和深度交互。"

---

### 【第六部分：技术架构 - 2分钟】

**画面**: 展示架构图或 VS Code

**操作**:
1. 展示多租户数据库架构（RLS 行级安全）
2. 展示 Supabase Edge Functions
3. 展示 Cloudflare Pages 部署管线
4. 展示文档体系：
   - `docs/REQUIREMENTS.md` (v6.0.0)
   - `docs/DATA_AI_STRATEGY.md` (v3.0)
   - `docs/AI_Agents_Strategy_Whitepaper.docx`
   - 5 个 Agent Spec 文档

**旁白**:
> "平台采用多租户架构，Supabase PostgreSQL + RLS 实现数据隔离。5 个 AI Agent 规格文档详细定义了每个 Agent 的能力、使用场景和训练策略。Knowledge Base 采用 Lakehouse 架构（对象存储 + 向量数据库 + 关系型数据库）。"

---

### 【结尾 - 30秒】

**画面**: 回到 Company Operations 主页

**旁白**:
> "以上是 Nestopia B2B 平台的最新版本演示。平台已完成公共网站产品展示、5 个 AI Agent 集成、项目管理（Issues + Risk Management）、团队管理、系统设置等核心模块。下一步将进行后端集成和 AI Agent 功能实现。感谢观看。"

---

## 📊 演示数据说明

### 租户数据
- **Demo Tenant**: Greenscape Builders (Enterprise Plan)

### 演示账号
- **Admin**: demo@nestopia.com / Demo123!

### 示例项目（3 个核心产品线）

> 当前阶段展示 3 个代表性项目，各覆盖一条核心产品线。其余 5 个项目数据已隐藏（`hidden: true`），代码保留可随时恢复。

---

#### 项目 1：Smith Premium Sunroom — 阳光房（Step 2 / Design）

| 字段 | 值 |
|------|-----|
| **项目编号** | PRJ-003 |
| **项目名称** | Smith Premium Sunroom |
| **客户** | Mr. Smith |
| **邮箱 / 电话** | smith@email.com · (512) 555-0303 |
| **地址** | 321 Elm St, Austin, TX |
| **产品类型** | Sunroom |
| **工作流步骤** | Step 2 — Design（AI Designer 设计中） |
| **风险等级** | Low 🟢 |
| **预算 / 已付** | $42,000 / $4,200 (10%) |
| **工期** | 8 weeks（2026-02-15 开始） |
| **风险项** | 无 |
| **Issues** | 无 |
| **订单** | ORD-2024-0153 · Premium Sunroom · $32,000 · Pending · Mar 15, 2026 |

**演示要点**: 展示 **Step 2 AI Designer** 核心能力 — 上传客户院子照片，AI 将阳光房产品植入真实场景，30 秒生成设计渲染图。重点展示设计风格选择、产品类型配置、AI 渲染效果。

---

#### 项目 2：Chen Pergola Space — 廊架（Step 3 / Measurement）

| 字段 | 值 |
|------|-----|
| **项目编号** | PRJ-004 |
| **项目名称** | Chen Pergola Space |
| **客户** | Ms. Chen |
| **邮箱 / 电话** | chen@email.com · (301) 555-0404 |
| **地址** | 456 Oak Dr, Frederick, MD |
| **产品类型** | Pergola |
| **工作流步骤** | Step 3 — Measurement & Design（量房设计中） |
| **风险等级** | Low 🟢 |
| **预算 / 已付** | $12,000 / $3,600 (30%) |
| **工期** | 4 weeks（2026-02-01 开始） |
| **风险项** | Weather delay possible (low, monitoring) |
| **Issues** | 无 |
| **订单** | ORD-2024-0155 · Studio Pergola · $6,900 · Pending · Mar 20, 2026 |

**演示要点**: 展示 **Step 3 Measurement & Design** 核心能力 — 量房数据录入（尺寸、地基、排水、障碍物）、测量方法选择（Manual / Laser / Hybrid）、设计包生成。

---

#### 项目 3：Davis Pool Zip Blinds — 防风卷帘（Step 4 / Quotation）

| 字段 | 值 |
|------|-----|
| **项目编号** | PRJ-005 |
| **项目名称** | Davis Pool Zip Blinds |
| **客户** | Mrs. Davis |
| **邮箱 / 电话** | davis@email.com · (480) 555-0505 |
| **地址** | 789 Pool Ln, Scottsdale, AZ |
| **产品类型** | Zip Blinds |
| **工作流步骤** | Step 4 — Quotation（报价中） |
| **风险等级** | Low 🟢 |
| **预算 / 已付** | $8,500 / $2,550 (30%) |
| **工期** | 3 weeks（2026-02-10 开始） |
| **风险项** | 无 |
| **Issues** | 无 |
| **订单** | ORD-2024-0154 · Zip Blinds Set · $4,200 · Pending · Mar 25, 2026 |

**演示要点**: 展示 **Step 4 Quotation** 核心能力 — Pricing & Cost Controller Agent 的定价引擎演示（6 大策略：模块化定价、面积阶梯、最低收费、高度附加费、产品分级、双重价格表）。点击 Open Quotation 进入完整的 Zip Blinds 定价计算器，展示三档报价（Conservative / Recommended / Premium）。

---

#### 项目数据字段说明

```
{
  id:             String    // 项目编号 (PRJ-XXX)
  name:           String    // 项目名称
  customer:       String    // 客户称呼
  customerEmail:  String    // 客户邮箱
  customerPhone:  String    // 客户电话
  customerAddress:String    // 项目地址
  type:           String    // 产品类型 (Sunroom | Pergola | Zip Blinds | ADU)
  workflowStep:   Number    // 工作流步骤 (1-6)
  stage:          String    // 阶段标识 (intent | design | measurement | quotation | production | installation)
  riskLevel:      String    // 风险等级 (high | medium | low)
  budget:         Number    // 项目预算 ($)
  paid:           Number    // 已付金额 ($)
  timeline:       String    // 预计工期
  startDate:      String    // 开始日期 (YYYY-MM-DD)
  risks:          Array     // 风险项列表 [{title, severity, status}]
  issues:         Array     // Issue 列表 [{id, title, priority, status, assignedTo, dueDate}]
  order:          Object    // 关联订单 {id, product, total, status, date}
  hidden:         Boolean   // (可选) true = 从 UI 隐藏但保留数据
}
```

### 关键业务数据
- **Projects**: 3 个活跃项目（Sunroom × 1, Pergola × 1, Zip Blinds × 1），另有 5 个隐藏项目
- **Issues**: 1 个跟踪项（Glass panel backorder — Medium）
- **Team Members**: 8 人（Admin, Sales, Installer, Designer 等角色）
- **Knowledge Base**: 47 份文档，6 个分类
- **Products**: 18 个产品，含 SKU、JSONB 规格、分层定价

---

## 🛠️ 技术亮点

### 1. 公共网站
- Hero carousel 自动轮播
- Product Matrix: Before/After 对比 + 3D 视频
- Gallery 弹窗（Learn More）
- 双语支持（中/英）
- 响应式设计（移动端适配）

### 2. 多租户隔离
- RLS 行级安全策略
- tenant_id 外键约束
- 复合唯一约束
- 租户上下文注入

### 3. 5 个 AI Agent + Chatbot 统一入口
- AI Designer — 场景融合渲染
- Pricing & Cost Controller — 动态报价与利润保护
- Compliance Manager — 合规扫描与许可导航
- Customer Service Executive — 全生命周期客户管理
- **Knowledge Base Builder — RAG 知识库构建与管理**
- **B2B Chatbot — 统一对话入口（浮动气泡 + 全页面双模式，意图识别 + Agent 路由 Badge）**

### 4. 项目管理
- Risk Heat Map（四级风险可视化）
- Issues Tracker（优先级、状态、负责人）
- 项目列表搜索与筛选

### 5. 前端架构
- 多页面静态站点（非 SPA）
- Tailwind CSS 响应式设计
- Cloudflare Pages 自动部署
- Cache-busting 策略（?v=20260312）

---

## 📝 演示注意事项

### 准备工作
1. 确认 https://n-site-prototype.pages.dev 可访问
2. 准备演示浏览器（Chrome 推荐）
3. 清除浏览器缓存（或使用无痕模式）
4. 准备备用截图（以防网络问题）

### 演示技巧
1. 放慢操作速度，让观众看清每个步骤
2. 重点停留在 Risk Heat Map 和 Knowledge Base Builder
3. Gallery 弹窗动画效果要展示完整
4. Before/After 对比停留 5 秒
5. 准备应对 Agent 功能深度提问

### 常见问题预案
- **Q: 5 个 Agent 之间如何协作？**
  A: Knowledge Base Builder 是基础层，为其他 4 个 Agent 提供领域知识。Agent 间通过标准化数据接口交换信息，例如 Designer 生成渲染后自动触发 Pricing 报价和 Compliance 检查。

- **Q: Knowledge Base 支持哪些文件格式？**
  A: PDF, DOCX, XLSX, PPTX, 图片（OCR）, 视频（转录）。上传后自动分类、切片、向量化、索引。

- **Q: Risk Heat Map 数据是实时的吗？**
  A: 目前使用 dummy data 演示 UI。后端集成后将实时从项目数据计算风险等级。

---

## 📄 附录：文件清单

### 核心页面
- `index.html` — 公共首页（产品展示、Hero Carousel、Product Matrix）
- `company-operations.html` — Company Operations（Overview, Projects, Team, Settings, 5 Agents, **B2B Chatbot**）
- `login.html` — 多租户登录
- `partners.html` — 合作伙伴注册
- `team-management.html` — 团队管理

### 文档体系
- `docs/REQUIREMENTS.md` (v6.1.0) — 需求规格说明书
- `docs/DATA_AI_STRATEGY.md` (v3.0) — Data + AI 战略
- `docs/AI_Agents_Strategy_Whitepaper.docx` — Agent 战略白皮书
- `docs/AI_Designer_Agent_Spec.md` — AI Designer 规格
- `docs/Pricing_Cost_Controller_Agent_Spec.md` — Pricing Agent 规格
- `docs/Compliance_Manager_Agent_Spec.md` — Compliance Agent 规格
- `docs/Customer_Service_Executive_Agent_Spec.md` — CS Agent 规格
- `docs/Chatbot_Agent_Spec_CN.md` (v1.1.0) — **Chatbot 对话助手规格**
- `docs/multi-tenant-architecture.md` — 多租户架构
- `docs/business-workflow.md` — 业务流程

### 配置文件
- `package.json` — 构建配置
- `_routes.json` — Cloudflare 路由
- `_redirects` — URL 重定向
- `_headers` — Cache 控制

---

**文档版本**: 3.2.0  
**最后更新**: 2026-03-29  
**维护者**: Qoder AI Assistant
