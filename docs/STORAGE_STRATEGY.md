# Nestopia 存储策略

> **版本:** 1.0 | **日期:** 2026-04-08 | **状态:** 草案  
> **关联文档:** [DATA_AI_STRATEGY.md](DATA_AI_STRATEGY.md) (v3.1), [KB_STORAGE_DESIGN.md](KB_STORAGE_DESIGN.md) (v1.0), [ZB_KB_KNOWLEDGE_AGENT_DESIGN.md](ZB_KB_KNOWLEDGE_AGENT_DESIGN.md) (v1.0)

---

## 1. 背景与目标

Nestopia 平台需要存储多种类型的数据来支撑 B2B 运营 + AI Agent 体系：

| 数据类型 | 示例 | 典型大小 |
|---------|------|---------|
| **结构化业务数据** | 客户信息、订单、项目、产品 SKU、报价 | <100MB |
| **知识库文档** | 产品手册 PDF、安装 SOP、合规文件 | 每个 1-10MB |
| **培训视频** | 安装教程、量尺演示、电机接线指导 | 每个 30-200MB |
| **项目现场照片** | 勘测照片、障碍物记录、安装前后对比 | 每张 2-5MB |
| **项目现场视频** | 现场走访、量尺过程记录 | 每个 30-100MB |
| **AI 生成内容** | 设计效果图、报价 PDF、量尺报告 | 每个 1-5MB |
| **向量嵌入** | 文档语义向量（用于 RAG 检索） | 每文档 <1KB |

**目标**：选择一个成本可控、渐进式扩展的存储方案，支撑从 Demo/POC 到商业上线的完整生命周期。

---

## 2. 技术选型决策

### 2.1 评估过的方案

| 方案 | 数据库 | 文件存储 | 向量搜索 | 评估结论 |
|------|-------|---------|---------|---------|
| **Supabase 官方** | PostgreSQL（托管） | Supabase Storage | pgvector | ✅ **选定方案** |
| Cloudflare 全栈 | D1 (SQLite) | R2 | Vectorize | ⚠️ D1 不如 PostgreSQL，无内置 Auth |
| 阿里云 Supabase | ApsaraDB RDS | 阿里云 OSS | pgvector | ❌ 非官方合作、US 区域不确定 |
| 混合方案 | Supabase PostgreSQL | Cloudflare R2 | pgvector | 🔄 可作为 Phase 3 扩展方案 |

### 2.2 选定方案：Supabase 官方

**选择理由**：

1. **已有架构投入** — 51KB schema.sql + 60KB seed_data.sql + 3 个 Edge Functions 已设计完成
2. **PostgreSQL 全功能** — 关系型数据库、JSONB、RLS（行级安全）、pgvector 开箱即用
3. **一站式 BaaS** — 数据库 + Storage + Auth + Edge Functions + Realtime 一个平台解决
4. **美国区域** — 官方支持 US East/West 区域，与客户市场一致
5. **免费层够用** — Demo/POC 阶段零成本启动
6. **与 Cloudflare Pages 兼容** — Supabase JS SDK 可直接从前端调用
7. **社区生态成熟** — 大量文档、教程、集成方案

**部署区域**：US East (Virginia) — 靠近美国东部客户群，同时与 Cloudflare CDN 配合全球加速。

---

## 3. Supabase 免费层详细限制

### 3.1 资源限额

| 资源 | 免费额度 | Nestopia 预估用量 | 风险等级 |
|------|---------|-----------------|---------|
| **数据库存储** | 500MB | ~50MB（Phase 2 初期） | 🟢 低 |
| **文件存储** | 1GB | ~500MB（20 个项目 × 5 张照片 × 5MB） | 🟡 中 |
| **出站带宽** | 5GB/月 | ~2GB/月（文件预览 + 视频播放） | 🟡 中 |
| **Edge Functions** | 50 万次/月 | ~5,000 次/月 | 🟢 低 |
| **Auth MAU** | 50,000 | <100 | 🟢 低 |
| **实时连接** | 200 并发 | <20 | 🟢 低 |
| **活跃项目** | 2 个 | 2（Staging + Production） | 🟡 中 |
| **闲置暂停** | 7 天不活动 | Demo 间歇使用可能触发 | 🟡 中 |

### 3.2 需要关注的限制

#### ⚠️ 限制 1：文件存储 1GB

**问题**：项目现场视频（30-100MB/个）+照片（2-5MB/张）会快速消耗 1GB 额度。

**缓解方案**：
- Phase 2 初期：限制上传文件大小（建议 ≤10MB/照片，≤50MB/视频）
- 前端压缩：照片自动压缩到 1080p，视频建议用户本地压缩后上传
- 租户级 KB 文件（PDF/手册）优先上传，项目级文件按需上传
- 监控存储用量，接近 80% 时提醒评估升级

