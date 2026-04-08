# Zip Blinds Knowledge Base & Knowledge Agent Design

> **Version:** 1.0 | **Date:** 2026-04-08 | **Status:** Draft  
> **Depends on:** [KB_STORAGE_DESIGN.md](KB_STORAGE_DESIGN.md) (v1.0), [DATA_AI_STRATEGY.md](DATA_AI_STRATEGY.md) (v3.1)  
> **Related Commit:** `f492769` — Zip Blinds 工作流重构（Measure & Quote 合并步骤）

---

## 1. 设计背景

### 1.1 业务场景

Zip Blinds 作为 Nestopia 的轻量级产品线（相对于 Sunroom/Pergola），其工作流已简化为 **Measure & Quote** 单一步骤。知识库需要为该简化工作流提供：

| 层级 | 原始材料 | 用途 |
|------|---------|------|
| **租户级 (Company)** | 产品规格书、安装培训视频、OMEYA SOP | 标准化团队知识，训练 AI Agent |
| **项目级 (Project)** | 客户现场拍摄的照片和视频 | 量尺参考、报价依据、AI 设计输入 |

### 1.2 设计原则

1. **Workflow-first**：KB 不是独立功能，而是嵌入 Measure & Quote 工作流的上下文辅助工具
2. **Two-tier, One-view**：租户级和项目级知识在同一界面中呈现，按上下文智能切换
3. **Agent-ready**：所有材料自动路由到对应 AI Agent，支持未来 RAG 检索
4. **Progressive**：Phase 1 用 localStorage + 外链，Phase 2 接 Supabase Storage

---

## 2. Zip Blinds KB 内容结构

### 2.1 租户级：产品知识库 (Product Knowledge)

针对 Zip Blinds 产品线的标准化知识资产：

```
Company KB (Tenant-Level)
├── Product Specifications
│   ├── ZB-100 Standard Series Spec Sheet.pdf
│   ├── ZB-200 Professional Series Spec Sheet.pdf
│   ├── ZB-300 Elite Series Spec Sheet.pdf
│   ├── Fabric Options Catalog (NP-4000/6000/8000).pdf
│   └── Drive System Comparison Chart.pdf
│
├── Installation & Training
│   ├── OMEYA Blind Installation SOP (complete).pdf    ← OMEYA SOP
│   ├── 📹 Face Mount Installation Tutorial.mp4         ← 培训视频
│   ├── 📹 Ceiling Mount Installation Tutorial.mp4
│   ├── 📹 Motor Wiring & Commissioning.mp4
│   ├── 📹 Zip Track Tensioning Guide.mp4
│   └── Troubleshooting & Recalibration Guide.pdf
│
├── Measurement Guides
│   ├── OMEYA SOP §1B: Site Measurement Method.pdf
│   ├── Inside Mount vs Face Mount Decision Guide.pdf
│   ├── 3-Point Measurement Reference Card.pdf
│   └── 📹 How to Measure for Zip Blinds (Field Video).mp4
│
├── Pricing & Sales
│   ├── Zip Blinds 6-Strategy Pricing Model.pdf
│   ├── Dealer Price List (Confidential).xlsx
│   ├── Sales Pitch Deck — Residential.pptx
│   └── Competitive Comparison Matrix.pdf
│
└── Compliance
    ├── Singapore SS 692:2020 Blinds Safety.pdf
    ├── US Wind Load Requirements by Zone.pdf
    └── Child Safety Cord/Chain Standards.pdf
```

### 2.2 项目级：客户现场知识 (Project Knowledge)

每个 Zip Blinds 项目在 Measure & Quote 过程中产生的知识资产：

