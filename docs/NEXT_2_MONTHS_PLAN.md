# Nestopia 未来 2 个月实施计划（2026-04 至 2026-06）

**版本**: 1.0.0
**创建日期**: 2026-04-20
**状态**: 活跃
**维护者**: websterzhangsh

---

## 总览

基于对过去 30 天 ~140 个 commit 的全面分析，确定未来 2 个月的 **3 项关键事项**：

| 优先级 | 事项 | 核心目标 | 预计周期 |
|--------|------|---------|---------|
| 🥇 P0 | Supabase Auth + RLS 安全加固 | 平台可以交给真实合作伙伴使用 | 2-3 周 |
| 🥈 P0 | AI 设计师场景融合质量升级 | demo 级别的"哇"效果，展示核心卖点 | 3-4 周 |
| 🥉 P1 | 知识库 RAG 上线 | 聊天机器人从"通用回复"变为"精准回答" | 2-3 周 |

**优先级逻辑**：安全（能不能用）→ 核心卖点（值不值得用）→ 智能基座（用起来聪不聪明）

---

## 🥇 事项一：Supabase Auth + RLS 安全加固

### 1.1 当前状态

| 方面 | 现状 | 风险等级 |
|------|------|---------|
| 认证方式 | 模拟登录（客户端硬编码规则 `{prefix}123!`） | 🔴 严重 |
| 租户隔离 | 硬编码 UUID（`550e8400-...`），前端 localStorage | 🔴 严重 |
| RLS 策略 | POC-only，anon 角色全开放 | 🔴 严重 |
| 存储桶权限 | DEV-ONLY 策略，任何人可读写 | 🔴 严重 |
| Edge Functions | `auth-login` + `auth-middleware` 已设计（TypeScript），未部署 | ✅ 就绪 |

### 1.2 实施步骤

#### Sprint 1：后端认证基础（第 1-2 周）

**Step 1.1 — 部署 Edge Functions**
- 文件：`supabase/functions/auth-login/index.ts`、`supabase/functions/auth-middleware/index.ts`
- 操作：部署到 Supabase Cloud，验证 JWT 签发/校验流程
- 注意：需要配置 JWT_SECRET 环境变量
- 验收：`POST /functions/v1/auth-login` 返回有效 JWT token

**Step 1.2 — 准备真实用户数据**
- `users` 表中创建真实用户记录（bcrypt 哈希密码）
- 每个租户至少 1 个管理员账户（Greenscape / Omeya / Nestopia-CHN）
- 验证 `tenant_id` 外键关联正确

**Step 1.3 — 前端登录切换为真实认证**
- 移除 `login.html` 第 553-575 行的硬编码密码规则
- 改为调用 `POST /functions/v1/auth-login`，获取 JWT
- JWT 存储到 `localStorage`，替代当前的模拟 token
- 页面加载时通过 `auth-middleware` 验证 token 有效性

#### Sprint 2：RLS 加固 + 租户隔离（第 2-3 周）

**Step 2.1 — 激活生产 RLS 策略**
- 删除 `004_poc_seed_and_rls.sql` 中所有 POC 策略（第 85-139 行）
- 激活 `schema.sql` 中设计的生产策略（第 1125-1192 行）：
  ```sql
  CREATE POLICY rls_{table} ON {table} FOR ALL
      USING (tenant_id = get_current_tenant_id());
  ```
- 所有 18 张表逐一验证

**Step 2.2 — 移除硬编码租户 ID**
- `js/modules/products.js` 第 23 行的 `PRODUCT_TENANT_ID` → 改为从 JWT 读取
- 所有 Supabase 查询中的硬编码 UUID → 替换为 `getCurrentTenantId()`
- 全局搜索 `550e8400` 确保无残留

**Step 2.3 — 存储桶安全加固**
- 移除 `003_storage_buckets.sql` 第 199-234 行的 DEV-ONLY 策略
- 替换为认证用户策略：仅当前租户的已认证用户可读写
- 验证文件上传/下载/删除在新策略下正常工作

