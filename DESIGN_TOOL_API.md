# 智能设计工具 API 技术设计文档

**版本**: 2.0.0  
**最后更新**: 2026-02-21  

---

## 1. 概述

智能设计工具允许设计师上传后院实景照片，选择内置产品效果图，通过阿里通义千问图像编辑模型（qwen-image-edit）生成融合后的 photo-realistic 设计效果图。支持最多 9 轮迭代编辑。

---

## 2. 系统架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (index.html)                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ 图片上传  │  │ 产品图选择器  │  │ SSE 流式读取器            │  │
│  │ (背景/参考)│  │ (按品类切换)  │  │ streamDesignRequest()   │  │
│  └──────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST (SSE 流式响应)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Pages Function (后端代理)                 │
│                                                                  │
│  /api/design-generate                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. 参数验证                                                │ │
│  │ 2. 同步调用 DashScope API（无异步头）                       │ │
│  │ 3. SSE 心跳保活（每 5 秒）                                  │ │
│  │ 4. 自动降级 (max → plus)                                   │ │
│  │ 5. 结果/错误推送                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  /api/design-status (保留，当前未使用)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ 同步 HTTP 调用
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    阿里通义 DashScope API                        │
│                                                                  │
│  Endpoint: /api/v1/services/aigc/multimodal-generation/generation│
│  Primary Model:  qwen-image-edit-max                            │
│  Fallback Model: qwen-image-edit-plus                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 通信模式：SSE 流式响应

**为什么不用异步任务模式？**

`qwen-image-edit-max/plus` 模型 **不支持** DashScope 的 `X-DashScope-Async: enable` 异步头。直接同步调用在 Cloudflare 上可能因长时间无数据传输导致连接超时。

**解决方案：** 后端同步调用 DashScope，同时通过 SSE（Server-Sent Events）流式响应向前端发送心跳，保持 HTTP 连接活跃。

```
前端                          后端 (Cloudflare)                  DashScope
  │                              │                                   │
  │── POST /api/design-generate ─▶│                                   │
  │                              │── 同步 fetch (等待 30-60s) ────────▶│
  │◀── SSE: {type:"processing"} ─│                                   │
  │                              │         (等待中...)                │
  │◀── SSE: {type:"heartbeat",   │                                   │
  │         elapsed:5}           │                                   │
  │◀── SSE: {type:"heartbeat",   │                                   │
  │         elapsed:10}          │                                   │
  │         ...                  │                                   │
  │                              │◀── 返回结果 ──────────────────────│
  │◀── SSE: {type:"result",      │                                   │
  │         result_image:"..."}  │                                   │
  │                              │── close stream ──                 │
```

---

## 3. API 端点

### 3.1 生成/编辑设计效果图

**POST** `/api/design-generate`

**Content-Type:** `application/json`  
**Response Content-Type:** `text/event-stream` (SSE)

#### 请求参数

##### 初始生成模式（首次融合）

