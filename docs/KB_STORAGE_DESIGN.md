# Knowledge Base 存储架构设计

> 版本: 1.0 | 日期: 2026-04-07 | 状态: 草案

---

## 1. 设计目标

Nestopia 的知识库（KB）需要同时支持两个层级的内容管理：

| 层级 | 说明 | 示例 |
|------|------|------|
| **租户级 (Tenant KB)** | 产品线通用训练材料，全公司共享 | Zip Blinds 安装手册、Pergola 结构计算表、Sunroom 销售话术 |
| **项目级 (Project KB)** | 客户/项目专属文件，仅该项目可见 | 客户现场照片、测量视频、设计效果图、合同文件 |

---

## 2. 逻辑目录结构

```
kb/
├── {tenant-slug}/                    # 租户隔离根目录
│   │
│   ├── products/                     # ── 租户级：产品训练材料 ──
│   │   ├── zip-blinds/
│   │   │   ├── manuals/              # 安装手册、操作指南
│   │   │   ├── specs/                # 产品规格书、技术参数
│   │   │   ├── marketing/            # 销售话术、宣传册、案例图
│   │   │   └── videos/              # 产品视频、安装教程
│   │   ├── sunroom/
│   │   │   ├── manuals/
│   │   │   ├── specs/
│   │   │   ├── marketing/
│   │   │   └── videos/
│   │   ├── pergola/
│   │   │   ├── manuals/
│   │   │   ├── specs/
│   │   │   ├── marketing/
│   │   │   └── videos/
│   │   └── adu/                      # 可扩展到其他产品线
│   │       ├── manuals/
│   │       ├── specs/
│   │       ├── marketing/
│   │       └── videos/
│   │
│   ├── compliance/                   # ── 租户级：合规材料 ──
│   │   ├── building-codes/           # 各地建筑规范
│   │   ├── permits/                  # 许可证模板和指南
│   │   └── certifications/           # 产品认证文件
│   │
│   ├── training/                     # ── 租户级：培训材料 ──
│   │   ├── onboarding/               # 新员工入职资料
│   │   ├── sops/                     # 标准操作流程
│   │   └── troubleshooting/          # 故障排查指南
│   │
│   └── projects/                     # ── 项目级：客户专属文件 ──
│       └── {project-id}/
│           ├── site-photos/          # 现场勘测照片
│           ├── measurements/         # 测量数据、CAD 图纸
│           ├── designs/              # AI 生成效果图、设计方案
│           ├── videos/              # 现场视频、客户沟通录像
│           ├── contracts/            # 合同、报价单
│           └── completion/           # 竣工照片、验收文件
```

---

## 3. 命名规范

### 3.1 文件命名

```
{类型}_{描述}_{日期}.{扩展名}
```

| 示例 | 说明 |
|------|------|
| `manual_wr110a-78_installation_v3.2.pdf` | Zip Blinds WR110A 安装手册 v3.2 |
| `spec_pergola_modern_structural.pdf` | Pergola Modern 系列结构规格 |
| `photo_site_kitchen-north-wall_20260407.jpg` | 现场照片：厨房北墙 |
| `video_measure_living-room_20260407.mp4` | 测量视频：客厅 |
| `design_render_balcony-option-a_20260407.jpg` | 设计效果图：阳台方案A |
| `contract_quotation_20260407.pdf` | 报价单 |

### 3.2 Project ID 格式

沿用现有格式：`PRJ-YYYYMMDD-NNN`（如 `PRJ-20260407-001`）

### 3.3 Tenant Slug 格式

沿用现有格式：`omeya-sin`, `nestopia-chn`, `partner1`

---

## 4. 数据库模型

### 4.1 KB 文档元数据表（扩展现有 `documents` 表）

