# Nestopia × 飞书（Lark）集成设计文档

> **版本:** 1.0 | **日期:** 2026-04-21 | **状态:** 设计阶段  
> **作者:** Webster / Qoder  
> **关联文档:** [STORAGE_STRATEGY.md](STORAGE_STRATEGY.md), [DATA_AI_STRATEGY.md](DATA_AI_STRATEGY.md), [SUPABASE_ADOPTION.md](SUPABASE_ADOPTION.md)

---

## 1. 背景与目标

### 1.1 业务背景

Nestopia 的 Tech Sales / 安装团队在日常项目执行中，大量使用**飞书 (Lark)** 进行内部沟通。每个客户项目通常对应一个或多个飞书群聊，团队在群里分享：

- **现场勘测照片** — 后院全景、安装位置、障碍物
- **量尺视频** — 实地走访过程、测量细节
- **产品参考图** — 客户选定的款式、颜色
- **安装过程记录** — 施工进度、质量检查
- **文字讨论** — 技术问题、客户需求变更

这些宝贵的项目资料目前散落在各个飞书群聊中，**无法与 Nestopia 平台的项目记录关联**，导致：

1. 信息检索困难 — 需要翻阅大量聊天记录
2. 知识沉淀缺失 — 项目结束后资料难以系统化归档
3. AI 能力受限 — 项目相关的视觉资料无法被 AI Designer / Knowledge Agent 利用

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **G1 — 自动采集** | 飞书群聊中的图片、视频、文件自动同步到 Nestopia 对应项目 |
| **G2 — 项目关联** | 每个飞书群聊映射到一个 Nestopia 项目，建立清晰的数据归属 |
| **G3 — 集中展示** | 在 Nestopia Dashboard 中集中查看项目所有来自飞书的资料 |
| **G4 — AI 赋能** | 采集的现场照片可直接用于 AI Designer、知识库等 AI 能力 |
| **G5 — 双向通知** | Nestopia 平台的关键状态变更可推送卡片消息到飞书群 |

---

## 2. 技术架构

### 2.1 整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                        飞书 (Lark) 端                           │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ 项目 A 群聊    │  │ 项目 B 群聊    │  │ 项目 C 群聊    │       │
│  │ 📷🎥💬        │  │ 📷🎥💬        │  │ 📷🎥💬        │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                │
│                             │                                    │
│                    Nestopia Bot (应用机器人)                     │
│                    事件订阅: im.message.receive_v1               │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS Event Push
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages Function                     │
│                                                                  │
│  /api/lark/webhook          ← 事件接收 + 签名验证               │
│  /api/lark/register-chat    ← 群聊 ↔ 项目绑定                  │
│  /api/lark/send-card        ← 主动推送卡片消息                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Lark Event Handler (核心处理流程)                    │        │
│  │                                                       │        │
│  │  1. 解析事件 → 提取 chat_id + message_type           │        │
│  │  2. 查询 lark_chat_mapping → 找到 project_key        │        │
│  │  3. 根据 message_type 分发:                           │        │
│  │     - text   → 存入 project_media (文字记录)          │        │
│  │     - image  → 下载原图 → 上传 Storage → 存元数据     │        │
│  │     - media  → 下载视频 → 上传 Storage → 存元数据     │        │
│  │     - file   → 下载文件 → 上传 Storage → 存元数据     │        │
│  │  4. 返回 200 OK (3 秒内)                              │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────┬──────────────────────┬────────────────────────┘
                   │                      │
                   ▼                      ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│   Supabase PostgreSQL    │  │   Supabase Storage / R2        │
│                          │  │                                │
│  lark_chat_mapping       │  │  /projects/{project_key}/      │
│  project_media           │  │    /lark/                      │
│  lark_bot_config         │  │      {timestamp}_{filename}    │
│                          │  │      {timestamp}_{filename}    │
└──────────────────────────┘  └────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Nestopia Dashboard                             │
│                                                                  │
│  项目详情页 → "Site Media" Tab                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  📷 现场照片 (12)  │  🎥 视频 (3)  │  📄 文件 (5)    │       │
│  │  ┌───┐ ┌───┐ ┌───┐│               │                │       │
│  │  │   │ │   │ │   ││               │                │       │
│  │  └───┘ └───┘ └───┘│               │                │       │
│  └──────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 飞书 Bot 配置

