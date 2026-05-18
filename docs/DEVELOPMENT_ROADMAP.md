# Nestopia 产品开发路线图与交付计划

> **版本**: 1.2.0  
> **创建日期**: 2026-05-18  
> **最后更新**: 2026-05-18 (Week 20)  
> **状态**: 活跃 — 每周更新  
> **维护者**: Webster Zhang

---

## 一、Production Landscape — 已交付功能全景

> 按月记录已部署到生产环境 (ai-nestopia.com) 的功能。每项标注交付时间与核心 commit。

### 2026-03 — 基础平台搭建月

| 功能 | 描述 | 状态 | 关键 Commit |
|------|------|------|------------|
| **6-Step Workflow** | 项目全流程管理（Intake → Design → Measure → Quote → Verify → Close） | ✅ 已上线 | `60d6fe1` |
| **AI Designer (Step 2)** | 照片 → AI 场景融合效果图（Sunroom/Pergola/ZB），DashScope API | ✅ 已上线 | `ee5fe0a` `016dafe` |
| **Measurement Panel (Step 3)** | ZB 专用测量表单（Opening 尺寸、安装类型、面料） | ✅ 已上线 | `8b5aff3` `afe2bd8` |
| **Quotation Engine (Step 4)** | 6-Strategy 定价引擎（COGS/Market/Sell/Drive），PDF 报价单 | ✅ 已上线 | `c17d1c3` `36a5d49` |
| **多租户架构** | 3 租户（Greenscape-US / Omeya-SIN / Nestopia-CHN），前端隔离 | ✅ 已上线 | `60d6fe1` |
| **Company Operations 页面** | Dashboard + Overview + Workflow 集成视图 | ✅ 已上线 | `60d6fe1` |
| **KB 知识库 UI** | 文档上传/分类/搜索/标记 + Supabase Storage | ✅ 已上线 | — |
| **生产域名部署** | ai-nestopia.com (Cloudflare Pages + Custom Domain) | ✅ 已上线 | `287d851` |
| **Workflow 步骤警告系统** | 前置条件未满足警告 + 重操作风险确认 | ✅ 已上线 | `3e066dc` `19b1b45` |
| **聊天机器人** | Qwen LLM 2C/2B 双模式（无 RAG） | ✅ 已上线 | — |

### 2026-04 — 定价链与分销商月

| 功能 | 描述 | 状态 | 关键 Commit |
|------|------|------|------------|
| **多层定价链 (L0→L3)** | 供应商价 → 平台成本 → 批发价 → 零售价，4 层定价模型 | ✅ 已上线 | `4930205` `fd162b5` |
| **分销商批发价管理** | Wholesale Pricing 面板 + Import + Publish + 通知系统 | ✅ 已上线 | `a352dbf` `fd162b5` |
| **Consumer Quotation PDF** | 消费者端报价单（SGD 本地货币，英文优先） | ✅ 已上线 | `9e2a3a8` `07f6eb0` |
| **Overview 产品详情面板** | 分组列表 + SKU 详情（统一 Omeya 风格） | ✅ 已上线 | `88dd827` `29bbab9` |
| **Apply to All（测量）** | Opening #1 一键复制到所有 Openings | ✅ 已上线 | `142702e` |
| **Publish History** | 发布历史日志，跟踪每次价格变更 | ✅ 已上线 | `93610a3` |
| **跨租户安全修复** | 3 层防护（路由 + 查询 + 渲染） | ✅ 已上线 | `ece2630` |
| **文件完整性守卫** | pre-commit hook 防截断（company-operations.html） | ✅ 已上线 | `570bb34` |
| **安全策略文档** | SECURITY_STRATEGY.md — 认证、多租户隔离、API 安全路线图 | ✅ 文档 | `ff6d3b4` |

### 2026-05 — AI Designer 增强与租户管控月（进行中）