```json
{
  "background_image": "data:image/jpeg;base64,...",
  "foreground_image": "data:image/jpeg;base64,...",
  "reference_image": "data:image/jpeg;base64,...",
  "prompt": "请将第二张图中的阳光房自然地融合到第一张后院实景照片中...",
  "is_iteration": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| background_image | string | 是 | Base64 后院实景照片 |
| foreground_image | string | 是 | Base64 产品效果图（从内置库选择） |
| reference_image | string | 否 | Base64 参考图片（可选） |
| prompt | string | 否 | 自定义提示词（最长 800 字符） |
| is_iteration | boolean | 否 | 默认 false |

##### 迭代编辑模式（第 2-9 轮）

```json
{
  "background_image": "https://result-from-previous-round.png",
  "prompt": "将阳光房的位置向左移动一些，增加周围的绿植",
  "is_iteration": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| background_image | string | 是 | 上一轮生成的结果图片 URL 或 Base64 |
| prompt | string | 是 | 本轮编辑指令（最长 500 字符） |
| is_iteration | boolean | 是 | 必须为 true |

#### SSE 响应事件

所有事件格式：`data: {JSON}\n\n`

##### 事件类型

| 事件 type | 触发时机 | 数据字段 | 说明 |
|-----------|---------|---------|------|
| `processing` | 请求开始 | `{type, elapsed: 0}` | 任务已提交 |
| `heartbeat` | 每 5 秒 | `{type, elapsed: N}` | 保持连接，显示进度 |
| `fallback` | 降级时 | `{type, message}` | 主模型繁忙，切换备用 |
| `result` | 生成成功 | `{type, success, result_image, model_used, fallback_used}` | 最终结果 |
| `error` | 生成失败 | `{type, message, model_used?}` | 错误信息 |

##### SSE 事件示例

```
data: {"type":"processing","elapsed":0}

data: {"type":"heartbeat","elapsed":5}

data: {"type":"heartbeat","elapsed":10}

data: {"type":"fallback","message":"Primary model busy, switching to standard..."}

data: {"type":"heartbeat","elapsed":15}

data: {"type":"result","success":true,"result_image":"https://dashscope-result.oss.aliyuncs.com/xxx.png","model_used":"qwen-image-edit-plus","fallback_used":true}

```

##### 错误响应（非 SSE）

参数验证失败时直接返回 JSON：

```json
// HTTP 400
{
  "success": false,
  "error": "Please provide both backyard photo and product image"
}

// HTTP 500
{
  "success": false,
  "error": "API Key not configured"
}
```

### 3.2 查询任务状态（保留端点）

**GET** `/api/design-status?task_id={task_id}`

> **注意：** 此端点为历史遗留，当前 SSE 架构下不再使用。保留以备后续异步模型支持时启用。

---

## 4. 核心机制

### 4.1 模型自动降级策略

```
                    ┌─────────────────────┐
                    │  调用 qwen-image-   │
                    │  edit-max (主模型)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   响应正常？          │
                    └──────────┬──────────┘
                          ╱          ╲
                       是              否 (繁忙/限流)
                       │                │
              ┌────────▼──────┐  ┌─────▼───────────┐
              │  提取图像结果  │  │ 降级到 qwen-    │
              │  返回给前端    │  │ image-edit-plus  │
              └───────────────┘  └─────┬───────────┘
                                       │
                              ┌────────▼──────────┐
                              │  调用 plus 模型    │
                              │  返回结果/错误     │
                              └───────────────────┘
```

**繁忙判定条件（任一匹配）：**

- HTTP 状态码 429 或 503
- 响应 code 包含：`Throttling`、`ServiceUnavailable`、`InternalError.Busy`、`QueueFull`
- 响应 message 包含：`busy`、`throttl`、`rate limit`、`quota`、`overload`、`too many`

### 4.2 迭代编辑（最多 9 轮）

```
第 1 轮 (初始生成)                第 2 轮 (迭代编辑)               第 N 轮 (N≤9)
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│ 输入:             │            │ 输入:             │            │ 输入:             │
│  - 背景图 (必须)   │            │  - 上轮结果图      │            │  - 上轮结果图      │
│  - 产品图 (必须)   │            │  - 编辑指令        │            │  - 编辑指令        │
│  - 参考图 (可选)   │            │                   │            │                   │
│  - 提示词          │            │ is_iteration:true │            │ is_iteration:true │
│                   │            │                   │            │                   │
│ DashScope 输入:   │            │ DashScope 输入:   │            │ DashScope 输入:   │
│  2-3 张图片       │            │  1 张图片          │            │  1 张图片          │
│  + 文本提示词      │            │  + 文本编辑指令    │            │  + 文本编辑指令    │
└────────┬─────────┘            └────────┬─────────┘            └────────┬─────────┘
         │                               │                               │
         ▼                               ▼                               ▼
    结果图 1 ──────────────▶ 输入  结果图 2 ──────────────▶ 输入  结果图 N
```

**前端状态管理：**

```javascript
let currentIteration = 1;      // 当前轮次
const maxIterations = 9;        // 最大轮次
let lastResultImageData = null; // 上一轮结果图（用作下轮输入）
```

### 4.3 产品图片内置选择器

产品图片按品类分组，每类最多显示 3 张，不支持用户上传：

```javascript
const productImages = {
    sunroom:   ['images/products/sunroom/hero-1.jpg',   'hero-2.jpg', 'hero-3.jpg'],
    pavilion:  ['images/products/pavilion/hero-1.jpg',  'hero-2.jpg', 'hero-3.jpg'],
    windproof: ['images/products/windproof/hero-1.jpg', 'hero-2.jpg', 'hero-3.jpg']
};
```

当用户在 Hero 区域切换品类时，产品选择器自动更新对应品类的图片。

### 4.4 SSE 心跳保活机制

```javascript
// 后端实现（简化）
const fetchWithHeartbeats = async (model, startElapsed) => {
    let done = false, result = null, elapsed = startElapsed;

    // 启动 DashScope 同步调用（后台运行）
    callDashScope(apiKey, model, ...)
        .then(r => { result = r; done = true; })
        .catch(e => { error = e; done = true; });

    // 每 5 秒发送心跳
    while (!done) {
        await new Promise(r => setTimeout(r, 5000));
        elapsed += 5;
        if (!done) sendEvent({ type: 'heartbeat', elapsed });
        if (elapsed > 300) throw new Error('Timeout (5 min)');
    }

    return result;
};
```

**关键设计考量：**

- **为什么用 SSE 而不是 WebSocket？** SSE 基于标准 HTTP，Cloudflare Pages Functions 原生支持，无需额外基础设施
- **为什么心跳间隔 5 秒？** 平衡连接保活需求与服务器资源消耗，5 秒足以防止代理/浏览器超时
- **安全超时：** 5 分钟硬限制，防止异常任务无限等待

---

## 5. 前端集成

### 5.1 SSE 流式读取器

```javascript
async function streamDesignRequest(body, onProgress, onResult, onError) {
    const response = await fetch('/api/design-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    // 非 SSE 响应（参数验证错误）
    if (!response.ok) {
        const errorData = await response.json();
        onError(errorData.error);
        return;
    }

    // 读取 SSE 流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const event of events) {
            const line = event.trim();
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.substring(6));

            switch (data.type) {
                case 'processing':
                case 'heartbeat':
                    onProgress(data.elapsed || 0);
                    break;
                case 'result':
                    onResult(data);
                    return;
                case 'error':
                    onError(data.message);
                    return;
            }
        }
    }
}
```

### 5.2 调用示例

```javascript
// 初始生成
streamDesignRequest(
    {
        background_image: bgImageData,
        foreground_image: fgImageData,
        reference_image: refImageData,
        prompt: editPrompt
    },
    (elapsed) => { /* 更新进度显示 */ },
    (data) => { /* 显示结果图片 */ },
    (msg) => { /* 显示错误 */ }
);

// 迭代编辑
streamDesignRequest(
    {
        background_image: lastResultImageData,
        prompt: editPrompt,
        is_iteration: true
    },
    onProgress, onResult, onError
);
```

---

## 6. DashScope API 集成详情

### 6.1 认证

```
Authorization: Bearer {DASHSCOPE_API_KEY}
```

API Key 存储在 Cloudflare Pages 环境变量 `DASHSCOPE_API_KEY` 中，前端不直接接触。

### 6.2 模型信息

| 模型 | 用途 | 优先级 | 特点 |
|------|------|--------|------|
| qwen-image-edit-max | 图像编辑/融合 | 主模型 | 高质量，可能繁忙 |
| qwen-image-edit-plus | 图像编辑/融合 | 降级备选 | 标准质量，更稳定 |

### 6.3 请求格式

```json
{
    "model": "qwen-image-edit-max",
    "input": {
        "messages": [
            {
                "role": "user",
                "content": [
                    { "image": "data:image/jpeg;base64,..." },
                    { "image": "data:image/jpeg;base64,..." },
                    { "image": "data:image/jpeg;base64,..." },
                    { "text": "融合提示词..." }
                ]
            }
        ]
    },
    "parameters": {
        "n": 1,
        "size": "1024*1024"
    }
}
```

### 6.4 响应图像提取

DashScope 返回格式不固定，需兼容多路径：

```javascript
function extractImage(data) {
    // 路径 1: output.choices[0].message.content[].image
    if (data.output?.choices?.[0]?.message?.content) { ... }

    // 路径 2: output.results[].url 或 output.results[] (string)
    if (data.output?.results?.[0]) { ... }
}
```

### 6.5 已知限制

| 限制项 | 说明 |
|--------|------|
| **不支持异步模式** | `X-DashScope-Async: enable` 头对 qwen-image-edit 无效，会返回错误 |
| **生成耗时** | 单次调用通常需要 30-60 秒 |
| **输入图片数量** | 初始模式最多 3 张，迭代模式 1 张 |
| **无上下文记忆** | 每轮迭代是独立调用，模型不记忆历史编辑 |

---

## 7. 架构演进历史

| 版本 | 时间 | 架构 | 问题 |
|------|------|------|------|
| v1.0 | 2026-02 初 | 同步代理 | Cloudflare 30s 超时导致"服务繁忙"错误 |
| v1.1 | 2026-02 中 | 异步任务 + 轮询 | DashScope 返回"用户 API 不支持异步调用"错误 |
| **v2.0** | **2026-02-21** | **SSE 流式响应** | **当前方案，心跳保活解决超时问题** |

---

## 8. 错误处理

### 8.1 错误码

| 场景 | HTTP 状态 | 响应方式 | 说明 |
|------|-----------|---------|------|
| 缺少必要图片 | 400 | JSON | 参数验证失败 |
| API Key 未配置 | 500 | JSON | 服务端配置错误 |
| 模型繁忙（双模型均忙） | 200 | SSE error 事件 | 自动降级后仍失败 |
| 生成成功但无图片 | 200 | SSE error 事件 | DashScope 响应异常 |
| 生成超时 (>5min) | 200 | SSE error 事件 | 安全超时触发 |
| 客户端断连 | - | 静默忽略 | 写入流失败时捕获异常 |

### 8.2 前端错误展示

所有错误通过 `showNotification(message, 'error')` 以 Toast 形式展示，不阻塞页面操作。

---

## 9. 安全考虑

1. **API Key 保护**: Key 仅存储在 Cloudflare 环境变量中，前端不直接调用 DashScope
2. **CORS 配置**: 允许所有来源（`*`），可按需收紧
3. **输入验证**: 后端验证必要参数存在性
4. **超时保护**: 5 分钟硬超时防止资源泄漏

---

## 10. 文件结构

```
functions/
├── api/
│   ├── design-generate.js    # 主端点：SSE 流式图像生成
│   └── design-status.js      # 保留端点：任务状态查询（当前未使用）
│
index.html                     # 前端 UI + JavaScript 逻辑
│   ├── streamDesignRequest()  # SSE 流式读取器
│   ├── generateDesign()       # 初始生成入口
│   ├── continueEdit()         # 迭代编辑入口
│   ├── updateIterationUI()    # 轮次 UI 更新
│   └── selectProductImage()   # 产品图选择
```

---

*本文档将随项目迭代持续更新*  
*Last updated: 2026-02-21*