```
Project KB (Project-Level)  e.g. PRJ-005 Davis Pool Zip Blinds
├── Site Photos                          ← 现场勘测阶段
│   ├── photo_overview_pool-area.jpg
│   ├── photo_opening-1_north-wall.jpg
│   ├── photo_opening-2_east-wall.jpg
│   ├── photo_opening-3_west-wall.jpg
│   ├── photo_obstacle_electrical-outlet.jpg
│   └── photo_mounting_lintel-detail.jpg
│
├── Site Videos                          ← 现场视频记录
│   ├── 📹 video_walkthrough_full-site.mp4
│   ├── 📹 video_measure_opening-1.mp4
│   └── 📹 video_obstacle_electrical.mp4
│
├── Measurement Data                     ← 量尺数据
│   ├── measurement_report.json          (auto-generated from Step 3 form)
│   └── measurement_annotated_photo.jpg  (标注尺寸的照片)
│
├── Quotation                            ← 报价阶段
│   ├── quotation_v1_20260325.pdf
│   ├── quotation_v2_final_20260328.pdf
│   └── pricing_breakdown.json           (auto-generated from Step 4)
│
└── Client Communications                ← 客户沟通记录
    ├── email_initial-inquiry_20260210.pdf
    └── notes_site-visit_20260218.txt
```

---

## 3. UX 交互设计

### 3.1 三入口架构

KB 不是一个孤立页面，而是通过三个入口融入工作流：

```
┌──────────────────────────────────────────────────────────────┐
│                    KB 三入口架构                               │
│                                                              │
│  ① 独立 KB 页面（全量管理）                                    │
│     Knowledge Base Builder                                   │
│     └── 租户管理员上传/管理所有文档                              │
│                                                              │
│  ② Measure & Quote 工作流内嵌（上下文感知）                      │
│     └── 量尺时自动推送相关 specs + measurement guide             │
│     └── 报价时推送 pricing model + competitive matrix           │
│     └── 项目文件上传区（照片/视频）                              │
│                                                              │
│  ③ 项目详情 Knowledge Agent 面板（项目维度）                     │
│     └── 自动聚合：相关租户文档 + 项目专属文件                     │
│     └── AI Agent 可检索的知识范围                                │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 入口 ①：Knowledge Base 独立页面改造

改造现有 `page-knowledge-base` 页面，增加 **双 Tab + Zip Blinds 产品筛选**：

```
┌────────────────────────────────────────────────────────────────┐
│  Knowledge Base Builder                          [+ Upload]    │
│                                                                │
│  📊 Stats: 62 docs │ 48 Indexed │ 8 Processing │ 6 Videos     │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ 📦 Product KB    │  │ 📁 Project Files │    ← 双 Tab       │
│  │    (Company)     │  │    (Per-Project)  │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                │
│  ═══════════════════════════════════════════════════════       │
│  Product Library Tab:                                          │
│  ═══════════════════════════════════════════════════════       │
│                                                                │
│  Product: [Zip Blinds ▼]  Category: [All ▼]                   │
│  Search: _______________  Sort: [Newest ▼]                     │
│                                                                │
│  ┌────────────────────────────────────────────────────┐       │
│  │ 🏷 Product Specifications                          │       │
│  │ ┌────────┬────────┬────────┐                       │       │
│  │ │📄 ZB-100│📄 ZB-200│📄 ZB-300│  Spec cards         │       │
│  │ │Standard │Profess.│ Elite  │  (visual grid)        │       │
│  │ │ 2.1MB  │ 2.4MB  │ 2.8MB  │                       │       │
│  │ └────────┴────────┴────────┘                       │       │
│  ├────────────────────────────────────────────────────┤       │
│  │ 🎬 Installation & Training Videos                  │       │
│  │ ┌──────────────────┬──────────────────┐            │       │
│  │ │ ▶ Face Mount     │ ▶ Ceiling Mount  │            │       │
│  │ │   Tutorial       │   Tutorial       │            │       │
│  │ │   12:30 · 45MB   │   8:45 · 32MB    │            │       │
│  │ ├──────────────────┼──────────────────┤            │       │
│  │ │ ▶ Motor Wiring   │ ▶ Measurement    │            │       │
│  │ │   & Commission   │   Field Guide    │            │       │
│  │ │   15:00 · 68MB   │   6:20 · 28MB    │            │       │
│  │ └──────────────────┴──────────────────┘            │       │
│  ├────────────────────────────────────────────────────┤       │
│  │ 📐 Measurement Guides                 3 docs      │       │
│  │ 💰 Pricing & Sales                    4 docs      │       │
│  │ 📋 Compliance                         3 docs      │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                │
│  ═══════════════════════════════════════════════════════       │
│  Project Files Tab:                                            │
│  ═══════════════════════════════════════════════════════       │
│                                                                │
│  Project: [PRJ-005 Davis Pool Zip Blinds ▼]                   │
│  Type: [All ▼]  [📷 Photos: 6] [📹 Videos: 3] [📄 Docs: 4]   │
│                                                                │
│  ┌────────────────────────────────────────────────────┐       │
│  │ 📷 Site Photos (6)           Taken: 2026-01-18     │       │
│  │ ┌──────┬──────┬──────┬──────┬──────┬──────┐       │       │
│  │ │ img  │ img  │ img  │ img  │ img  │ img  │       │       │
│  │ │ Pool │ N-   │ E-   │ W-   │ Elec │ Lin- │       │       │
│  │ │ Area │ Wall │ Wall │ Wall │ tric │ tel  │       │       │
│  │ └──────┴──────┴──────┴──────┴──────┴──────┘       │       │
│  ├────────────────────────────────────────────────────┤       │
│  │ 📹 Site Videos (3)                                 │       │
│  │ ▶ Full Site Walkthrough · 2:30 · 85MB              │       │
│  │ ▶ Measuring Opening 1 · 1:15 · 42MB                │       │
│  │ ▶ Electrical Obstacle · 0:45 · 28MB                 │       │
│  ├────────────────────────────────────────────────────┤       │
│  │ 📄 Documents (4)                                   │       │
│  │ · Measurement Report (auto) · Quotation v2 (final) │       │
│  │ · Pricing Breakdown (auto) · Client Email           │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                │
│  [+ Upload Photos/Videos]  [+ Upload Document]                 │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 入口 ②：Measure & Quote 工作流内嵌 KB

