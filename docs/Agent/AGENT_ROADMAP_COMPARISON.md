# AI Agent 平台规划对比分析

> **版本**: 1.0.0  
> **创建日期**: 2026-05-15  
> **状态**: 参考文档  
> **对比对象**:  
> - LZ 架构规划 (`20260515 LZ generated AI-Agent-Platform-Architecture-Plan.docx`)  
> - LZ 10 周计划 (`20260515 LZ generated AI-Agent-Platform-2-Person-Team-10-Week-Plan.docx`)  
> - Nestopia 现有文档体系 (`AI_Agents_Strategy_Whitepaper_CN.md` + `NEXT_2_MONTHS_PLAN.md`)

---

## 1. 整体对比

| 维度 | LZ 架构规划 | LZ 10 周计划 | Nestopia 现有体系 |
|------|------------|-------------|-----------------|
| **定位** | 从零规划的完整架构蓝图 | 2 人团队 MVP 落地执行方案 | 已有代码基础的增量演进 |
| **目标市场** | 美国建筑商 (Dealers/Contractors) | 同左 | 美国 + 新加坡建筑商 |
| **产品线** | 阳光房、凉亭、Pergola | 同左 (10-15 款 SKU) | 阳光房 + Pergola + **Zip Blinds** (已实现) |
| **团队假设** | 未明确 | **2 人核心** (Tech Lead + AI 工程师) | **1 人** (Webster 全栈 + AI 辅助开发) |
| **技术栈** | React/Vue + PostgreSQL + Redis + ComfyUI | Refine.dev + PostgreSQL + ComfyUI + Docker | **Vanilla JS + Cloudflare Pages + Supabase + DashScope** (已上线) |
| **时间线** | Phase 1-3 (7-8 个月) | **10 周 MVP** | 8 周增量 Sprint (已进行中) |
| **当前状态** | 规划草案 (v1.0, 2026-05-14) | 规划草案 (v1.0, 2026-05-14) | **生产环境运行中** (ai-nestopia.com) |

---

## 2. Agent 维度对比

| Agent | LZ 方案 | Nestopia 现状 | 差距判断 |
|-------|---------|--------------|----------|
| **AI 客服 (Customer Service)** | Phase 1 必需，RAG FAQ 机器人 | ✅ 聊天机器人 UI 已完成，LLM 对接已上线（2C/2B 双模式） | Nestopia 已领先 |
| **AI 测量 (Measurement)** | 独立 Agent (CV + Photogrammetry + SAM-2 + Depth Anything) | ⚠️ 简化为 Step 3 手动输入 + 照片参考 | LZ 更激进，Nestopia 务实先行 |
| **Image Fusion (设计师)** | ComfyUI + ControlNet + IP-Adapter + 3D 渲染管线 | ✅ **已上线** — DashScope qwen-image-edit-max，SSE 流式，3 模型降级链 | 核心分歧点 (见 §3) |
| **Quotation (报价)** | 规则引擎 + LLM，对接 ERP | ✅ **已上线** — 完整 6 参数定价链 + 报价编辑器 + Consumer PDF | Nestopia 远超 LZ MVP |
| **Permit (合规/许可)** | Phase 3 上线 (Top 5 州覆盖) | 📋 Agent Spec 已写 (`Compliance_Manager_Agent_Spec.md`)，代码未实现 | 两者时间线一致 |
| **知识库 (KB/Knowledge Agent)** | 未单独规划 | ✅ KB UI + Supabase Storage 已完成，RAG (pgvector) 待上线 | Nestopia 更超前 |

---

## 3. 核心分歧：Image Fusion 技术路线

| 维度 | LZ 方案: ComfyUI 自部署 | Nestopia 现状: DashScope API |
|------|------------------------|--------------------------|
| **技术栈** | ComfyUI + ControlNet + IP-Adapter + Blender | 阿里云 qwen-image-edit-max/plus (云 API) |
| **部署方式** | Docker 自部署 (GPU 服务器) | 云 API 调用 (零 GPU 运维) |
| **质量控制** | 可完全调参，Bad case 针对性修复 | 依赖模型版本迭代 |
| **运维成本** | $500-1000/月 GPU + 专人维护 | 按量免费额度，当前 ¥0 |
| **团队需求** | 专职 AI 工程师 ¥15-25k/月 | 无需 AI 专人 |
| **效果上限** | 更高 (透视、光影、比例可精确控制) | 中等 (受限于 API 能力) |
| **MVP 速度** | 慢 (2 周才出第一张图) | ✅ **已出图上线** |
| **比例准确性** | 可基于 Measurement 数据精确控制 | 无法精确控制产品比例 |