```sql
-- ============================================================
-- KB Documents：知识库文档元数据
-- 扩展现有 documents 表，增加 KB 特有字段
-- ============================================================
CREATE TABLE kb_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),

    -- 层级归属
    scope           VARCHAR(20) NOT NULL DEFAULT 'tenant',
                    -- 'tenant' = 租户级产品训练材料
                    -- 'project' = 项目级客户专属文件
    project_id      UUID REFERENCES projects(id),
                    -- scope='project' 时必填

    -- 产品线（scope='tenant' 时有效）
    product_line    VARCHAR(50),
                    -- zip-blinds / sunroom / pergola / adu / general

    -- 文档分类
    category        VARCHAR(50) NOT NULL,
                    -- manuals / specs / marketing / videos /
                    -- compliance / training / site-photos /
                    -- measurements / designs / contracts / completion

    -- 文件信息
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_type       VARCHAR(20) NOT NULL,
                    -- pdf / doc / xls / ppt / jpg / png / mp4 / mov / dwg / other
    file_size_bytes BIGINT,
    mime_type       VARCHAR(100),

    -- AI 处理
    status          VARCHAR(20) DEFAULT 'uploaded',
                    -- uploaded / processing / indexed / failed
    ai_agents       TEXT[],     -- 关联的 AI Agent: designer/pricing/compliance/service
    tags            TEXT[],     -- 搜索标签
    embedding_id    UUID,       -- 向量嵌入引用（pgvector）

    -- 版本控制
    version         INTEGER DEFAULT 1,
    is_latest       BOOLEAN DEFAULT TRUE,

    -- 审计
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE
);

-- 索引
CREATE INDEX idx_kb_tenant ON kb_documents(tenant_id);
CREATE INDEX idx_kb_scope ON kb_documents(scope, tenant_id);
CREATE INDEX idx_kb_project ON kb_documents(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_kb_product ON kb_documents(product_line) WHERE product_line IS NOT NULL;
CREATE INDEX idx_kb_category ON kb_documents(category);
CREATE INDEX idx_kb_status ON kb_documents(status);

-- RLS
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_kb_documents ON kb_documents FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_super_admin());
```

### 4.2 模型关系图

```
tenants (1) ─────── (N) kb_documents
                          │
                          ├── scope='tenant'  → 按 product_line 分组
                          │                      (zip-blinds, sunroom, pergola...)
                          │
                          └── scope='project' → 关联 projects 表
                                                 (PRJ-20260407-001)

projects (1) ────── (N) kb_documents (where scope='project')
```

---

## 5. 存储策略（分阶段）

### Phase 1：Demo / POC（当前阶段）

| 文件类型 | 存储位置 | 限制 |
|---------|----------|------|
| 小型 PDF、图片（<25MB）| `public/kb/{tenant}/{...}` in Git | 总计 <500MB |
| 大型视频、CAD | 暂时外部链接（Google Drive / OneDrive URL）| 无限制 |
| 文档元数据 | localStorage（前端 demo）| 浏览器限制 |

**优点**：零成本、随 Cloudflare Pages 部署、开发快
**缺点**：Git 仓库不适合大二进制文件

### Phase 2：MVP（接入 Supabase）

| 文件类型 | 存储位置 | 限制 |
|---------|----------|------|
| 所有文件 | **Supabase Storage** (buckets) | Free: 1GB, 50MB/file |
| 文档元数据 | **Supabase PostgreSQL** (kb_documents 表) | 无限制 |
| 向量嵌入 | **pgvector** | 按需 |

**Bucket 结构**：
```
Supabase Storage Buckets:
├── kb-tenant-files/          # 租户级训练材料（公司内部可读）
│   └── {tenant-id}/products/zip-blinds/manuals/...
└── kb-project-files/         # 项目级客户文件（项目成员可读）
    └── {tenant-id}/projects/{project-id}/site-photos/...
```

**RLS 策略**：
- `kb-tenant-files`：同租户所有成员可读，管理员可写
- `kb-project-files`：项目成员可读写，管理员全权限

### Phase 3：Production（大规模）

| 文件类型 | 存储位置 | 限制 |
|---------|----------|------|
| 大型文件（视频、CAD）| **Cloudflare R2** | 10GB free, 5GB/file |
| 文档和图片 | **Supabase Storage** | 100GB (Pro) |
| 元数据 + 向量 | **Supabase PostgreSQL + pgvector** | 无限制 |
| CDN 加速 | **Cloudflare CDN** (R2 自带) | 免费出站 |

---

## 6. 前端 UI 交互设计

### 6.1 现有 Knowledge Base 页面改造

当前 `page-knowledge-base` 页面只有「租户级」视角。需要增加：