**核心理念**：在 Measure & Quote 合并步骤中，KB 内容根据用户当前操作自动推送相关知识。

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Measure & Quote                                   [×]  │
│  Client consultation, site measurement & quotation              │
│                                                                 │
│  ┌─ Core Actions ──────────┐  ┌─ Key Deliverables ──────────┐  │
│  │ ✅ Client Consultation  │  │ ○ Measurement Report         │  │
│  │ ✅ Product Recommend.   │  │ ○ Product Configuration      │  │
│  │ ○  Site Measurement     │  │ ○ Formal Quotation           │  │
│  │ ○  Product Config       │  │ ○ Client Approval            │  │
│  │ ○  Quotation Gen        │  └──────────────────────────────┘  │
│  │ ○  Client Sign-off      │                                    │
│  └──────────────────────────┘                                    │
│                                                                 │
│  ┌── 📐 Site Measurement & Blind Sizing ──────────────────────┐ │
│  │                                                             │ │
│  │  [Open Measurement]                                         │ │
│  │                                                             │ │
│  │  ┌─ 📚 KB Quick Reference ──────────────────────────────┐  │ │
│  │  │                                                       │  │ │
│  │  │  📐 Measurement Guides          ← 上下文感知推送     │  │ │
│  │  │  ┌─────────────────────────────────────────────┐     │  │ │
│  │  │  │ 📄 OMEYA SOP §1B: Measurement Method       │     │  │ │
│  │  │  │ 📄 Inside vs Face Mount Decision Guide      │     │  │ │
│  │  │  │ 📄 3-Point Measurement Card                 │     │  │ │
│  │  │  │ ▶  How to Measure (Video, 6:20)             │     │  │ │
│  │  │  └─────────────────────────────────────────────┘     │  │ │
│  │  │                                                       │  │ │
│  │  │  📷 Project Site Files  [+ Upload]   ← 项目文件上传  │  │ │
│  │  │  ┌──────┬──────┬──────┬─────────┐                    │  │ │
│  │  │  │ img  │ img  │ img  │ + Add   │   ← 照片网格      │  │ │
│  │  │  │ N-   │ E-   │ W-   │ Photo   │                    │  │ │
│  │  │  │ Wall │ Wall │ Wall │ /Video  │                    │  │ │
│  │  │  └──────┴──────┴──────┴─────────┘                    │  │ │
│  │  │  ▶ Site Walkthrough Video · 2:30                      │  │ │
│  │  │                                                       │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌── 🧮 Pricing & Quotation Engine ──────────────────────────┐  │
│  │                                                             │ │
│  │  [Open Quotation]                                           │ │
│  │                                                             │ │
│  │  ┌─ 📚 KB Quick Reference ──────────────────────────────┐  │ │
│  │  │  💰 Pricing & Sales Docs        ← 报价时自动切换     │  │ │
│  │  │  ┌─────────────────────────────────────────────┐     │  │ │
│  │  │  │ 📄 6-Strategy Pricing Model                 │     │  │ │
│  │  │  │ 📄 Competitive Comparison Matrix            │     │  │ │
│  │  │  │ 📄 Dealer Price List (if wholesale mode)    │     │  │ │
│  │  │  └─────────────────────────────────────────────┘     │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌── 🤖 AI Agent Collaboration ───────────────────────────────┐ │
│  │  🤖 Pricing Agent — 6-strategy quotation engine             │ │
│  │  🤖 Knowledge Base — OMEYA SOP, product specs, references   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**上下文智能推送逻辑**：