| 配置项 | 值 |
|-------|-----|
| **应用类型** | 企业自建应用 (Custom App) |
| **Bot 能力** | 开启 — 允许加入群聊 |
| **事件订阅方式** | **HTTP 请求地址** (Webhook) — 适配 Cloudflare Workers 无服务器架构 |
| **订阅事件** | `im.message.receive_v1` (接收消息) |
| **权限范围** | `im:message` (读取消息), `im:message:send` (发送消息), `im:chat` (群聊信息), `im:resource` (下载资源) |
| **Webhook URL** | `https://n-site-prototype.pages.dev/api/lark/webhook` (Staging) |

### 2.3 认证机制

```
飞书开放平台
    │
    │ app_id + app_secret
    ▼
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
    │
    │ 返回 tenant_access_token (有效期 2 小时)
    ▼
Cloudflare Worker 缓存 token
    │ 过期前自动刷新
    │
    │ Authorization: Bearer {tenant_access_token}
    ▼
调用飞书 API (下载资源、发送消息等)
```

**Token 缓存策略**：
- 使用 Cloudflare KV 或内存缓存存储 `tenant_access_token`
- 设置 TTL = 110 分钟（token 有效期 120 分钟，提前 10 分钟刷新）
- 每次 API 调用前检查 token 是否过期

---

## 3. 数据模型

### 3.1 数据库表设计

```sql
-- ============================================================
-- 表 1: 飞书群聊 ↔ Nestopia 项目映射
-- ============================================================
CREATE TABLE lark_chat_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    chat_id TEXT NOT NULL,                -- 飞书群聊 ID (oc_xxxxx)
    project_key TEXT NOT NULL,            -- Nestopia 项目 ID
    chat_name TEXT,                       -- 群聊名称（冗余，便于展示）
    bot_added_at TIMESTAMPTZ,             -- Bot 被添加到群的时间
    is_active BOOLEAN DEFAULT true,       -- 是否仍在监听
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, chat_id)
);

-- 索引: 按 chat_id 快速查找项目
CREATE INDEX idx_lark_chat_mapping_chat_id ON lark_chat_mapping(chat_id);
CREATE INDEX idx_lark_chat_mapping_project ON lark_chat_mapping(tenant_id, project_key);

-- ============================================================
-- 表 2: 项目媒体资料（统一存储来自所有来源的项目媒体）
-- ============================================================
CREATE TABLE project_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_key TEXT NOT NULL,
    
    -- 来源信息
    source TEXT NOT NULL DEFAULT 'lark',  -- 'lark' | 'upload' | 'ai_generated'
    media_type TEXT NOT NULL,             -- 'image' | 'video' | 'file' | 'text'
    
    -- 文件信息
    storage_path TEXT,                    -- Supabase Storage 路径
    storage_url TEXT,                     -- 公开/签名 URL
    file_name TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,                       -- 'image/jpeg', 'video/mp4' 等
    
    -- 飞书来源特有字段
    lark_message_id TEXT,                 -- 飞书消息 ID（用于去重）
    lark_chat_id TEXT,
    lark_file_key TEXT,                   -- 飞书资源 key
    sender_name TEXT,                     -- 发送者姓名
    sender_open_id TEXT,                  -- 发送者 open_id
    message_text TEXT,                    -- 文字消息内容 / 图片附带说明
    
    -- 业务标签
    tags JSONB DEFAULT '[]',             -- ['backyard', 'measurement', 'installation']
    workflow_step INTEGER,                -- 关联的工作流步骤 (1-6)
    
    -- 时间戳
    collected_at TIMESTAMPTZ DEFAULT now(),
    lark_created_at TIMESTAMPTZ,          -- 飞书端消息创建时间
    
    -- 元数据
    metadata JSONB DEFAULT '{}',          -- EXIF、尺寸、时长等

    UNIQUE(tenant_id, lark_message_id)    -- 飞书消息去重
);

-- 索引: 按项目查询、按类型筛选
CREATE INDEX idx_project_media_project ON project_media(tenant_id, project_key);
CREATE INDEX idx_project_media_type ON project_media(media_type);
CREATE INDEX idx_project_media_source ON project_media(source);
CREATE INDEX idx_project_media_lark_msg ON project_media(lark_message_id);

-- ============================================================
-- 表 3: Bot 配置（存储 app 凭证和 token 缓存）
-- ============================================================
CREATE TABLE lark_bot_config (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    app_id TEXT NOT NULL,
    app_secret_encrypted TEXT NOT NULL,   -- 加密存储
    verification_token TEXT,              -- 事件订阅验证 token
    encrypt_key TEXT,                     -- 事件加密 key
    tenant_access_token TEXT,             -- 缓存的 access token
    token_expires_at TIMESTAMPTZ,         -- token 过期时间
    webhook_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 存储路径规范

```
Supabase Storage / Bucket: project-media
└── {tenant_id}/
    └── {project_key}/
        └── lark/
            ├── img_20260421_143022_oc7a8b.jpg      (图片)
            ├── vid_20260421_150530_oc7a8b.mp4      (视频)
            ├── file_20260421_151200_oc7a8b.pdf     (文件)
            └── ...