### 判断

Nestopia 当前 DashScope 路线是 **正确的 MVP 选择** — 零 GPU 成本、零 AI 人力、已经上线。  
LZ 的 ComfyUI 路线在长期质量上限更高，适合业务验证成功后的 **Phase 2 质量升级**。

### 演进建议

```
当前 (Phase 1): DashScope API — 快速验证，零成本
     ↓ 验证 PMF 后
未来 (Phase 2): 评估 ComfyUI 自部署 — 需 AI 工程师 + GPU 预算
     ↓ 如果效果满足
长期: 混合模式 — 简单场景走 API，复杂场景走自部署
```

---

## 4. Quotation — Nestopia 已远超 LZ

| 维度 | LZ 方案 MVP | Nestopia 现状 |
|------|-------------|--------------|
| 定价模型 | 面积 × 基础单价 + 固定运费 (硬编码) | **完整 6 参数定价链** (供应商折扣→物流→安装→市场倍率→优惠折扣→配件加成) |
| SKU 体系 | "10-15 款写死单价" | ✅ 完整 SKU 目录 + 阶梯定价 + 面积计费规则 + 14 个业务参数 |
| 附加费 | 无 | ✅ 面料升级/高度附加费/木箱包装/Other Items |
| 报价单 | "简单 HTML → PDF" | ✅ 行项目编辑器 + Accessories + Other Items + Consumer PDF + 预览打印 |
| 价格快照 | 未提及 | ✅ Price-at-Quote 机制 (报价锁价，后续价变不影响已签发报价) |
| 多币种 | 未提及 | ✅ RMB→SGD 汇率转换，Consumer Quotation 自动换算 |
| 价目表版本化 | 未提及 | ✅ 架构已设计 (`PRICING_ARCHITECTURE.md`) |

---

## 5. LZ 方案中值得借鉴的新视角

| # | 亮点 | 说明 | 可融入度 |
|---|------|------|:---:|
| 1 | **Project 状态机明确化** | `lead → measuring → designing → quoting → permitting → won / lost` | ✅ 可增加 won/lost 状态 |
| 2 | **Measurement Agent: 置信度评分** | AI 测量低于阈值时强制人工复核 (`confidence_score`) | ✅ 未来升级可采纳 |
| 3 | **Fusion 基于 Measurement 保比例** | 融合结果比例失真会导致报价和许可材料出错 | ⚠️ 当前 API 无法实现 |
| 4 | **工作流引擎演进路径** | 轻量编排 → LangGraph → Temporal → n8n | 📋 Phase 2+ 参考 |
| 5 | **每周五互相演示 (Weekly Demo)** | 2 人团队对齐机制 | ✅ 管理实践 |
| 6 | **ComfyUI 应急顾问备案** | AI 工程师 3 周未出图则请外援，不拖 | 📋 招聘参考 |
| 7 | **Permit: Top 20 市场优先** | 按市场重要性分批覆盖，不追求全量 | ✅ 符合现有策略 |
| 8 | **数据模型: Permit jurisdiction_id** | 对应法规库中的管辖实体标识 | 📋 未来实现参考 |
| 9 | **SAM 辅助区域识别** | Segment Anything 自动识别草地/建筑/天空边界 | 📋 Phase 2 升级 |
| 10 | **Agent 间通信: PostgreSQL + Redis + HTTP callback** | 清晰的异步通信方案 | 📋 Nestopia 当前同步即可 |

---

## 6. LZ 方案的数据模型设计（参考价值）

LZ 定义了以 Project 为核心的结构化数据模型，以下字段在 Nestopia 现有模型中缺失但有参考价值：

```javascript
// Measurement Agent 产出物（Nestopia 未来可采纳）
measurement: {
    dimensions: { length, width, height, area_sqft },
    terrain: 'flat' | 'slope' | 'uneven',
    obstacles: [{ type: 'tree' | 'utility' | 'fence', position: {...} }],
    photos: [{ url, annotated_url }],
    confidence_score: 0.85  // ★ 低于阈值转人工复核
}

// Permit Agent 产出物（Nestopia 未来可采纳）
permit: {
    jurisdiction_id: 'CA-LosAngeles-CityCenter',
    required_docs: ['structural_drawing', 'site_plan', 'rendering'],
    generated_docs: [{ doc_type, url }],
    submission_status: 'not_started' | 'ready' | 'submitted' | 'approved' | 'rejected',
    notes: ''
}

// Image Fusion 多变体设计（Nestopia 部分已实现）
fusion_images: [{
    variant_id: 'uuid',
    image_url: '...',
    product_config: { sku, color, roof_type, addons: [] },
    view_angle: 'front' | 'side' | 'aerial',
    time_of_day: 'day' | 'dusk' | 'night'
}]
```