| 用户当前操作 | 自动推送的 KB 内容 | 来源层级 |
|-------------|------------------|---------|
| 展开 Measurement 面板 | 量尺指南 + OMEYA SOP + 量尺视频 | 租户级 |
| 上传现场照片 | 照片命名建议 + 拍照角度指南 | 租户级 |
| 选择 Mounting Type | Inside/Face Mount 决策指南 | 租户级 |
| 展开 Quotation 面板 | 定价模型 + 竞品对比 + 价目表 | 租户级 |
| 选择 Wholesale 模式 | 经销商价目表 | 租户级 |
| 生成报价单 | 该项目的照片/视频/量尺数据 | 项目级 |

### 3.4 入口 ③：项目详情 Knowledge Agent 面板

改造现有 `knowledge-base` Agent 面板，增加双层视图：

```
┌────────────────────────────────────────────────────────┐
│  🧠 Knowledge Base                           PRJ-005   │
│  ─────────────────────────────────────────────────      │
│  Context-aware knowledge for Davis Pool Zip Blinds     │
│                                                        │
│  ┌── 📁 Project Files (This Project) ──────────────┐  │
│  │                                                  │  │
│  │  📷 Site Photos (6)                              │  │
│  │  ┌──────┬──────┬──────┬──────┐                  │  │
│  │  │ img  │ img  │ img  │ +3   │  ← 缩略图网格    │  │
│  │  └──────┴──────┴──────┴──────┘                  │  │
│  │                                                  │  │
│  │  📹 Site Videos (3)                              │  │
│  │  · ▶ Full Site Walkthrough · 2:30                │  │
│  │  · ▶ Measuring Opening 1 · 1:15                  │  │
│  │                                                  │  │
│  │  📄 Documents (4)                                │  │
│  │  · Measurement Report · Quotation v2             │  │
│  │  · Pricing Breakdown · Client Email              │  │
│  │                                                  │  │
│  │  [+ Upload]  [View All in KB →]                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── 📦 Related Product Docs (Zip Blinds) ─────────┐  │
│  │                                                  │  │
│  │  📄 ZB Installation & Commissioning Guide  28pp  │  │
│  │  📄 Solar Motor Programming Manual         16pp  │  │
│  │  📄 Zip Track Fabric Care & Maintenance     6pp  │  │
│  │  📄 Arizona Electrical Code (Low Voltage)  44pp  │  │
│  │  📄 Zip Blinds Warranty Terms               8pp  │  │
│  │  📄 HOA Color Palette — Desert Ridge        2pp  │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── 🎓 Suggested Training ────────────────────────┐  │
│  │  ▶ Zip Blinds Troubleshooting          10 min   │  │
│  │  📖 Solar Motor Seasonal Maintenance    4 min    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── 🤖 Ask Knowledge Agent ───────────────────────┐  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │ Ask about this project or product...     │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │  Suggestions:                                    │  │
│  │  · "What mounting type for pool area?"           │  │
│  │  · "Max wind speed for ZB-200?"                  │  │
│  │  · "Show measurement photos for this project"    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 4. 与 Measure & Quote 工作流的绑定设计

### 4.1 工作流阶段 × KB 内容映射

刚完成的 Zip Blinds 工作流重构（`ZB_COMBINED_CONFIG`）定义了 6 个核心动作。每个动作与 KB 的绑定关系：

```
ZB_COMBINED_CONFIG.coreActions:
┌─────────────────────────────────┬──────────────────────────────────┐
│ Core Action                     │ KB Binding                       │
├─────────────────────────────────┼──────────────────────────────────┤
│ a1. Client Consultation         │ 📦 Product specs (ZB-100/200/300)│
│     (OMEYA SOP §1A)            │ 📦 Sales pitch deck              │
│                                 │ 📦 Fabric options catalog        │
├─────────────────────────────────┼──────────────────────────────────┤
│ a2. Product Recommendation      │ 📦 Drive system comparison chart │
│                                 │ 📦 Competitive comparison matrix │
├─────────────────────────────────┼──────────────────────────────────┤
│ a3. Site Measurement            │ 📦 OMEYA SOP §1B: Measurement   │
│     (OMEYA SOP §1B)            │ 📦 Mount type decision guide     │
│                                 │ 📦 3-point measurement card      │
│                                 │ 📦 📹 Measurement field video    │
│                                 │ 📁 📷 Upload: site photos        │
│                                 │ 📁 📹 Upload: site videos        │
├─────────────────────────────────┼──────────────────────────────────┤
│ a4. Product Configuration       │ 📦 Pricing model document        │
│                                 │ 📦 Dealer price list             │
├─────────────────────────────────┼──────────────────────────────────┤
│ a5. Quotation Generation        │ 📁 Auto: measurement report      │
│                                 │ 📁 Auto: pricing breakdown       │
│                                 │ 📁 Auto: quotation PDF           │
├─────────────────────────────────┼──────────────────────────────────┤
│ a6. Client Review & Sign-off    │ 📁 Quotation PDF (final)         │
│     (OMEYA SOP §1C)            │ 📦 Warranty terms & conditions   │
│                                 │ 📦 Compliance docs               │
└─────────────────────────────────┴──────────────────────────────────┘

