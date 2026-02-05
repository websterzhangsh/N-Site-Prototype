# 智能设计工具 API 文档

## 概述

智能设计工具允许设计师上传后院实景照片和产品效果图，通过阿里通义 AI 模型生成融合后的设计效果图。

## 系统架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│   前端 UI   │ ──── │  后端 API   │ ──── │ 阿里通义 API    │
│ (React)     │      │  (Proxy)    │      │ (DashScope)     │
└─────────────┘      └─────────────┘      └─────────────────┘
```

## API 端点

### 1. 生成设计效果图

**POST** `/api/design/generate`

#### 请求参数

```json
{
  "background_image": "base64_encoded_string",
  "foreground_image": "base64_encoded_string",
  "product_type": "sunroom | pavilion | roller_blind | yard_accessory",
  "style": "realistic | modern | classic",
  "quality": "standard | high"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| background_image | string | 是 | Base64 编码的后院实景照片 |
| foreground_image | string | 是 | Base64 编码的产品效果图 |
| product_type | string | 是 | 产品类型 |
| style | string | 否 | 风格，默认 realistic |
| quality | string | 否 | 质量，默认 standard |

#### 响应

**成功 (200)**
```json
{
  "success": true,
  "result_image": "https://cdn.example.com/generated/xxx.png",
  "task_id": "task_abc123"
}
```

**失败 (4xx/5xx)**
```json
{
  "success": false,
  "message": "错误描述",
  "error_code": "ERROR_CODE"
}
```

### 2. 健康检查

**GET** `/api/design/health`

#### 响应

```json
{
  "status": "ok",
  "api_available": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 3. 获取任务状态

**GET** `/api/design/task/{task_id}`

#### 响应

```json
{
  "status": "pending | processing | completed | failed",
  "result_image": "https://...",
  "progress": 75,
  "message": "处理中..."
}
```

## 阿里通义 API 集成

### 认证

使用 DashScope API Key 进行认证：

```
Authorization: Bearer {DASHSCOPE_API_KEY}
```

### 调用示例

```python
import dashscope
from dashscope import ImageSynthesis

dashscope.api_key = 'your-api-key'

def generate_design(background_b64, foreground_b64, prompt):
    response = ImageSynthesis.call(
        model='wanx-v1',
        input={
            'base_image': background_b64,
            'ref_image': foreground_b64,
            'prompt': prompt,
        },
        parameters={
            'style': 'realistic',
            'size': '1024*1024',
            'n': 1,
        }
    )
    return response.output.results[0].url
```

### 推荐模型

| 模型 | 用途 | 特点 |
|------|------|------|
| wanx-v1 | 图像生成 | 通用图像生成 |
| wanx-style-repaint-v1 | 风格迁移 | 适合效果融合 |
| qwen-vl-max | 图像理解 | 用于验证生成质量 |

## 后端实现建议

### Node.js/Express 示例

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '50mb' }));

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-synthesis/image-synthesis';

app.post('/api/design/generate', async (req, res) => {
  try {
    const { background_image, foreground_image, product_type } = req.body;
    
    const response = await axios.post(DASHSCOPE_URL, {
      model: 'wanx-v1',
      input: {
        image_synthesis: {
          base_image: background_image,
          reference_image: foreground_image,
          prompt: getPrompt(product_type),
        }
      },
      parameters: {
        style: 'realistic',
        n: 1,
        size: '1024*1024',
      }
    }, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    res.json({
      success: true,
      result_image: response.data.output.results[0].url,
      task_id: response.data.request_id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

function getPrompt(productType) {
  const prompts = {
    sunroom: '将阳光房自然融合到后院场景，保持透视正确，光影真实',
    pavilion: '将凉亭放置在后院中，与环境协调，阴影真实',
    roller_blind: '展示防风卷帘安装效果，比例透视正确',
    yard_accessory: '将庭院设施融入环境，整体和谐',
  };
  return prompts[productType] || prompts.sunroom;
}

app.listen(3001);
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_IMAGE | 图片格式无效 |
| IMAGE_TOO_LARGE | 图片超过大小限制 |
| API_ERROR | 通义 API 调用失败 |
| RATE_LIMITED | 请求频率超限 |
| UNAUTHORIZED | API Key 无效 |

## 安全考虑

1. **API Key 保护**: 绝不在前端暴露 API Key
2. **请求限流**: 实现请求频率限制
3. **图片验证**: 验证上传图片的类型和大小
4. **CORS 配置**: 正确配置跨域策略

## 部署建议

1. 使用环境变量存储 API Key
2. 配置 CDN 加速图片访问
3. 实现结果图片缓存
4. 监控 API 调用量和错误率