#### ⚠️ 限制 2：活跃项目数 2 个

**问题**：Staging 和 Production 各需要一个 Supabase 项目，没有 dev 环境余裕。

**缓解方案**：
- 开发/测试：使用 Supabase CLI 本地运行（`supabase start`），不占用云端项目
- Staging：Supabase 项目 1（与 Cloudflare Pages Staging 对应）
- Production：Supabase 项目 2（与 Cloudflare Pages Production 对应）

#### ⚠️ 限制 3：7 天闲置自动暂停

**问题**：数据库 7 天无活动会自动暂停，恢复时冷启动需要几秒。

**缓解方案**：
- 设置健康检查 Cron Job（每 3 天 ping 一次数据库）
- 或使用 Cloudflare Workers 设置定时触发器
- 正式商用后升级 Pro 计划可彻底解决

### 3.3 升级路径

| 阶段 | 计划 | 月费用 | 存储 | 带宽 |
|------|------|-------|------|------|
| **Demo/POC** | Free | $0 | 500MB DB + 1GB 文件 | 5GB |
| **MVP/Beta** | Pro | $25/月 | 8GB DB + 100GB 文件 | 250GB |
| **商业上线** | Pro + R2 | $25/月 + R2 按量 | 8GB DB + 100GB + R2 无限 | 250GB + R2 免费出站 |

---

## 4. 存储架构设计

### 4.1 Supabase 组件分工

```
┌─────────────────────────────────────────────────────────────┐
│                    Nestopia 前端                              │
│                 (Cloudflare Pages)                           │
│                                                             │
│  company-operations.html  ←→  Supabase JS SDK (@supabase/supabase-js)
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTPS API
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase 平台                              │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  PostgreSQL DB   │  │  Storage        │  │  Auth        │ │
│  │                 │  │                 │  │             │ │
│  │  • tenants      │  │  Buckets:       │  │  • 用户认证   │ │
│  │  • users        │  │  ├ kb-tenant    │  │  • JWT 签发   │ │
│  │  • projects     │  │  └ kb-project   │  │  • RLS 驱动   │ │
│  │  • kb_documents │  │                 │  │             │ │
│  │  • orders       │  │  50MB/file max  │  │  50K MAU     │ │
│  │  • products     │  │                 │  │             │ │
│  │  • pgvector     │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Edge Functions  │  │  Realtime       │                   │
│  │                 │  │                 │                   │
│  │  • auth-login   │  │  • 项目协作通知   │                   │
│  │  • tenant-config│  │  • KB 处理状态   │                   │
│  │  • AI pipeline  │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Storage Bucket 设计

```
Supabase Storage:
├── kb-tenant-files/                    # 租户级：产品知识库
│   └── {tenant-id}/
│       ├── zip-blinds/
│       │   ├── manuals/               # 安装手册 PDF
│       │   ├── specs/                 # 产品规格书
│       │   ├── marketing/             # 销售材料
│       │   └── videos/               # 培训视频
│       ├── sunroom/
│       ├── pergola/
│       └── compliance/               # 合规文件
│
└── kb-project-files/                   # 项目级：客户专属
    └── {tenant-id}/
        └── {project-id}/
            ├── site-photos/           # 现场照片
            ├── site-videos/           # 现场视频
            ├── measurements/          # 量尺数据/CAD
            ├── designs/               # AI 效果图
            ├── quotations/            # 报价单 PDF
            └── contracts/             # 合同文件
```

**RLS 策略**：
- `kb-tenant-files`：同租户成员可读，租户管理员可写
- `kb-project-files`：项目团队成员可读写，租户管理员全权限

### 4.3 数据库核心表

已有完整设计，详见 [KB_STORAGE_DESIGN.md §4](KB_STORAGE_DESIGN.md) 的 `kb_documents` 表。

关键字段：

```sql
kb_documents:
  id, tenant_id, scope(tenant|project), project_id,
  product_line, category, name, file_url, file_type,
  file_size_bytes, status(uploaded|processing|indexed|failed),
  ai_agents[], tags[], embedding_id, version, is_latest