| 功能 | 描述 | 状态 | 关键 Commit |
|------|------|------|------------|
| **Other Items 报价区块** | 报价编辑器新增 Other Items（与 Product Items / Accessories 同级） | ✅ 已上线 | `c556ecb` |
| **定价架构文档** | PRICING_ARCHITECTURE.md — SKU 价格生命周期统领文档 | ✅ 文档 | `ae1760a` |
| **ZB AI Designer 3-Image 流程** | Zip Blinds 专用 AI Designer（背景+前景+产品融合） | ✅ 已上线 | `c1a8568` |
| **AI Designer Inherited Data** | 从 Intake Data 自动继承设计参数 | ✅ 已上线 | `573c3c2` |
| **设计历史版本控制** | Design History Gallery + Supabase Storage 持久化 | ✅ 已上线 | `9d33e5d` |
| **租户级定价参数管控** | Quotation Formula Parameters 仅 Nestopia-CHN 可见可编辑 | ✅ 已上线 | `fa96903` `c4f7d5e` |
| **Per-Opening 成本明细隐藏** | 非 CHN 租户不可见 COGS/Market/Sell/Drive 行 | ✅ 已上线 | `c4f7d5e` |
| **Agent 平台规划对比** | AGENT_ROADMAP_COMPARISON.md — LZ 方案 vs Nestopia 现状 | ✅ 文档 | `5332a87` |

---

## 二、开发路线图 — 月度交付计划（Agent-First 聚焦版）

> 基于战略定位（北极星文档），**未来两个月聚焦四大 Agent 建设**，按月拆解交付。
> Agent 优先级顺序：**AI Designer → Quotation → Customer Service → Compliance**
> 所有 Agent 工作以 **6 月前 2 周完成安全加固（Auth + RLS）**为前提。

### 🟢 2026-06 — AI Designer Agent + Quotation Agent

#### 前提：平台安全基础（Week 1-2）

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| S.1 | **Supabase Auth + JWT 登录** | P0 | 真实认证替代硬编码密码 | 3 个租户可真实登录/登出 |
| S.2 | **RLS 生产策略激活** | P0 | 18 张表 + 存储桶全面加固 | 跨租户访问被 100% 拒绝 |

#### Agent 1: AI Designer Agent（Week 2-4）

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| D.1 | **提示词模板库** | P0 | 按产品×场景的标准化提示词 | 3 种产品 × 3 种场景 = 9 个模板 |
| D.2 | **LLM Image Edit 能力深化** | P0 | 继续完善 AI Designer 图像融合质量 | 3 个产品线融合效果达到 Demo 级 |
| D.3 | **融合质量提升** | P1 | 评估 ComfyUI / DALL-E 3 / SDXL | 10 张对比测试图 + 评分报告 |
| D.4 | **设计 A/B 对比视图** | P1 | 左右滑动比较不同设计方案 | 任意两版可并排比较 |

#### Agent 2: Quotation Agent（Week 3-4）

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| Q.1 | **设计+报价联动** | P0 | Step 2 设计结果 → 自动跳转 Step 4 报价 | 一键生成完整方案报价 |
| Q.2 | **方案 PDF 导出** | P1 | 效果图 + 报价明细 + 产品规格合并导出 | 单页 PDF 方案 |
| Q.3 | **B2B Demo 流程** | P1 | 3 个高质量案例跑通完整流程 | 合作伙伴 demo ≤ 15 分钟 |

### 🟡 2026-07 — Customer Service Agent + Compliance Agent

#### Agent 3: Customer Service Agent（Week 1-3）

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| C.1 | **pgvector + 文档分块管道** | P0 | 文档上传后自动分块 + 嵌入 | 20 份种子文档全部索引成功 |
| C.2 | **语义搜索 API** | P0 | `/api/kb/search` 余弦相似度检索 | top_k 结果与问题高度相关 |
| C.3 | **聊天机器人 RAG 集成** | P0 | 检索 → 注入 → 引用来源 | 20 个测试问题准确率 > 85% |
| C.4 | **引用来源展示** | P1 | 回复下方显示参考文档标签 | 点击可跳转到 KB 文档 |

#### Agent 4: Compliance Agent（Week 3-4）

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| P.1 | **合规检查框架** | P0 | 基础许可证/HOA/建筑规范检查 API | 输入地址 + 产品类型 → 返回合规风险 |
| P.2 | **Top 3 州规则库** | P1 | 马里兰 / 弗吉尼亚 / DC 建筑规范 | 3 州常见合规规则结构化入库 |
| P.3 | **合规报告生成** | P1 | 自动生成许可证申请所需文档清单 | 清单 PDF（含所需材料 + 费用估算） |