---

## 7. LZ 10 周计划关键里程碑

| 周次 | Tech Lead | AI 工程师 | 里程碑 |
|:---:|-----------|-----------|--------|
| W1-2 | 后端架构 + Portal 骨架 (Refine.dev) | ComfyUI 本地部署 + 跑通第一张融合图 | 能登录 + 能出图 |
| W3-5 | 业务 API + 前端 + 异步任务队列 | ControlNet + IP-Adapter + Docker 化 | 主流程跑通 |
| W6-7 | Canvas 标注 + Quotation PDF | SAM 辅助 + Bad case 攻坚 | 完整闭环 |
| W8-9 | 集成测试 + 性能优化 + 安全加固 | 稳定性 + 监控 + 效果固化 | 准备试用 |
| W10 | 生产部署 + 种子客户 | 现场支持 + 调参 | **MVP 上线** |

**预估成本**: ¥6-11 万 / 10 周（不含 Tech Lead 薪资）

---

## 8. 核心结论

| 结论 | 说明 |
|------|------|
| 🟢 **Nestopia 已领先 LZ 方案 1-2 个 Phase** | AI 设计师已上线、报价系统已完善、KB 存储已就位、聊天机器人已对接 LLM |
| 🟢 **LZ 方案验证了 Nestopia 方向正确** | 五大 Agent 定位一致，业务流程几乎完全吻合 |
| 🟡 **技术路线分歧在 Image Fusion** | DashScope API (现在) vs ComfyUI 自部署 (长期)，建议验证后再决策 |
| 🟡 **Measurement Agent 值得独立化** | Nestopia 当前将测量嵌入 Step 3 手动输入，未来可引入 CV 辅助 |
| 🟡 **LZ 前端选型与 Nestopia 不同** | Refine.dev vs Vanilla JS，已上线系统无需切换 |
| 🔴 **LZ 方案低估了已有进展** | 多处标注 "Phase 1 待做" 的能力在 Nestopia 中已实现并在生产环境运行 |

---

## 9. 建议行动

1. **将 LZ 文档归档为参考** — 不作为执行计划，而是作为未来扩展参考
2. **继续执行 `NEXT_2_MONTHS_PLAN.md`** — 基于实际代码现状的增量路线图
3. **长期标记**: 当 DashScope 效果无法满足客户预期时，重新评估 ComfyUI 自部署
4. **提取数据模型参考**: `measurement.confidence_score`、`permit.jurisdiction_id`、`fusion_images[].view_angle` 在未来实现时可复用
5. **招聘 AI 工程师时参考**: LZ 的画像定义 (1-3 年经验，必须有 ComfyUI 实操) 和应急机制 (3 周未出图请顾问) 有实操价值

---

## 10. 文档关联

| 文档 | 位置 | 关系 |
|------|------|------|
| AI Agent 战略白皮书 | `docs/AI_Agents_Strategy_Whitepaper_CN.md` | Nestopia 的北极星 Agent 文档 |
| 未来 2 月实施计划 | `docs/NEXT_2_MONTHS_PLAN.md` | 当前执行中的 Roadmap |
| LZ 架构规划 | `docs/Agent/20260515...Architecture-Plan.docx` | 外部参考 — 完整架构蓝图 |
| LZ 10 周计划 | `docs/Agent/20260515...10-Week-Plan.docx` | 外部参考 — 2 人团队 MVP 落地 |
| AI 设计师规格 | `docs/AI_Designer_Agent_Spec_CN.md` | Image Fusion Agent 详细规格 |
| 定价架构 | `docs/PRICING_ARCHITECTURE.md` | Quotation Agent 的定价逻辑基础 |
| ZB KB 设计 | `docs/ZB_KB_KNOWLEDGE_AGENT_DESIGN.md` | Knowledge Agent + RAG 架构 |
| LLM System Prompts | `docs/LLM_System_Prompts.md` | 所有 Agent 的 Prompt 与模型配置 |

---

*本文档为 LZ 方案与 Nestopia 现有体系的对比分析，旨在归档外部输入并提取可借鉴价值。*
