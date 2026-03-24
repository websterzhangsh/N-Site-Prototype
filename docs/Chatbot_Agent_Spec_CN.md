# Chatbot / 智能对话助手 Agent — 需求规格说明书

**版本**: 1.1.0  
**最后更新**: 2026-03-24  
**状态**: 实施中（MVP UI 已完成）  
**来源**: Nestopia 智能体战略白皮书 v2.2.0 第 7.5 节（基于 Larry Zhang 反馈 2026-03-15）  
**关联文档**:
- `docs/Nestopia智能体战略白皮书.md` (v2.2.0) — 战略白皮书
- `docs/business-workflow.md` (v2.1) — 六步法服务流程
- `docs/AI_Designer_Agent_Spec_CN.md` — AI Designer 规格
- `docs/Pricing_Cost_Controller_Agent_Spec.md` — 定价 Agent 规格
- `docs/Compliance_Manager_Agent_Spec.md` — 合规管理 Agent 规格
- `docs/Customer_Service_Executive_Agent_Spec.md` — 客服 Agent 规格

---

## 1. 概述

### 1.1 目的

Chatbot / 智能对话助手是 Nestopia 平台的**统一对话入口**，作为路由层 + 对话界面串联平台上所有 5 个 Agent（AI Designer、Pricing、Compliance、CS Executive、Knowledge Base）的能力。它不是简单的 FAQ 机器人，而是一个贯穿六步法全流程的**主动业务推进器**。

### 1.2 战略定位

<mark>**从"被动问答"到"主动业务推进器"。**</mark>

Chatbot 是经销商的"随身智囊"和客户的"24 小时专家顾问"。它是经销商日常使用频率最高的触点。

### 1.3 目标用户

| 用户类型 | 角色 | 使用场景 |
|---------|------|---------|
| **B 端经销商** | 主要用户 | 现场咨询、报价协助、合规查询、技术问答、客户管理 |
| **B 端安装团队** | 次要用户 | 安装技术问答、产品规格查询 |
| **C 端客户**（未来） | 远期用户 | 产品咨询、项目进度查询、售后支持 |

### 1.4 核心价值主张

- **产出导向**：不需要学习 5 个不同的 Agent 界面，一个对话框解决所有问题
- **差异化优势**：基于 Nestopia 聚合数据的行业专属智能，而非通用 ChatGPT 体验
- **零学习曲线**：用自然语言问，即时得到专业回答

### 1.5 核心设计原则

Chatbot **不替代**现有 5 个 Agent，而是作为**统一对话入口**：
- 不需要独立的 AI 模型
- 路由层识别意图，调用对应 Agent 能力
- Knowledge Base 提供上下文注入

---

## 2. 用户故事

### 2.1 核心用户故事

| ID | 用户故事 | 优先级 |
|----|---------|--------|
| US-001 | 作为经销商，我希望用自然语言提问并即时得到专业回答，而不需要在多个 Agent 界面之间切换 | P0 |
| US-002 | 作为经销商，我希望上传照片并问"这个院子能装什么"，Chatbot 自动调用 AI Designer 返回效果图 | P0 |
| US-003 | 作为经销商，我希望问"这个方案大概多少钱"，Chatbot 自动调用 Pricing Agent 返回三档报价 | P0 |
| US-004 | 作为经销商，我希望问"加州 Irvine 装阳光房需要什么许可"，Chatbot 返回合规清单 | P0 |
| US-005 | 作为经销商，我希望在客户深夜咨询时，Chatbot 即时回复并自动预约，次日我看到排好的日程 | P1 |
| US-006 | 作为安装团队，我希望现场遇到问题时拍照提问，Chatbot 即时给出技术指导 | P1 |

### 2.2 次要用户故事

| ID | 用户故事 | 优先级 |
|----|---------|--------|
| US-007 | 作为经销商，我希望 Chatbot 基于项目状态主动提醒"客户 A 的设计费已收 3 天，建议跟进" | P2 |
| US-008 | 作为经销商，我希望问"客户张先生上次说了什么"，Chatbot 返回对话历史和跟进建议 | P2 |
| US-009 | 作为经销商，我希望在报价谈判中问"客户砍价 15%，底线是多少"，得到智能建议 | P2 |
| US-010 | 作为经销商，我希望 Chatbot 支持语音输入，在现场操作时更方便 | P3 |

### 2.3 场景对比：有 vs 没有 Chatbot