```

命名规则: `{type}_{YYYYMMDD}_{HHmmss}_{chat_id_suffix}.{ext}`

---

## 4. 核心流程

### 4.1 流程 1: 群聊绑定项目

```
Tech Sales 操作 Nestopia Dashboard
    │
    │ 在项目设置页选择 "Link Lark Chat"
    │ 输入群聊链接 / chat_id / 或扫码
    ▼
POST /api/lark/register-chat
    body: { project_key, chat_id, tenant_id }
    │
    ├── 验证 chat_id 有效 (调用飞书 API)
    ├── 检查 Bot 是否已在该群 (若否，提示先添加 Bot)
    ├── 写入 lark_chat_mapping 表
    └── 返回成功 → Dashboard 显示 "✓ Linked"
```

**备选方案 (更简单)**:
- Bot 被添加到群聊时，自动触发 `im.chat.member.bot.added_v1` 事件
- Bot 发送欢迎卡片，卡片中包含项目选择下拉框
- 用户在卡片中选择项目 → 自动完成绑定

### 4.2 流程 2: 消息采集 (核心流程)

```
用户在飞书群聊发送图片
    │
    │ 飞书开放平台推送事件
    ▼
POST /api/lark/webhook
    │
    │ ① 签名验证 / challenge 校验
    │
    │ ② 解析事件体
    │    event.message.chat_id → "oc_xxxxx"
    │    event.message.message_type → "image"
    │    event.message.content → { "image_key": "img_v3_xxxx" }
    │    event.message.message_id → "om_xxxxx"
    │    event.sender.sender_id.open_id → "ou_xxxxx"
    │
    │ ③ 查询 lark_chat_mapping
    │    WHERE chat_id = "oc_xxxxx" AND is_active = true
    │    → 找到 project_key = "bay-area-office"
    │
    │ ④ 去重检查
    │    SELECT 1 FROM project_media
    │    WHERE lark_message_id = "om_xxxxx"
    │    → 若已存在则跳过
    │
    │ ⑤ 下载资源
    │    GET /im/v1/messages/{message_id}/resources/{image_key}?type=image
    │    Authorization: Bearer {tenant_access_token}
    │    → 返回二进制图片数据
    │
    │ ⑥ 上传到 Supabase Storage
    │    PUT /storage/v1/object/project-media/{tenant_id}/{project_key}/lark/{filename}
    │    → 返回 storage_path
    │
    │ ⑦ 写入 project_media 表
    │    INSERT INTO project_media (
    │      tenant_id, project_key, source, media_type,
    │      storage_path, lark_message_id, lark_chat_id,
    │      sender_name, collected_at
    │    )
    │
    │ ⑧ 返回 200 OK（必须 3 秒内响应）
    ▼