### 🔵 2026-08 — 规模化准备

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| 8.1 | **新租户 Onboarding 自动化** | P0 | 新分销商自助注册 + 产品线配置 | < 1 小时完成新租户上线 |
| 8.2 | **数据分析 Dashboard** | P1 | 关键运营指标（报价量/转化率/GMV） | Dashboard 页可视化 |
| 8.3 | **移动端优化** | P1 | 核心流程移动端可操作 | Step 1-4 手机端可完成 |
| 8.4 | **AI 测量 V1** | P2 | 照片 → 初步尺寸估算（±15%） | 基于 Qwen-VL 的基础估算 |

### 🟣 2026-09 — 视觉分析 + 业务闭环

| # | 事项 | 优先级 | 目标 | 验收标准 |
|---|------|--------|------|---------|
| 9.1 | **AI Designer 视觉分析** | P0 | 集成 Qwen-VL 自动场景分析 | 上传照片自动返回场景描述 + 推荐安装位置 |
| 9.2 | **订单管理基础** | P1 | 报价 → 确认 → 订单 → 状态跟踪 | 完整 Quote-to-Order 流程 |
| 9.3 | **合同生成** | P1 | 基于确认报价单自动生成合同 PDF | 含条款、签名位、有效期 |
| 9.4 | **客户管理增强** | P2 | CRM 基础（联系人、跟进记录、标签） | 客户 360° 视图页面 |
| 9.5 | **飞书/Lark 集成** | P2 | 项目状态变更通知 → 飞书群 | 核心流程事件自动推送 |

---

## 三、双周 Update 模板

> 每两周（双周）更新一次。格式固定，方便快速扫描。

---

### Sprint W19-W20 (2026-05-05 → 2026-05-18)

#### 📋 路线图变更
- 新增本文档 `DEVELOPMENT_ROADMAP.md`，建立月度交付计划与双周报机制
- 6 月计划聚焦 Agent-First：AI Designer → Quotation → Customer Service → Compliance
- 视觉分析(Qwen-VL)推迟至 9 月，6 月专注 LLM Image Edit 能力深化 + 提示词模板库

#### ✅ Done（本双周完成）
| 事项 | 关键细节 |
|------|---------|
| ZB AI Designer 3-Image 流程 | 新增 Zip Blinds 专用设计师面板（背景+前景+产品叠加） `c1a8568` |
| AI Designer Inherited Data | Step 1 Intake 数据自动填入 Step 2 设计参数 `573c3c2` |
| 设计历史版本控制 | 生成图保存到 Supabase Storage + 历史 Gallery + 版本管理 `9d33e5d` |
| Save to History UUID 修复 | normalizeProjectFromDB 增加 uuid 字段 `ac46876` |
| 租户级定价参数管控 | Quotation Formula Parameters 仅 Nestopia-CHN 可见可编辑 `fa96903` |
| Per-Opening 成本明细隐藏 | COGS/Market/Sell/Drive 行对非 CHN 租户不可见 `c4f7d5e` |
| 定价架构文档 | PRICING_ARCHITECTURE.md — SKU 价格生命周期统领文档 `ae1760a` |
| Other Items 报价区块 | 报价编辑器新增 Other Items `c556ecb` |
| Agent 平台规划对比文档 | LZ 方案 vs Nestopia 现状详细对比分析 `5332a87` |
| 路线图 v1.1 | Agent-First 聚焦版 + 双周更新机制 `0479596` |

#### 🔜 To Be Done（下双周计划 W21-W22）
| 事项 | 优先级 | 预期产出 |
|------|--------|---------|
| Supabase Auth Edge Functions 部署 | P0 | `auth-login` + `auth-middleware` 部署到 Supabase Cloud |
| 真实用户数据准备 | P0 | 3 个租户各 1 个管理员账户（bcrypt 密码） |
| 前端登录切换为真实认证 | P0 | JWT 登录替代硬编码密码规则 |

---

### Sprint W17-W18 (2026-04-21 → 2026-05-04)