| 场景 | 没有 Chatbot | 有 Chatbot |
|------|-------------|-----------|
| 客户深夜咨询 | 无人响应，线索流失 | 即时回复 + 自动预约，次日经销商看到排好的日程 |
| 经销商现场遇到问题 | 打电话问总部，等半天 | 拍照问 Chatbot → 即时合规建议 |
| 报价谈判僵持 | 凭经验降价，可能亏损 | 问 Chatbot → 基于 Pricing Agent 的智能底线建议 |
| 安装现场疑问 | 翻手册找答案 | 问 Chatbot → 即时技术回答 |

---

## 3. 功能需求

### 3.1 对话界面

#### 3.1.1 消息输入
| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-001 | 系统应提供文字输入框，支持多行输入和回车发送 | P0 |
| FR-002 | 系统应支持图片上传（拍照/选取相册），用于设计咨询和技术问答 | P0 |
| FR-003 | 系统应支持语音输入（语音转文字） | P3 |
| FR-004 | 系统应在输入框下方显示快捷提问建议（基于当前上下文） | P1 |

#### 3.1.2 消息展示
| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-005 | 系统应区分用户消息和 Chatbot 回复的视觉样式 | P0 |
| FR-006 | 系统应支持富文本回复（Markdown 表格、列表、加粗等） | P0 |
| FR-007 | 系统应支持图片/效果图内联显示 | P0 |
| FR-008 | 系统应显示消息时间戳 | P1 |
| FR-009 | 系统应在 AI 处理中显示"思考中…"动态指示器 | P0 |
| FR-010 | 系统应标注回复来源 Agent（如"来自 AI Designer"、"来自 Pricing Agent"） | P1 |

#### 3.1.3 对话管理
| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-011 | 系统应支持创建新对话 | P0 |
| FR-012 | 系统应保存对话历史，可随时查阅 | P0 |
| FR-013 | 系统应支持对话搜索（关键词） | P2 |
| FR-014 | 系统应支持对话归档和删除 | P2 |

### 3.2 意图识别与路由

#### 3.2.1 意图分类
| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-015 | 系统应自动识别用户意图并路由到对应 Agent | P0 |
| FR-016 | 系统应支持以下意图类别及对应路由 | P0 |

**意图路由映射表**：

| 意图类别 | 示例输入 | 路由到 | 返回结果 |
|---------|---------|--------|---------|
| 设计相关 | "帮我看看这张照片能装什么" | AI Designer | 实景融合效果图 |
| 报价相关 | "这个方案大概多少钱" | Pricing Agent | 三档报价 |
| 合规相关 | "加州 Irvine 装阳光房需要什么许可" | Compliance Agent | 合规清单 |
| 客户管理 | "客户张先生上次说了什么" | CS Agent | 对话历史和跟进建议 |
| 产品/技术 | "我们阳光房的防水等级是多少" | Knowledge Base | 产品规格回答 |
| 流程指引 | "下一步该做什么" | 六步法流程引擎 | 当前阶段指引 |
| 闲聊/兜底 | 无法识别的意图 | 通用 LLM | 友好引导回正题 |

#### 3.2.2 多轮对话
| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-017 | 系统应支持上下文连续对话（同一话题内多轮） | P0 |
| FR-018 | 系统应在意图切换时平滑过渡（如从设计问到报价） | P1 |
| FR-019 | 系统应在信息不足时主动追问（如"请上传庭院照片"） | P1 |

### 3.3 主动推进能力（高级阶段）

| 需求 ID | 需求描述 | 优先级 |
|---------|---------|--------|
| FR-020 | 系统应基于项目状态主动推送提醒（如"设计费已收 3 天，建议跟进"） | P2 |
| FR-021 | 系统应在关键节点主动推送建议（如"合规资料已齐全，建议提交申请"） | P2 |
| FR-022 | 系统应在客户沉默超过阈值时提醒经销商跟进 | P2 |

### 3.4 六步法流程集成

Chatbot 应贯穿六步法每个环节，提供阶段感知的智能支持：

| 六步法阶段 | Chatbot 支持能力 | 调用 Agent |
|-----------|-----------------|-----------|
| **Step 1** 客户首次接洽 | 回答产品 FAQ、推荐产品类型、预约上门 | Knowledge Base + CS Agent |
| **Step 2** AI 智能设计 | 接收照片、触发 AI 设计、讲解概念图 | AI Designer |
| **Step 3** 精确测量 | 查询测量注意事项、解答技术问题 | Knowledge Base |
| **Step 4** 报价与合同 | 协助报价谈判、解读合同条款、触发合规包 | Pricing Agent + Compliance Agent |
| **Step 5** 生产物流 | 查询生产进度、物流跟踪 | CS Agent |
| **Step 6** 安装验收 | 安装技术指导、合规文件确认、触发回访 | Knowledge Base + Compliance Agent + CS Agent |