📦 = 租户级（Product KB）  📁 = 项目级（Project Files）
```

### 4.2 自动文件生成（Workflow → KB）

Measure & Quote 工作流在特定节点会自动生成并写入项目级 KB：

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────┐
│ 填写量尺数据     │ ──→  │ measurement_     │ ──→  │ 项目级 KB  │
│ (Step 3 form)    │      │ report.json      │      │ /measurements/│
└─────────────────┘      └──────────────────┘      └────────────┘

┌─────────────────┐      ┌──────────────────┐      ┌────────────┐
│ 计算定价          │ ──→  │ pricing_         │ ──→  │ 项目级 KB  │
│ (Step 4 engine)  │      │ breakdown.json   │      │ /quotation/│
└─────────────────┘      └──────────────────┘      └────────────┘

┌─────────────────┐      ┌──────────────────┐      ┌────────────┐
│ 生成报价单        │ ──→  │ quotation_v{N}_  │ ──→  │ 项目级 KB  │
│ (PDF export)     │      │ {date}.pdf       │      │ /quotation/│
└─────────────────┘      └──────────────────┘      └────────────┘
```

### 4.3 KB → 工作流反馈

项目级 KB 中的文件反过来增强工作流：

| 项目级文件 | 反馈到工作流的方式 |
|-----------|------------------|
| 现场照片 | 量尺面板中显示缩略图，作为测量参考 |
| 现场视频 | Knowledge Agent 可引用进行尺寸核对 |
| 量尺报告 | 自动填充报价引擎的尺寸参数 |
| 历史报价单 | Load Saved 功能可加载历史版本 |