**Step 2.4 — 端到端安全测试**
- 测试跨租户访问被正确拒绝
- 测试未认证访问被拒绝
- 测试 Token 过期后自动跳转登录页
- 测试 3 个租户的完整登录 → 数据读写 → 登出流程

### 1.3 技术依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| Supabase Cloud 实例 | ✅ 已有 | `drofojkakxitrqxnxrhh.supabase.co` |
| Edge Functions 运行时 | ✅ 已有 | Supabase Deno 运行时 |
| JWT 库 | ✅ 代码已写 | `auth-login/index.ts` 中已实现 |
| bcrypt | ✅ 代码已写 | `auth-login/index.ts` 中已引入 |
| 前端 auth.js | ✅ 已有 | `js/core/auth.js` 需要适配 |

### 1.4 交付物

- [ ] 真实登录/注册流程（JWT + Supabase Auth）
- [ ] 18 张表的生产级 RLS 策略
- [ ] 存储桶安全策略
- [ ] 移除所有硬编码租户 ID
- [ ] 3 个租户的端到端安全测试通过

---

## 🥈 事项二：AI 设计师场景融合质量升级

### 2.1 当前状态

| 方面 | 现状 | 差距 |
|------|------|------|
| API 集成 | ✅ DashScope qwen-image-edit-plus + 7 模型降级链 | 稳定 |
| 图像融合质量 | ⚠️ 基础图像编辑级别（概念稿级） | 离"哇"效果差距明显 |
| 视觉分析 | ❌ 未集成（无自动尺寸估算/场景描述） | 关键缺失 |
| 输出分辨率 | 1024×1024 固定 | 需要更高分辨率选项 |
| 场景融合 | 2-3 图融合，依赖提示词控制 | 透视/阴影/光照常不匹配 |

### 2.2 实施步骤

#### Sprint 3：视觉分析集成（第 3-4 周）

**Step 3.1 — 集成通义千问-VL 视觉分析**
- 新建 Cloudflare Function：`/api/design-analyze`
- 用户上传庭院照片 → 调用 Qwen-VL / GPT-4V → 返回：
  - 场景描述（草坪面积、现有结构、朝向）
  - 粗略尺寸估算（±10-15%）
  - 光照条件和遮挡物
  - 推荐的产品安装位置
- 前端 Step 2 中：上传照片后自动触发分析 → 结果填入表单

**Step 3.2 — 提示词工程优化**
- 基于视觉分析结果自动生成高质量融合提示词：
  ```
  将{产品名}安装在{场景描述}中，位于{推荐位置}，
  保持与{光照条件}一致的光影效果，
  透视角度与背景照片完全匹配...
  ```
- 建立提示词模板库（按产品类型×场景类型）
- A/B 测试不同提示词的融合质量

#### Sprint 4：融合质量提升 + 方案输出（第 5-6 周）

**Step 4.1 — 评估高端模型 API**
- 评估方案（按可行性排序）：
  1. **通义万相最新模型** — 检查 DashScope 是否有更高质量的 image-to-image 模型
  2. **ComfyUI + ControlNet 自部署** — 边缘检测 + 深度图 → 精确控制产品放置
  3. **Midjourney API**（如有）/ **DALL-E 3** — 评估生成质量 vs 成本
  4. **Stable Diffusion XL + IP-Adapter** — 风格一致性 + 产品保真度
- 每个方案生成 10 张对比测试图 → 人工评分选择最优

**Step 4.2 — 设计方案版本管理**
- 每次生成的效果图保存到 Supabase（含元数据：提示词、模型、参数）
- A/B 对比视图 — 客户可左右滑动比较不同方案
- 设计版本历史 — 回溯到任意一版

**Step 4.3 — 设计+报价联动**
- "一键方案"原型：从 Step 2 设计结果 → 自动跳转 Step 4 报价 → 联动输出
- 方案 PDF 导出（设计效果图 + 报价明细 + 产品规格）
- 为 demo 演示准备 3 个高质量案例（Sunroom / Pergola / Zip Blinds 各一）