```
┌────────────────────────────────────────────────────────┐
│ Knowledge Base Builder                                 │
│                                                        │
│ [📦 Product Library]  [📁 Project Files]    ← 顶部 Tab │
│                                                        │
│ ── Product Library Tab ──                              │
│ Product: [All ▼] [Zip Blinds] [Sunroom] [Pergola]     │
│ Category: [All ▼] [Manuals] [Specs] [Marketing] [Video]│
│                                                        │
│ ┌──────────────────────────────────────────────┐       │
│ │ 📄 WR110A Installation Manual v3.2.pdf       │       │
│ │    Zip Blinds > Manuals  |  4.5MB  |  Indexed│       │
│ │ 📹 Pergola Assembly Tutorial.mp4             │       │
│ │    Pergola > Videos  |  128MB  |  External    │       │
│ └──────────────────────────────────────────────┘       │
│                                                        │
│ ── Project Files Tab ──                                │
│ Project: [MX Zip Blinds ▼]                             │
│ Type: [All ▼] [Photos] [Videos] [Designs] [Contracts]  │
│                                                        │
│ ┌──────────────────────────────────────────────┐       │
│ │ 📷 site_kitchen-north-wall_20260407.jpg      │       │
│ │    Site Photos  |  2.3MB  |  ✅ Indexed       │       │
│ │ 📹 measure_living-room_20260407.mp4          │       │
│ │    Videos  |  45MB  |  Processing...          │       │
│ │ 🎨 render_balcony-option-a_20260407.jpg      │       │
│ │    Designs  |  1.8MB  |  AI Generated         │       │
│ └──────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

### 6.2 项目详情页快捷入口

在项目详情面板（Step 4）增加 "Project Files" 快捷入口，直接跳转到 KB 的 Project Files tab 并筛选到该项目。

---

## 7. AI Agent 集成

### 7.1 文档→Agent 路由规则

| 文档类别 | 自动分配的 Agent |
|---------|-----------------|
| `manuals`, `specs` | AI Designer, Customer Service |
| `marketing` | Pricing Agent, Customer Service |
| `compliance`, `permits` | Compliance Manager |
| `training`, `sops` | 所有 Agent |
| `site-photos`, `measurements` | AI Designer |
| `designs` | AI Designer, Customer Service |
| `contracts` | Compliance Manager |

### 7.2 处理管道

```
文件上传
  ↓
自动检测文件类型
  ↓
┌─── PDF/DOC ──→ 文本提取 ──→ 分块 ──→ 向量嵌入 ──→ pgvector
├─── 图片 ────→ OCR + 描述 ──→ 向量嵌入 ──→ pgvector
├─── 视频 ────→ 帧提取 + 转录 ──→ 文本分块 ──→ pgvector
└─── CAD ─────→ 元数据提取 ──→ 向量嵌入 ──→ pgvector
  ↓
更新 status = 'indexed'
  ↓
Agent 可通过 RAG 检索该文档
```

---

## 8. 安全与权限

| 操作 | 租户管理员 | 项目经理 | 销售 | AI Agent |
|------|-----------|---------|------|---------|
| 上传租户级文档 | ✅ | ❌ | ❌ | ❌ |
| 查看租户级文档 | ✅ | ✅ | ✅ | ✅ (按分配) |
| 上传项目级文件 | ✅ | ✅ | ✅ | ❌ |
| 查看项目级文件 | ✅ | ✅ (仅本项目) | ✅ (仅本项目) | ✅ (按分配) |
| 删除任何文件 | ✅ | ❌ | ❌ | ❌ |

---

## 9. 实施路线图

| 阶段 | 工作内容 | 预期成果 |
|------|---------|---------|
| **Phase 1a** (现在) | 创建 `public/kb/` 目录结构，放入几个样本文件 | 可演示的文件夹结构 |
| **Phase 1b** (本周) | 改造 KB 页面，增加 Product Library / Project Files 双 Tab | UI 可交互 |
| **Phase 2** (接入 Supabase) | 实现文件上传到 Supabase Storage + 元数据写入 kb_documents 表 | 真实数据持久化 |
| **Phase 3** (AI 集成) | 接入嵌入 API + pgvector，实现 RAG 检索 | Agent 可查询 KB |

---

## 附录：现有相关资源位置

| 资源 | 位置 |
|------|------|
| KB 前端页面 | `company-operations.html` 行 3514-3769 |
| KB JavaScript 逻辑 | `company-operations.html` 行 7685-8051 |
| 现有 47 个虚拟文档数据 | `company-operations.html` 行 7711-7759 |
| documents 表 schema | `supabase/schema.sql` 行 1032-1076 |
| product_files 表 schema | `supabase/schema.sql` |
| 数据 AI 策略 | `docs/DATA_AI_STRATEGY.md` |
| 产品图片（营销用） | `public/images/products/` |