---

## 4. 非功能需求

### 4.1 性能
| 需求 ID | 需求描述 | 目标 |
|---------|---------|------|
| NFR-001 | 基础问答响应时间 | <3 秒 |
| NFR-002 | Agent 路由 + 调用响应时间 | <8 秒（含 Agent 处理） |
| NFR-003 | 图片上传 + AI Designer 调用 | <35 秒（含设计生成） |
| NFR-004 | 对话历史加载 | <2 秒 |

### 4.2 可用性
| 需求 ID | 需求描述 |
|---------|---------|
| NFR-005 | 7×24 小时可用（核心价值：客户深夜咨询不流失） |
| NFR-006 | 99.5% 可用性 SLA |
| NFR-007 | 网络断开时缓存消息，恢复后自动同步 |

### 4.3 易用性
| 需求 ID | 需求描述 |
|---------|---------|
| NFR-008 | 零学习曲线，用自然语言即可使用 |
| NFR-009 | 移动端优先设计（经销商多在现场使用手机/平板） |
| NFR-010 | 支持中英文双语对话 |

### 4.4 安全性
| 需求 ID | 需求描述 |
|---------|---------|
| NFR-011 | 对话数据加密传输和存储 |
| NFR-012 | 租户隔离（RLS），经销商只能看到自己的对话 |
| NFR-013 | 敏感信息（客户手机、地址等）脱敏处理 |
| NFR-014 | 对话审计日志 |

---

## 5. 架构设计

### 5.1 系统架构

```
┌──────────────────────────────────────────────────────┐
│                Chatbot 对话界面                         │
│          （文字 / 语音 / 图片上传）                      │
│     Web App / Mobile App / 微信小程序（未来）            │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                意图识别 + 路由层                         │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ 设计相关  │ │ 报价相关  │ │ 合规 / 技术 / 客户   │  │
│  └─────┬────┘ └─────┬────┘ └──────────┬───────────┘  │
│        ▼            ▼                 ▼               │
│   AI Designer  Pricing Agent   Compliance Agent       │
│                                CS Agent               │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│            Knowledge Base（上下文注入层）                │
│   产品规格 · 合规法规 · 历史报价 · 六步法流程            │
└──────────────────────────────────────────────────────┘
```

### 5.2 核心组件

| 组件 | 职责 | 实现方式 |
|------|------|---------|
| **对话管理器** | 维护对话状态、上下文窗口、多轮记忆 | Session Store + Context Window |
| **意图识别器** | 分类用户意图，决定路由目标 | LLM Function Calling / Tool Use |
| **Agent 路由器** | 调用对应 Agent API，组装返回结果 | API Gateway + Agent SDK |
| **上下文注入器** | 从 Knowledge Base 获取相关上下文注入 Prompt | RAG / 文档检索 + Prompt 拼接 |
| **回复生成器** | 将 Agent 返回的结构化数据转化为自然语言回复 | LLM 格式化 |

### 5.3 LLM 策略

遵循白皮书**LLM 优先**原则：

| 阶段 | LLM 使用方式 | 说明 |
|------|-------------|------|
| **MVP** | GPT-4 / Claude API + System Prompt | 不微调，用 Prompt 工程 + Knowledge Base 文档注入 |
| **增强** | + Function Calling / Tool Use | LLM 自主决定调用哪个 Agent |
| **高级** | + 事件触发 + 主动推送 | 结合项目状态数据库，主动生成推送消息 |

---

## 6. 数据模型