---

## 5. Knowledge Agent 架构设计

### 5.1 Agent 定位

Knowledge Agent 是 Nestopia AI Agent 矩阵中的第五个 Agent（与 AI Designer、Pricing Agent、Compliance Manager、CS Executive 并列），负责：

```
┌─────────────────────────────────────────────────────────┐
│  Knowledge Agent — "The Librarian"                       │
│                                                         │
│  Mission: 管理和检索私域知识，为其他 4 个 Agent 提供         │
│          上下文增强信息（RAG），并直接回答用户的产品/流程问题   │
│                                                         │
│  Capabilities:                                          │
│  ├── 📚 Document Management (上传、分类、索引)              │
│  ├── 🔍 Semantic Search (向量检索 + 关键词)                │
│  ├── 🤖 RAG Provider (为其他 Agent 提供上下文)              │
│  ├── 💬 Q&A (直接回答产品/流程相关问题)                     │
│  └── 📊 Knowledge Analytics (文档使用统计)                  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Agent 协作模型

```
                    ┌─────────────────────┐
                    │   User Question     │
                    │  "What's the max    │
                    │  wind rating for    │
                    │  ZB-200 face mount?"│
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Chatbot Router    │
                    │   (Intent Detection)│
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────────┐
     │ Knowledge  │  │  Pricing   │  │  Compliance    │
     │   Agent    │  │   Agent    │  │    Manager     │
     └─────┬──────┘  └──────┬─────┘  └───────┬────────┘
           │                │                  │
           ▼                ▼                  ▼
     ┌──────────────────────────────────────────────┐
     │           Knowledge Base (RAG)                │
     │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
     │  │ Product  │  │ Project  │  │ Compliance │  │
     │  │  Specs   │  │  Files   │  │   Docs     │  │
     │  └──────────┘  └──────────┘  └────────────┘  │
     └──────────────────────────────────────────────┘
```

**Agent 间知识共享规则**：

| 请求 Agent | 可访问的 KB 范围 |
|-----------|----------------|
| Knowledge Agent（直接查询）| 全部租户级 + 当前项目级 |
| Pricing Agent | 租户级 pricing/* + 当前项目 measurements + quotations |
| AI Designer | 租户级 specs/* + 当前项目 site-photos + measurements |
| Compliance Manager | 租户级 compliance/* + 当前项目 全部 |
| CS Executive | 租户级 全部（只读）+ 当前项目 communications + quotations |

### 5.3 RAG 处理管道（Zip Blinds 专用）

```
文件上传/生成
  │
  ▼
┌──────────────────────────────────────────────────────┐
│  1. Ingest & Classify                                │
│     ├── 检测文件类型 (PDF/IMG/VIDEO/JSON)             │
│     ├── 自动分类 (specs/measurement/site-photo/etc)   │
│     └── 分配 AI Agent 标签                            │
└──────────────────┬───────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  2. Extract & Transform                              │
│     ├── PDF/DOC → 文本提取 (PyMuPDF / Unstructured)   │
│     ├── 图片 → OCR + 场景描述 (GPT-4V / Qwen-VL)     │
│     ├── 视频 → 关键帧提取 + 转录 (Whisper)             │
│     └── JSON → 结构化字段映射                          │
└──────────────────┬───────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  3. Chunk & Embed                                    │
│     ├── 文本分块 (512 tokens, 50 overlap)              │
│     ├── 生成向量嵌入 (text-embedding-3-small)           │
│     └── 存入 pgvector (Supabase)                       │
└──────────────────┬───────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  4. Index & Route                                    │
│     ├── 更新 kb_documents.status = 'indexed'           │
│     ├── 更新 kb_documents.embedding_id                  │
│     └── 通知关联 Agent：新知识可用                        │
└──────────────────────────────────────────────────────┘
```

### 5.4 查询流程

```
用户问："How to measure for inside mount?"
  │
  ▼