飞书确认事件已消费
```

**3 秒超时处理**:
- Webhook 端点必须在 3 秒内返回 200
- 耗时操作（下载大文件、上传 Storage）通过异步处理：
  - **方案 A**: 先返回 200，用 `waitUntil()` (Cloudflare Workers API) 继续后台处理
  - **方案 B**: 先写入队列表 `lark_message_queue`，由定时 Worker 批量处理

### 4.3 流程 3: 主动推送消息到飞书

```
Nestopia 平台状态变更（例：报价单生成完成）
    │
    ├── 查询 lark_chat_mapping → 找到关联的 chat_id
    │
    ├── 构建飞书交互卡片 (Interactive Card)
    │   {
    │     "header": { "title": "Quotation Ready 📋" },
    │     "elements": [
    │       { "tag": "markdown", "content": "Bay Area Office 项目报价已生成..." },
    │       { "tag": "action", "actions": [
    │         { "tag": "button", "text": "View in Nestopia", "url": "https://..." }
    │       ]}
    │     ]
    │   }
    │
    └── POST /im/v1/messages?receive_id_type=chat_id
        body: { receive_id: "oc_xxxxx", msg_type: "interactive", content: card }
```

**推送触发场景**:

| 触发事件 | 推送内容 | 优先级 |
|---------|---------|--------|
| 报价单生成完成 | 卡片：金额摘要 + "查看详情" 按钮 | P1 |
| AI 设计效果图生成 | 卡片：缩略图 + "查看/下载" 按钮 | P1 |
| 项目工作流步骤推进 | 卡片：新步骤名称 + 负责人 | P2 |
| 量尺验证差异预警 | 卡片：差异值 + 颜色标记 | P2 |
| 安装预约确认 | 卡片：日期时间 + 地址 | P2 |

---

## 5. 消息类型处理细节

### 5.1 支持的消息类型

| message_type | content 结构 | 资源下载方式 | 存储格式 |
|-------------|-------------|-------------|---------|
| `text` | `{ "text": "..." }` | 无需下载 | 仅存入 `message_text` 字段 |
| `image` | `{ "image_key": "img_v3_xxx" }` | `GET /messages/{id}/resources/{image_key}?type=image` | JPEG/PNG → Storage |
| `media` (视频) | `{ "file_key": "file_v3_xxx", "image_key": "..." }` | `GET /messages/{id}/resources/{file_key}?type=file` | MP4 → Storage |
| `file` | `{ "file_key": "file_v3_xxx", "file_name": "..." }` | `GET /messages/{id}/resources/{file_key}?type=file` | 原格式 → Storage |
| `post` (富文本) | `{ "title": "...", "content": [[...]] }` | 解析内嵌图片 → 逐个下载 | 文字 + 图片分别存储 |
| `sticker` | `{ "file_key": "..." }` | ⏭️ 跳过（表情包无业务价值） | — |
| `audio` | `{ "file_key": "..." }` | Phase 2: 下载 + 可选转文字 | — |

### 5.2 Phase 1 — 优先处理

- ✅ `image` — 最高价值，现场照片
- ✅ `text` — 简单存储，可用于上下文
- ✅ `file` — PDF、CAD 文件等
- ⏸️ `media` (视频) — 文件较大，Phase 2 处理
- ⏭️ `sticker` / `audio` — 暂不处理

---

## 6. 安全设计

### 6.1 事件验证

飞书 Webhook 支持两种验证方式：

**方式 1: Verification Token**
```javascript
// 首次配置时，飞书发送 challenge 请求
if (body.type === 'url_verification') {
    return { challenge: body.challenge };
}

// 后续事件验证 token
if (body.header.token !== VERIFICATION_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
}
```

**方式 2: 签名验证 (推荐)**
```javascript
const timestamp = request.headers.get('X-Lark-Request-Timestamp');
const nonce = request.headers.get('X-Lark-Request-Nonce');
const signature = request.headers.get('X-Lark-Signature');

const content = timestamp + nonce + ENCRYPT_KEY + body;
const expected = sha256(content);