### 6.1 对话会话
```typescript
interface ChatSession {
  id: string;
  tenantId: string;          // 租户隔离
  userId: string;            // 经销商用户 ID
  title: string;             // 对话标题（自动生成或用户命名）
  status: 'active' | 'archived';
  messages: ChatMessage[];
  context: {
    currentStep?: number;    // 当前六步法阶段（1-6）
    projectId?: string;      // 关联项目
    customerId?: string;     // 关联客户
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 聊天消息
```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contentType: 'text' | 'image' | 'rich' | 'action_card';
  attachments?: Attachment[];
  routing?: {
    intent: string;          // 识别的意图
    targetAgent: string;     // 路由到的 Agent
    agentResponse?: any;     // Agent 原始返回
  };
  timestamp: Date;
}
```

### 6.3 附件
```typescript
interface Attachment {
  id: string;
  type: 'image' | 'document' | 'design_render' | 'quote';
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}
```

### 6.4 主动推送消息
```typescript
interface ProactivePush {
  id: string;
  tenantId: string;
  userId: string;
  triggerEvent: string;      // e.g., 'design_fee_collected_3d_ago'
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'delivered' | 'read' | 'acted';
  scheduledAt: Date;
  deliveredAt?: Date;
}
```

---

## 7. API 端点

### 7.1 发送消息
```
POST /api/v1/chat/sessions/{sessionId}/messages
请求: { content, contentType, attachments? }
响应: { messageId, reply: ChatMessage, routing? }
```

### 7.2 创建对话
```
POST /api/v1/chat/sessions
请求: { projectId?, customerId?, initialMessage? }
响应: { sessionId, title, status }
```

### 7.3 获取对话历史
```
GET /api/v1/chat/sessions/{sessionId}/messages?page={page}&limit={limit}
响应: { messages: ChatMessage[], total, hasMore }
```

### 7.4 获取对话列表
```
GET /api/v1/chat/sessions?status={status}&page={page}
响应: { sessions: ChatSession[], total, hasMore }
```

### 7.5 获取主动推送
```
GET /api/v1/chat/pushes?status=pending
响应: { pushes: ProactivePush[] }
```

### 7.6 快捷提问建议
```
GET /api/v1/chat/suggestions?sessionId={sessionId}
响应: { suggestions: string[] }
```

---

## 8. 集成点

### 8.1 内部 Agent 集成

| Agent | 集成方式 | Chatbot 调用场景 |
|-------|---------|-----------------|
| **AI Designer** | API 调用 | 上传照片 → 生成效果图 / Site Plan |
| **Pricing Agent** | API 调用 | 询价 → 三档报价 / 利润底线建议 |
| **Compliance Agent** | API 调用 | 合规查询 → 清单 / HOA 限制 |
| **CS Agent** | API 调用 | 客户查询 → 对话历史 / 跟进建议 |
| **Knowledge Base** | 上下文注入 | 所有对话 → 产品规格 / 法规 / 流程 |

### 8.2 外部集成

| 系统 | 集成方式 | 用途 |
|------|---------|------|
| LLM API（GPT-4 / Claude / Qwen） | API | 意图识别 + 回复生成 |
| 项目管理数据库 | 数据读取 | 获取项目状态用于上下文注入和主动推送 |
| 消息推送服务 | Webhook | 主动推送通知（App / 邮件 / 短信） |

---

## 9. 成功指标

| 指标 | 目标 | 衡量方式 |
|------|------|---------|
| 基础问答准确率 | >90% | 抽样人工评估 |
| 意图识别准确率 | >85% | 路由日志分析 |
| 用户满意度 | >4.5/5 | 对话后评分 |
| 日活跃使用率（B 端） | >60% 经销商每日使用 | 使用日志 |
| Agent 路由调用成功率 | >95% | 系统日志 |
| 平均对话解决轮数 | <5 轮 | 对话分析 |
| **线索留存率提升** | +30%（深夜/非工作时间） | 对比有/无 Chatbot |

---

## 10. 分阶段实施路线图

### 阶段 1：MVP（1-2 月） — ✅ UI 已完成（2026-03-24）
- [x] 基础对话界面（Web）— 浮动气泡 + 全页面双模式
- [x] 文字输入 + 图片上传
- [ ] 基础问答：产品 FAQ、流程指引、合规常见问题 — ⏳ 需后端 KB 注入
- [ ] Knowledge Base 文档注入（System Prompt 方式）
- [x] LLM API 集成（已接 `/api/chat` Qwen，含 fallback）
- [x] 对话历史保存和查阅（前端会话管理）
- [x] 租户隔离（RLS）— 数据模型含 tenantId，待后端表

**MVP UI 交付物**（`company-operations.html`）：
- 浮动 FAB（🤖）+ 展开对话面板
- 全页面布局（左侧会话列表 + 右侧聊天区）
- 意图识别 + 5 Agent 路由 Badge（紫/绿/蓝/黄/灰）
- Quick Action 芯片（Design / Quote / Compliance / Customer / Product）
- 图片上传触发 AI Designer 流程
- 3 组预置 Demo 对话 + 打字指示器

**待后端集成**：对话持久化（chat_sessions + chat_messages 表）、KB 文档注入、真实 Agent API 路由。

### 阶段 2：智能路由（3-4 月）
- [ ] 意图识别引擎（LLM Function Calling）
- [ ] Agent 路由：设计 → AI Designer、报价 → Pricing Agent、合规 → Compliance Agent
- [ ] 多轮对话上下文管理
- [ ] 回复来源 Agent 标注
- [ ] 快捷提问建议
- [ ] 移动端适配

**增强交付标准**：经销商说"帮我报个价"，Chatbot 自动调用 Pricing Agent 返回报价。

### 阶段 3：主动推进（5-6 月）
- [ ] 项目状态感知（关联六步法阶段）
- [ ] 主动提醒推送（基于事件触发）
- [ ] 语音输入支持
- [ ] 对话数据分析仪表盘
- [ ] C 端客户对话界面（探索）

**高级交付标准**：Chatbot 主动提醒"客户 A 的设计费已收 3 天，建议跟进安排测量"。

---

## 11. 依赖项

| 依赖 | 类型 | 状态 | 备注 |
|------|------|------|------|
| LLM API（GPT-4 / Claude / Qwen） | 外部 | 可用 | MVP 核心依赖 |
| Knowledge Base 文档 | 内部 | 部分就绪 | 需 10-50 份关键文档（产品规格、合规 FAQ、流程指南） |
| AI Designer Agent API | 内部 | 开发中 | 阶段 2 依赖 |
| Pricing Agent API | 内部 | 开发中 | 阶段 2 依赖 |
| Compliance Agent API | 内部 | 开发中 | 阶段 2 依赖 |
| CS Agent API | 内部 | 开发中 | 阶段 2 依赖 |
| 项目管理数据库 | 内部 | 规划中 | 阶段 3 主动推送依赖 |
| 消息推送服务 | 外部 | 待选型 | 阶段 3 依赖 |

---

## 12. 风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| LLM 幻觉（生成错误的合规/报价信息） | 高 | Agent 返回结构化数据，Chatbot 仅做格式化展示；关键信息标注来源和免责 |
| 意图识别错误导致路由到错误 Agent | 中 | 允许用户手动切换 Agent；识别置信度低时主动确认"您是想问报价还是合规？" |
| 多轮对话上下文丢失 | 中 | 维护 Context Window（最近 N 轮 + 项目摘要）；超长对话自动总结 |
| Agent API 不可用导致 Chatbot 降级 | 中 | 优雅降级：Agent 不可用时切换到 Knowledge Base 基础问答 + 提示稍后重试 |
| 客户数据隐私泄露 | 高 | RLS 租户隔离、对话加密、敏感信息脱敏、审计日志 |
| 经销商对 AI 回答不信任 | 中 | 标注回复来源 Agent、显示数据依据、提供"联系人工"出口 |

---

## 13. 与其他 Agent 的关系

```
                    ┌─────────────────┐
                    │    Chatbot       │
                    │  (统一对话入口)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
      │ AI Designer  │ │ Pricing  │ │ Compliance   │
      │ (设计)       │ │ (报价)   │ │ (合规)       │
      └──────────────┘ └──────────┘ └──────────────┘
              │              │              │
      ┌───────▼──────┐      │              │
      │ CS Agent     │      │              │
      │ (客服)       │      │              │
      └──────────────┘      │              │
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │ Knowledge Base  │
                    │ (知识底座)       │
                    └─────────────────┘
```

**关键说明**：
- Chatbot 是**表现层**，其他 5 个 Agent 是**能力层**
- Knowledge Base 是所有 Agent（含 Chatbot）的**基础层**
- Chatbot 不产生独立业务逻辑，只做意图路由和结果格式化

---

## 14. 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| 1.0.0 | 2026-03-16 | 初始版本 — 基于白皮书 v2.2.0 第 7.5 节创建，覆盖完整需求规格 |
| 1.1.0 | 2026-03-24 | MVP UI 已实现 — B2B Chatbot 双模式（浮动气泡 + 全页面）嵌入 `company-operations.html`；更新阶段 1 交付状态；新增 MVP 交付物清单 |

---

**文档负责人**: 产品团队  
**审核周期**: 季度  
**下次审核**: Q2 2026  
**优先级**: **P1 — 高**（经销商日常使用频率最高的触点）

*本文档是 Chatbot / 智能对话助手 Agent 的完整需求规格说明。与战略白皮书 (docs/Nestopia智能体战略白皮书.md) 保持同步更新。*