┌─ Knowledge Agent ─────────────────────────────────────┐
│                                                       │
│  1. Query Understanding                               │
│     Intent: measurement_guide                         │
│     Product: zip_blinds                               │
│     Scope: tenant (general knowledge)                 │
│                                                       │
│  2. Retrieval (RAG)                                   │
│     ├── Vector search: top-5 chunks from KB           │
│     │   · OMEYA SOP §1B chunk 3 (score: 0.94)       │
│     │   · Mount Decision Guide chunk 1 (score: 0.91) │
│     │   · 3-Point Measurement Card (score: 0.87)     │
│     └── Metadata filter: product_line='zip-blinds'    │
│                                                       │
│  3. Generation (LLM)                                  │
│     Prompt: system_prompt + retrieved_chunks + query   │
│     → "For inside mount (recess mount), follow the    │
│        OMEYA SOP 3-point method:                      │
│        1. Measure width at top, middle, bottom —      │
│           record the SMALLEST value                    │
│        2. Measure height at left, center, right —     │
│           record the SMALLEST value                    │
│        3. Check recess depth ≥ 80mm for track fit..." │
│                                                       │
│  4. Source Attribution                                │
│     Sources: [OMEYA SOP §1B, p.3] [Mount Guide, p.1] │
└───────────────────────────────────────────────────────┘
```

---

## 6. 数据模型扩展

### 6.1 扩展 kb_documents 表

在 [KB_STORAGE_DESIGN.md](KB_STORAGE_DESIGN.md) 的 `kb_documents` 表基础上，为 Zip Blinds 工作流增加字段：

```sql
-- 工作流绑定字段（扩展）
ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS
    workflow_step    VARCHAR(50);
    -- 关联的工作流步骤：'measure', 'quote', 'consultation'
    -- 用于上下文感知推送

ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS
    auto_generated   BOOLEAN DEFAULT FALSE;
    -- 是否由工作流自动生成（measurement report, pricing breakdown, quotation PDF）

ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS
    display_context  TEXT[];
    -- 在哪些 UI 上下文中显示：
    -- 'measurement_panel', 'quotation_panel', 'agent_panel', 'kb_page'