if (signature !== expected) {
    return new Response('Forbidden', { status: 403 });
}
```

### 6.2 数据隔离

- **多租户隔离**: 所有表都包含 `tenant_id`，配合 Supabase RLS 策略
- **Bot 凭证加密**: `app_secret` 使用加密存储，不以明文保存
- **Token 最小权限**: 仅申请必要的飞书权限范围
- **Storage 访问控制**: 项目媒体文件使用签名 URL（非公开）

### 6.3 速率限制

| 飞书 API | 限制 | 应对策略 |
|---------|------|---------|
| 获取 tenant_access_token | 无明确限制 | 缓存 token，避免频繁请求 |
| 下载消息资源 | 50 QPS/app | 队列化处理，批量下载间隔 |
| 发送消息 | 100 条/分钟/app | 合并通知，避免频繁推送 |

---

## 7. Dashboard UI 设计

### 7.1 项目详情页 — "Site Media" Tab

```
┌─────────────────────────────────────────────────────────┐
│  Bay Area Office — E... │ Step 3: Measurement & Design   │
├─────────────────────────────────────────────────────────┤
│  Overview │ Workflow │ AI Designer │ Site Media │ Docs   │
│                        ──────────                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📷 Photos (12)  🎥 Videos (3)  📄 Files (5)    │    │
│  │ Source: All ▾   │  Sort: Newest ▾               │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │    │
│  │  │     │ │     │ │     │ │     │               │    │
│  │  │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │               │    │
│  │  │     │ │     │ │     │ │     │               │    │
│  │  └─────┘ └─────┘ └─────┘ └─────┘               │    │
│  │  Apr 21   Apr 20   Apr 18   Apr 18              │    │
│  │  by Tom   by Lisa  by Tom   by Tom              │    │
│  │  🏷 backyard       🏷 measurement               │    │
│  │                                                  │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │    │
│  │  │ ▶   │ │     │ │     │ │     │               │    │
│  │  │ 🎥  │ │ 📷  │ │ 📷  │ │ 📷  │               │    │
│  │  │     │ │     │ │     │ │     │               │    │
│  │  └─────┘ └─────┘ └─────┘ └─────┘               │    │
│  │  Apr 15   Apr 14   Apr 14   Apr 12              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌ Lark Chat Link ─────────────────────────────────┐    │
│  │  ✓ Linked to: "Bay Area Office 项目群"           │    │
│  │  Last sync: 2 minutes ago │ 20 items collected   │    │
│  │  [Unlink]  [Open in Lark]                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 7.2 交互功能

| 功能 | 描述 |
|------|------|
| **网格/列表视图** | 缩略图网格 or 带元信息的列表 |
| **按类型筛选** | 图片 / 视频 / 文件 / 全部 |
| **按来源筛选** | Lark / 手动上传 / AI 生成 |
| **标签管理** | 给媒体打标签 (backyard, measurement, installation...) |
| **全屏预览** | 点击图片打开灯箱，支持左右滑动 |
| **下载** | 单个下载 or 批量打包下载 |
| **用于 AI Designer** | 右键菜单 → "Use as Backyard Photo" 直接送入 AI Designer |
| **时间线视图** | 按日期分组展示，类似相册时间线 |

---

## 8. 实施计划

### Phase 1 — 基础管道 (1-2 周)

| 任务 | 工作内容 |
|------|---------|
| **1.1** | 飞书开放平台创建企业自建应用，开启 Bot，配置权限 |
| **1.2** | 实现 `/api/lark/webhook` Cloudflare Pages Function — challenge 验证 + 事件接收 |
| **1.3** | 实现 `tenant_access_token` 获取与缓存逻辑 |
| **1.4** | 创建 `lark_chat_mapping` + `project_media` 数据库表 |
| **1.5** | 实现图片消息处理: 接收事件 → 下载图片 → 存储 → 写入元数据 |
| **1.6** | 实现群聊绑定 API (`/api/lark/register-chat`) |
| **验收标准** | Bot 加入测试群，发图片后 Supabase Storage 能看到对应文件 |

### Phase 2 — 完善采集 (1-2 周)

| 任务 | 工作内容 |
|------|---------|
| **2.1** | 支持文本消息、文件消息采集 |
| **2.2** | 支持视频消息采集（大文件异步处理） |
| **2.3** | 支持富文本消息 (post) 解析与内嵌图片提取 |
| **2.4** | 事件去重、幂等性保障 |
| **2.5** | 错误处理与重试机制 |
| **验收标准** | 所有主要消息类型均能正确采集，无丢失无重复 |

### Phase 3 — Dashboard 展示 (1-2 周)