```

---

## 5. 分阶段实施计划

### Phase 1：Demo/POC（🔵 当前阶段 — 已部分完成）

**存储方式**：localStorage + JS 内存数据

| 组件 | 实现方式 | 状态 |
|------|---------|------|
| 租户级 KB 元数据 | `zbProductKB` JS 数组（20 条） | ✅ 已完成 |
| 项目文件上传（<5MB） | localStorage base64 | ✅ 已完成 |
| 项目文件上传（≥5MB） | 仅存元数据，提示 Phase 2 | ✅ 已完成 |
| KB Quick Reference 面板 | 工作流内嵌，上下文推送 | ✅ 已完成 |
| 文档预览模态框 | 元数据展示 + Phase 2 占位 | ✅ 已完成 |
| KB 页面双 Tab 改造 | — | ⏳ Phase 1c |
| Knowledge Agent 面板 | — | ⏳ Phase 1b |

**成本**：$0

### Phase 2：MVP（接入 Supabase 免费层）

**存储方式**：Supabase Storage + PostgreSQL

| 步骤 | 工作内容 | 前置条件 | 状态 |
|------|---------|---------|------|
| 2.1 | 注册 Supabase 账号，创建 US East 项目 | 无 | ⏳ 待执行 |
| 2.2 | 运行 `supabase/schema.sql` 创建表结构 | 2.1 | ⏳ 待执行 |
| 2.3 | 运行 `supabase/seed_data.sql` 导入测试数据 | 2.2 | ⏳ 待执行 |
| 2.4 | 创建 Storage Buckets — `003_storage_buckets.sql` | 2.1 | ✅ SQL 已编写 |
| 2.5 | 配置 Bucket RLS 策略 | 2.4 | ✅ 含在 003 中 |
| 2.6 | 前端集成 Supabase JS SDK — `js/supabase-config.js` | 2.1 | ✅ 已集成 |
| 2.7 | 改造 `handleProjectFileUpload()` — `js/supabase-storage.js` | 2.4, 2.6 | ✅ 已重构 |
| 2.8 | 改造 `getProjectFiles()` / `saveProjectFile()` → Supabase DB | 2.2, 2.6 | ✅ 已重构 |
| 2.9 | 上传租户级 KB 样本文件（PDF/视频） | 2.4 | ⏳ 待执行 |
| 2.10 | 端到端测试：上传 → 存储 → 预览 → 下载 | 全部 | ⏳ 待执行 |

**前端集成方式**：

```javascript
// 初始化 Supabase Client（在 company-operations.html 中）
import { createClient } from '@supabase/supabase-js'
// 或通过 CDN：<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabase = createClient(
    'https://xxxx.supabase.co',    // 项目 URL
    'eyJhbG...'                     // Anon Key（公开安全）
);

// 文件上传示例
async function uploadProjectFile(projectId, file) {
    const path = `${tenantId}/${projectId}/site-photos/${file.name}`;
    const { data, error } = await supabase.storage
        .from('kb-project-files')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
        .from('kb-project-files')
        .getPublicUrl(path);

    // 写入元数据到 kb_documents 表
    await supabase.from('kb_documents').insert({
        tenant_id: tenantId,
        scope: 'project',
        project_id: projectId,
        category: 'site-photos',
        name: file.name,
        file_url: publicUrl,
        file_type: file.type.split('/')[1],
        file_size_bytes: file.size,
        status: 'uploaded'
    });
}
```

**成本**：$0（免费层）

### Phase 3：商业上线（Supabase Pro + 可选 Cloudflare R2）

**触发条件**：免费层存储接近 80% 或开始有付费客户。

| 组件 | 方案 | 月费用 |
|------|------|-------|
| 数据库 | Supabase Pro（8GB） | $25 |
| 文件存储（文档/图片） | Supabase Storage（100GB） | 含在 $25 内 |
| 文件存储（大型视频） | Cloudflare R2（按量） | ~$0.015/GB/月 |
| 向量搜索 | pgvector（Supabase 内置） | 含在 $25 内 |
| CDN 加速 | Cloudflare（已有） | $0 |

**R2 扩展策略**（仅当视频量增大时启用）：
- 大于 50MB 的视频文件上传到 Cloudflare R2
- 其余文件保留在 Supabase Storage
- R2 出站带宽永久免费，适合视频分发场景
- 通过 Cloudflare Workers 做上传代理

---

## 6. 安全设计

### 6.1 访问控制矩阵

| 角色 | 租户级 KB（读） | 租户级 KB（写） | 项目级文件（读） | 项目级文件（写） |
|------|--------------|--------------|---------------|---------------|
| 租户管理员 | ✅ | ✅ | ✅ 全部项目 | ✅ 全部项目 |
| 项目经理 | ✅ | ❌ | ✅ 本项目 | ✅ 本项目 |
| 销售人员 | ✅ | ❌ | ✅ 本项目 | ✅ 本项目 |
| AI Agent | ✅ 按分配 | ❌ | ✅ 按分配 | ❌ |
| 外部客户 | ❌ | ❌ | ❌ | ❌ |

### 6.2 RLS 策略概要

```sql
-- 租户隔离（基础策略）
CREATE POLICY tenant_isolation ON kb_documents
    USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- 项目级文件仅项目成员可见