### 2.3 技术依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| DashScope API | ✅ 已有 | API Key 已配置 |
| Qwen-VL 视觉模型 | ⏳ 需评估 | 检查 DashScope 是否已支持 |
| GPT-4V（备选） | ⏳ 需评估 | 需要 OpenAI API Key |
| 前端 designer.js | ✅ 已有 | 740 行，需扩展 |
| 后端 design-generate.js | ✅ 已有 | 311 行，需扩展 |

### 2.4 交付物

- [ ] 照片上传后自动视觉分析（场景描述 + 尺寸估算）
- [ ] 优化后的提示词模板库（按产品×场景）
- [ ] 至少 1 种更高质量的融合模型评估报告
- [ ] 设计方案版本管理（保存 + A/B 对比）
- [ ] 3 个 demo 级高质量案例
- [ ] 设计+报价联动原型

---

## 🥉 事项三：知识库 RAG 上线

### 3.1 当前状态

| 方面 | 现状 | 差距 |
|------|------|------|
| KB 前端 UI | ✅ 完整（上传/分类/搜索/标记） | 就绪 |
| KB 存储 | ✅ Supabase Storage + PostgreSQL | 就绪 |
| KB 种子数据 | ✅ 20 份 Zip Blinds 文档 | 就绪 |
| pgvector | ❌ 扩展未创建 | 关键阻塞 |
| 向量嵌入 | ❌ 无嵌入生成代码 | 关键缺失 |
| 语义搜索 | ❌ 无搜索 API | 关键缺失 |
| 聊天机器人 RAG | ❌ 聊天零 KB 上下文 | 关键缺失 |
| embedding_id 列 | ✅ 已预留（UUID） | 就绪 |

### 3.2 实施步骤

#### Sprint 5：向量基础设施（第 5-6 周）

**Step 5.1 — 启用 pgvector + 创建数据表**
- 新建迁移 `005_pgvector_setup.sql`：
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  
  CREATE TABLE document_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536),
      token_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
  );
  
  CREATE INDEX idx_chunks_embedding 
      ON document_chunks USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX idx_chunks_document 
      ON document_chunks(document_id);
  ```
- 在 Supabase Dashboard 执行迁移

**Step 5.2 — 实现文档分块 + 嵌入管道**
- 新建 Cloudflare Function：`/api/kb/process`
- 触发方式：文档上传成功后自动调用
- 流程：
  1. 读取文档原文（PDF/DOCX → 文本提取，纯文本直接用）
  2. 语义分块（按段落 / 500 token 为单位，150 token 重叠）
  3. 调用嵌入 API（通义千问 text-embedding-v3 或 OpenAI text-embedding-3-small）
  4. 写入 `document_chunks` 表（content + embedding）
  5. 更新 `kb_documents.status` = 'indexed'

**Step 5.3 — 实现语义搜索 API**
- 新建 Cloudflare Function：`/api/kb/search`
- 请求：`{ "query": "Zip Blinds 防水等级是多少?", "tenant_id": "...", "top_k": 5 }`
- 处理：
  1. 将 query 文本转为向量（调用嵌入 API）
  2. 在 `document_chunks` 表中执行余弦相似度搜索
  3. 按 tenant_id 过滤 + 按相关度排序
  4. 返回 top_k 个最相关的文档片段
- 响应：`{ "results": [{ "content": "...", "score": 0.92, "source": "ZB 产品规格.pdf", "chunk_index": 3 }] }`

#### Sprint 6：聊天机器人 RAG 集成（第 6-7 周）

**Step 6.1 — 修改 /api/chat 支持 RAG**
- 在 `functions/api/chat.js` 中：
  1. 接收用户消息后，先调用 `/api/kb/search` 检索相关文档
  2. 将检索到的文档片段注入 System Prompt：
     ```
     以下是与用户问题相关的知识库文档，请基于这些内容回答：
     ---
     [文档片段 1]: {content} (来源: {source})
     [文档片段 2]: {content} (来源: {source})
     ---
     如果知识库中没有相关信息，请诚实说明。
     ```
  3. 发送增强后的 prompt 给 LLM
  4. 返回回答 + 引用来源

**Step 6.2 — 前端引用展示**
- 聊天回复下方显示"参考来源"标签
- 点击标签可跳转到 KB 文档详情
- 无引用时不显示（纯 LLM 通用回答）

**Step 6.3 — 端到端测试 + 调优**
- 使用 20 份 Zip Blinds 种子文档进行测试
- 准备 20 个测试问题（覆盖规格/安装/合规/定价/保修）
- 目标：RAG 回答准确率 > 85%
- 调参：top_k、chunk_size、overlap、相似度阈值

### 3.3 技术依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| Supabase pgvector 扩展 | ⏳ 需启用 | Supabase Pro 计划支持，需在 Dashboard 启用 |
| 嵌入 API | ⏳ 需选择 | 通义千问 text-embedding-v3（免费额度）或 OpenAI（付费） |
| 文本提取 | ⏳ 需实现 | PDF/DOCX → 纯文本（可用 pdf-parse / mammoth 库） |
| 前端 KB UI | ✅ 已有 | 仅需添加"索引状态"指示器 |
| 聊天 API | ✅ 已有 | `functions/api/chat.js` 需扩展 |

### 3.4 交付物

- [ ] pgvector 启用 + `document_chunks` 表创建
- [ ] 文档自动分块 + 嵌入管道
- [ ] 语义搜索 API（`/api/kb/search`）
- [ ] 聊天机器人 RAG 集成（检索 → 注入 → 引用）
- [ ] 20 份种子文档索引成功
- [ ] 20 个测试问题准确率 > 85%

---

## 时间线总览

```
第 1 周  ─┬─ Sprint 1: Auth 后端基础（Edge Functions 部署 + 用户数据）
第 2 周  ─┤
第 3 周  ─┼─ Sprint 2: RLS 加固 + 租户隔离
          └─ Sprint 3 开始: 视觉分析集成