```

### 6.2 项目文件上传记录表（Phase 1 用 localStorage 模拟）

```javascript
// localStorage key: nestopia_project_files_{tenant}_{projectId}
// Structure:
{
    projectId: "PRJ-005",
    tenant: "default",
    files: [
        {
            id: "pf-001",
            name: "photo_overview_pool-area.jpg",
            type: "image/jpeg",
            size: 2345678,
            category: "site-photos",       // site-photos | site-videos | measurements | quotation | communications
            uploadedAt: "2026-01-18T10:30:00Z",
            uploadedBy: "Tom Baker",
            url: "data:image/jpeg;base64,...",  // Phase 1: base64 or external URL
            // url: "https://supabase.../storage/...",  // Phase 2: Supabase URL
            thumbnailUrl: null,             // auto-generated for images
            metadata: {
                width: 4032,
                height: 3024,
                location: "Pool area overview",
                tags: ["pool", "overview", "north-facing"]
            },
            aiStatus: "pending"            // pending | processing | indexed | failed
        }
    ],
    lastUpdated: "2026-01-18T10:30:00Z"
}
```

---

## 7. 实施路线图

### Phase 1a：数据结构 + 工作流内嵌 KB 引用（本周）

| 任务 | 详情 |
|------|------|
| 定义租户级 KB 样本数据 | 在 JS 中定义 `zbProductKB` 数组，包含上述 spec/video/guide 文档元数据 |
| Measure & Quote 内嵌 KB 面板 | 在合并步骤的 measurement panel 和 quotation panel 内各添加 "KB Quick Reference" 折叠区 |
| 上下文感知推送逻辑 | `getKBRecommendations(context)` — 根据当前面板返回相关文档 |
| 项目文件上传区 | 在 measurement panel 内添加照片/视频上传区（localStorage） |

### Phase 1b：Knowledge Agent 面板增强（下周）

| 任务 | 详情 |
|------|------|
| 改造 Knowledge Agent 面板 | 双层视图：项目文件 + 相关产品文档 |
| 照片缩略图网格 | 项目照片以网格形式展示，可点击放大 |
| 视频播放器 | 内嵌视频播放（外链 URL 或 base64） |
| "Ask Knowledge Agent" 输入框 | 占位 UI，Phase 2 接入 LLM |

### Phase 1c：KB 独立页面改造（下周）

| 任务 | 详情 |
|------|------|
| 双 Tab UI（Product KB / Project Files） | 改造现有 `page-knowledge-base` |
| 产品筛选（Zip Blinds / Sunroom / Pergola） | 替换现有 category-only 筛选 |
| 视频卡片 UI | 视频缩略图 + 时长 + 播放按钮 |
| 侧边栏导航项 | 添加 Knowledge Base 菜单项到侧边栏 |

### Phase 2：Supabase 接入（接入后端后）

| 任务 | 详情 |
|------|------|
| Supabase Storage buckets | 创建 `kb-tenant-files` 和 `kb-project-files` buckets |
| 文件上传 API | 前端 → Supabase Storage → 元数据写入 kb_documents |
| 向量嵌入 | PDF/文本 → embedding → pgvector |
| RAG 查询 | Knowledge Agent 通过 pgvector 检索上下文 |

### Phase 3：AI Agent 集成（6-12 个月）

| 任务 | 详情 |
|------|------|
| Knowledge Agent LLM 接入 | GPT-4 / Claude + RAG 管道 |
| 多 Agent 知识共享 | Agent 间 KB 访问权限控制 |
| 视频处理管道 | Whisper 转录 + 关键帧提取 → 向量化 |
| 知识分析仪表板 | 文档使用频率、Agent 检索统计 |

---

## 附录 A：UI 组件清单

| 组件 | 位置 | 新增/改造 |
|------|------|---------|
| `KBQuickReference` | Measurement/Quotation 面板内 | 🆕 新增 |
| `ProjectFileUploader` | Measurement 面板内 | 🆕 新增 |
| `ProjectFileGallery` | Knowledge Agent 面板 | 🆕 新增 |
| `ProductKBTab` | KB 独立页面 | 🔄 改造 |
| `ProjectFilesTab` | KB 独立页面 | 🆕 新增 |
| `KBSidebarMenuItem` | 侧边栏导航 | 🆕 新增 |
| `AskAgentInput` | Knowledge Agent 面板 | 🆕 新增（Phase 2） |

## 附录 B：与 OMEYA SOP 的对应

| OMEYA SOP 环节 | KB 支持内容 |
|---------------|------------|
| §1A 客户咨询 | Product specs, sales pitch deck, fabric catalog |
| §1B 现场测量 | Measurement SOP, mount guide, 3-point card, field video, **site photos/videos upload** |
| §1C 报价文档 | Pricing model, competitive matrix, **auto-generated quotation** |
| §2 生产质检 | (Phase 2) Factory QC checklist, packaging standards |
| §3 现场安装 | Installation SOP, motor wiring video, tool checklist |
| §4 验收移交 | Acceptance checklist, warranty card, maintenance guide |
| §5 售后支持 | Troubleshooting guide, recalibration video |