CREATE POLICY project_access ON kb_documents
    FOR SELECT USING (
        scope = 'tenant'  -- 租户级文件，同租户可见
        OR (scope = 'project' AND project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = auth.uid()
        ))
    );
```

### 6.3 敏感文件处理

| 文件类型 | 处理方式 |
|---------|---------|
| 经销商价目表（Confidential） | `kb-tenant-files` Bucket 设为 private，通过签名 URL 访问 |
| 客户合同 | `kb-project-files` private，仅项目成员可访问 |
| AI 密钥/凭证 | 永不存入 Storage，仅在 Edge Functions 环境变量中 |

---

## 7. 数据备份与恢复

| 阶段 | 备份策略 |
|------|---------|
| **Free 层** | Supabase 自动每日备份（保留 7 天），但 Free 层无法手动恢复，需联系支持 |
| **Pro 层** | 自动每日备份 + 手动备份 + PITR（时间点恢复） |
| **额外保险** | 定期用 `pg_dump` 导出到本地/R2 |

---

## 8. 监控与告警

### 8.1 关键指标

| 指标 | 告警阈值 | 监控方式 |
|------|---------|---------|
| 数据库存储使用率 | >80%（400MB） | Supabase Dashboard |
| 文件存储使用率 | >80%（800MB） | Supabase Dashboard |
| 月带宽使用率 | >80%（4GB） | Supabase Dashboard |
| Edge Function 错误率 | >5% | Supabase Logs |
| 数据库连接数 | >80% 最大值 | Supabase Dashboard |

### 8.2 升级决策流程

```
存储使用率 > 80%
    ↓
评估：是数据增长还是可清理？
    ↓
┌─ 可清理 ──→ 清理过期/重复文件
│
└─ 真实增长 ──→ 评估 Pro 计划 ($25/月)
                ├─ 有收入支撑？ ──→ 升级 Pro
                └─ 无收入？ ──→ 限制上传 + 压缩策略
```

---

## 9. 与现有系统的关系

```
┌───────────────────────────────────────────────────────────────┐
│                    文档架构关系图                                │
│                                                               │
│  DATA_AI_STRATEGY.md          ← 全局数据 & AI 战略（北极星）     │
│       │                                                       │
│       ├── STORAGE_STRATEGY.md ← 本文档：存储技术选型 & 实施计划   │
│       │       │                                               │
│       │       ├── KB_STORAGE_DESIGN.md   ← KB 存储架构细节      │
│       │       │                            (目录结构、DB 模型)   │
│       │       │                                               │
│       │       └── ZB_KB_KNOWLEDGE_AGENT_DESIGN.md              │
│       │                                  ← Zip Blinds KB 专用   │
│       │                                    (Phase 1a-3 路线图)   │
│       │                                                       │
│       └── supabase/schema.sql            ← 数据库 DDL          │
│           supabase/seed_data.sql         ← 测试数据             │
│           supabase/config.toml           ← 本地开发配置          │
│           supabase/functions/            ← Edge Functions       │
│                                                               │
│  company-operations.html                 ← 前端实现              │
│       └── zbProductKB[], handleProjectFileUpload() 等          │
│                                                               │
│  Cloudflare Pages                        ← 前端部署              │
│       └── main 分支 → Staging                                  │
│       └── Production 分支 → ai-nestopia.com                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 附录 A：Supabase 官方 vs Pro 对比

| 资源 | Free | Pro ($25/月) |
|------|------|-------------|
| 数据库 | 500MB | 8GB |
| 文件存储 | 1GB | 100GB |
| 带宽 | 5GB/月 | 250GB/月 |
| Edge Functions | 50 万次/月 | 200 万次/月 |
| Auth MAU | 50,000 | 100,000 |
| 实时连接 | 200 | 500 |
| 项目数 | 2 | 无限 |
| 闲置暂停 | 7 天 | 不暂停 |
| 备份 | 自动(7 天) | 自动 + PITR |
| 支持 | 社区 | Email |

## 附录 B：可选的 Phase 3 Cloudflare R2 扩展

当视频存储需求增大时，可将大型视频迁移到 Cloudflare R2：

| R2 资源 | 免费额度 | 超出费用 |
|---------|---------|---------|
| 存储 | 10GB/月 | $0.015/GB/月 |
| Class A 操作（写入） | 100 万次/月 | $4.50/百万次 |
| Class B 操作（读取） | 1000 万次/月 | $0.36/百万次 |
| **出站带宽** | **永久免费** | **$0** |

R2 的核心优势：**出站带宽永久免费**，非常适合视频等大文件的高频分发场景。

---

**文档负责人**: Nestopia 产品 & 技术团队  
**审阅周期**: 每月一次（活跃开发期）；每季度一次（上线后）