| 任务 | 工作内容 |
|------|---------|
| **3.1** | 项目详情页新增 "Site Media" Tab |
| **3.2** | 图片/视频网格展示 + 灯箱预览 |
| **3.3** | 筛选、排序、标签管理 |
| **3.4** | Lark Chat 绑定管理 UI |
| **3.5** | 集成到 AI Designer（"Use as Photo" 功能） |
| **验收标准** | Dashboard 中可完整查看和管理所有从 Lark 采集的项目资料 |

### Phase 4 — 双向通知 (1 周)

| 任务 | 工作内容 |
|------|---------|
| **4.1** | 实现飞书交互卡片模板 |
| **4.2** | 关键业务事件触发推送（报价完成、设计生成、步骤推进） |
| **4.3** | 推送频率控制与合并策略 |
| **验收标准** | Nestopia 状态变更后 5 秒内飞书群收到卡片通知 |

---

## 9. 技术依赖与风险

### 9.1 依赖项

| 依赖 | 当前状态 | 所需操作 |
|------|---------|---------|
| 飞书开放平台账号 | ❓ 待确认 | 需要在飞书管理后台创建企业自建应用 |
| Supabase Storage Bucket | ❓ 未创建 | 创建 `project-media` bucket |
| Cloudflare Pages Functions | ✅ 已有 | 新增 `/api/lark/*` 路由 |
| Supabase PostgreSQL | ✅ 已有 | 新增 3 张表 |

### 9.2 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **飞书 Webhook 3 秒超时** | 大文件下载+上传可能超时 | 使用 `waitUntil()` 异步处理 or 队列 |
| **视频文件过大** | 单视频 30-100MB，Storage 容量 | Phase 1 不处理视频；Phase 2 设置大小限制 |
| **飞书 API 速率限制** | 高峰时可能限流 | 队列化 + 指数退避重试 |
| **多租户飞书账号** | 不同租户可能用不同飞书组织 | `lark_bot_config` 支持每租户独立配置 |
| **Supabase 免费层存储限制** | 1GB Storage | 图片压缩 + 按需升级 Pro |

---

## 10. 与现有系统的集成点

| 现有模块 | 集成方式 |
|---------|---------|
| **AI Designer (Step 2)** | Site Media 中的照片可直接选为 Backyard Photo 或 Product Reference |
| **Measurement (Step 1/3)** | 现场量尺照片自动归类到对应步骤 |
| **Knowledge Base** | 从 Lark 收集的 PDF/文件可导入 KB |
| **Project CRUD** | 新建项目时可同步创建飞书群 + 添加 Bot |
| **Quotation (Step 4)** | 报价完成后推送卡片到飞书群 |

---

## 附录 A: 飞书 API 端点速查

| 用途 | 方法 | 端点 |
|------|------|------|
| 获取 tenant_access_token | POST | `/open-apis/auth/v3/tenant_access_token/internal` |
| 下载消息资源 | GET | `/open-apis/im/v1/messages/{message_id}/resources/{file_key}?type={image\|file}` |
| 发送消息 | POST | `/open-apis/im/v1/messages?receive_id_type=chat_id` |
| 获取群聊信息 | GET | `/open-apis/im/v1/chats/{chat_id}` |
| 获取群成员列表 | GET | `/open-apis/im/v1/chats/{chat_id}/members` |
| 获取用户信息 | GET | `/open-apis/contact/v3/users/{user_id}` |

## 附录 B: 事件 Payload 示例

```json
{
  "schema": "2.0",
  "header": {
    "event_id": "evt_xxxxx",
    "event_type": "im.message.receive_v1",
    "create_time": "1713700000000",
    "token": "verification_token_here",
    "app_id": "cli_xxxxx",
    "tenant_key": "tenant_xxxxx"
  },
  "event": {
    "sender": {
      "sender_id": {
        "union_id": "on_xxxxx",
        "user_id": "xxxxx",
        "open_id": "ou_xxxxx"
      },
      "sender_type": "user",
      "tenant_key": "tenant_xxxxx"
    },
    "message": {
      "message_id": "om_xxxxx",
      "root_id": "",
      "parent_id": "",
      "create_time": "1713700000000",
      "chat_id": "oc_xxxxx",
      "chat_type": "group",
      "message_type": "image",
      "content": "{\"image_key\":\"img_v3_xxxxx\"}"
    }
  }
}
```