第 4 周  ─── Sprint 3: 视觉分析 + 提示词优化
第 5 周  ─┬─ Sprint 4: 融合质量提升 + 方案输出
          └─ Sprint 5 开始: pgvector 基础设施
第 6 周  ─┬─ Sprint 4 完成: Demo 案例准备
          └─ Sprint 5: 分块 + 嵌入管道
第 7 周  ─── Sprint 6: 聊天机器人 RAG 集成
第 8 周  ─── 缓冲周: Bug 修复 + 端到端测试 + Demo 准备
```

### 里程碑

| 里程碑 | 目标日期 | 验收标准 |
|--------|---------|---------|
| M1: 安全可用 | 第 3 周末 | 3 个租户可真实登录，跨租户访问被拒绝 |
| M2: 设计惊艳 | 第 6 周末 | 3 个 demo 案例的场景融合让非技术人员说"哇" |
| M3: 智能回答 | 第 7 周末 | 聊天机器人基于 KB 文档的回答准确率 > 85% |
| M4: Demo Ready | 第 8 周末 | 完整的合作伙伴 demo 流程可跑通 |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| 视觉分析模型质量不达预期 | 中 | 高 | 准备 Qwen-VL + GPT-4V 两个选项，取更好者 |
| pgvector 在 Supabase Free 计划不可用 | 低 | 高 | 确认当前计划支持；必要时升级到 Pro（$25/月） |
| 场景融合质量无法达到"哇"效果 | 中 | 高 | 降低期望到"优质概念稿"级别；准备人工后期处理流程 |
| Edge Function 部署遇到 CORS/冷启动问题 | 中 | 中 | 提前在 staging 环境验证；准备 Cloudflare Worker 作为备选 |
| 嵌入 API 成本超预算 | 低 | 低 | 通义千问 embedding 有免费额度；OpenAI small 模型价格极低 |

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|-----|------|---------|
| 1.0.0 | 2026-04-20 | 初版 — 基于 AI Agent 战略白皮书 v2.3.0 和过去 30 天开发进展制定 |