#### ✅ Done
| 事项 | 关键细节 |
|------|---------|
| 安全策略文档 | SECURITY_STRATEGY.md — 认证、多租户隔离、API 安全路线图 `ff6d3b4` |
| 跨租户安全修复 | 3 层防护修复（路由 + 查询 + 渲染） `ece2630` |
| Qwen 模型优先级更新 | flash 首选 + 清理旧模型 `7928012` |
| 报价单品牌动态化 | 跟随项目 tenant_slug，Omeya 显示 Omeya logo `680c2cc` |
| 文件完整性守卫修复 | 修复 company-operations.html 截断导致的重大回归 `868a823` |
| Consumer Quotation Bug 修复 | Other Items 显示 + unitPrice 联动 `21b8daa` `10b91b3` |
| 飞书集成设计文档 | LARK_INTEGRATION_DESIGN.md — 28.4KB 完整设计 |
| B2B Operations UX 设计 | B2B_Operations_UX_Design.md — 67.4KB 综合设计稿 |
| 定价策略分析 | Pricing_Strategy_Analysis.md — 26.2KB |
| JS 重构策略 | JS_REFACTORING_STRATEGY.md — 38.1KB |

---

### Sprint W15-W16 (2026-04-07 → 2026-04-20)

#### ✅ Done
| 事项 | 关键细节 |
|------|---------|
| 多层定价链 Phase 1+2 | 数据层 + 平台批发定价管理界面 `4930205` |
| 分销商价格表功能 | 通知 + 导入 + 报价集成 `fd162b5` |
| 产品信息页集成分销商批发价 | Overview 页面展示批发价梯度 `a352dbf` |
| 回归测试套件文档 | REGRESSION_TEST_SUITE.md `docs` |
| 2 个月计划文档 | NEXT_2_MONTHS_PLAN.md 制定 |

---

## 四、关键指标追踪

| 指标 | 基线 (2026-05) | 目标 (2026-06) | 目标 (2026-08) |
|------|---------------|---------------|---------------|
| **租户数** | 3 (模拟登录) | 3 (真实认证) | 5+ |
| **产品线** | 3 (Sunroom/Pergola/ZB) | 3 | 4 (+ ADU) |
| **安全等级** | 🔴 POC | 🟢 生产级 | 🟢 生产级 |
| **AI Designer 质量** | 概念稿级 | 精品概念稿 | Demo "哇"级 |
| **聊天 RAG 准确率** | 0% (无 KB) | — | > 85% |
| **Commit 总量** | ~200+ | — | — |

---

## 五、架构决策记录 (ADR)

> 重大架构决策的简要记录，详情见对应文档。

| # | 日期 | 决策 | 详情文档 |
|---|------|------|---------|
| ADR-001 | 2026-03 | Vanilla JS + Cloudflare Pages（非 React/Vue） | `Strategic_Positioning.md` |
| ADR-002 | 2026-03 | Supabase 作为后端（Auth + DB + Storage） | `SUPABASE_ADOPTION.md` |
| ADR-003 | 2026-03 | DashScope API 优先于 ComfyUI 自部署 | `Agent/AGENT_ROADMAP_COMPARISON.md` |
| ADR-004 | 2026-04 | 多层定价链 4 层模型 (L0→L3) | `PRICING_ARCHITECTURE.md` |
| ADR-005 | 2026-04 | DNS 转移至 Cloudflare（支持 apex domain） | `PRODUCTION_DEPLOYMENT_STRATEGY.md` |
| ADR-006 | 2026-05 | 定价参数租户级管控（CHN → 分销商单向） | `PRICING_ARCHITECTURE.md` §2.2 |

---

## 六、文档关联

| 文档 | 与本文档关系 |
|------|------------|
| `Strategic_Positioning.md` | 北极星 — 路线图的战略输入 |
| `NEXT_2_MONTHS_PLAN.md` | 6-7 月的详细 Sprint 拆解（本文 §2 的实施层） |
| `PRICING_ARCHITECTURE.md` | 定价链功能的技术设计依据 |
| `SECURITY_STRATEGY.md` | 安全加固功能的技术设计依据 |
| `Agent/AGENT_ROADMAP_COMPARISON.md` | AI Agent 方案选型对比 |
| `B2B_Operations_UX_Design.md` | UX 设计稿（指导 UI 实现） |

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| 1.1.0 | 2026-05-18 | 压缩 6-7 月为 Agent-First 聚焦版：AI Designer → Quotation → Customer Service → Compliance |
| 1.0.0 | 2026-05-18 | 初版 — 建立月度交付全景 + 路线图 + 周报机制 |
