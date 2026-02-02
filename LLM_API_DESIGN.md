# LLM Agnostic API Interface Design
# LLM 无关 API 接口设计

**版本**: 1.0.0  
**最后更新**: 2026-01-30  

---

## 1. 设计目标 (Design Goals)

- **Provider Agnostic**: 支持多种LLM提供商 (Qwen, Gemini, OpenAI, Claude等)
- **Easy Switching**: 通过配置切换LLM，无需修改业务代码
- **Unified Interface**: 统一的请求/响应格式
- **Streaming Support**: 支持流式响应
- **Error Handling**: 统一的错误处理机制
- **Extensible**: 易于扩展新的LLM提供商

---

## 2. 架构设计 (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    Chatbot Frontend                      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   LLM Service Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Unified LLM Interface               │   │
│  │  - chat(messages, options)                       │   │
│  │  - streamChat(messages, options)                 │   │
│  │  - getModels()                                   │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                            │
│  ┌─────────────────────────▼───────────────────────┐   │
│  │              Provider Adapter Factory            │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                            │
│  ┌─────────┬───────────────┼───────────────┬─────────┐ │
│  ▼         ▼               ▼               ▼         ▼ │
│ ┌───┐   ┌───────┐     ┌────────┐     ┌───────┐  ┌───┐ │
│ │Qwen│  │Gemini │     │ OpenAI │     │Claude │  │...│ │
│ └───┘   └───────┘     └────────┘     └───────┘  └───┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 统一接口定义 (Unified Interface)

### 3.1 TypeScript Interface

```typescript
// types/llm.ts

// ============================================
// Message Types
// ============================================
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
}

// ============================================
// Request Options
// ============================================
export interface ChatOptions {
  model?: string;           // 模型名称
  temperature?: number;     // 0-2, 默认 0.7
  maxTokens?: number;       // 最大输出token数
  topP?: number;            // 0-1
  stream?: boolean;         // 是否流式输出
  stop?: string[];          // 停止序列
  systemPrompt?: string;    // 系统提示词
}

// ============================================
// Response Types
// ============================================
export interface ChatResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

export interface StreamChunk {
  id: string;
  delta: string;
  finishReason?: 'stop' | 'length' | null;
}

// ============================================
// Provider Configuration
// ============================================
export interface ProviderConfig {
  provider: 'qwen' | 'gemini' | 'openai' | 'claude' | 'ollama';
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

// ============================================
// LLM Service Interface
// ============================================
export interface ILLMService {
  // 单次对话
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  
  // 流式对话
  streamChat(
    messages: Message[], 
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;
  
  // 获取可用模型
  getModels(): Promise<string[]>;
  
  // 获取当前提供商
  getProvider(): string;
}
```

### 3.2 REST API Endpoints

```yaml
# API Endpoints

POST /api/chat
  Request:
    {
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ],
      "options": {
        "model": "qwen-turbo",
        "temperature": 0.7,
        "maxTokens": 1000,
        "stream": false
      }
    }
  Response:
    {
      "id": "chatcmpl-xxx",
      "provider": "qwen",
      "model": "qwen-turbo",
      "content": "Hello! How can I help you today?",
      "finishReason": "stop",
      "usage": {
        "promptTokens": 20,
        "completionTokens": 10,
        "totalTokens": 30
      }
    }

POST /api/chat/stream
  Request: (same as above with stream: true)
  Response: Server-Sent Events (SSE)
    data: {"id": "xxx", "delta": "Hello", "finishReason": null}
    data: {"id": "xxx", "delta": "!", "finishReason": null}
    data: {"id": "xxx", "delta": "", "finishReason": "stop"}
    data: [DONE]

GET /api/models
  Response:
    {
      "provider": "qwen",
      "models": ["qwen-turbo", "qwen-plus", "qwen-max"]
    }
```

---

## 4. Provider Adapters 实现

### 4.1 Base Adapter (Abstract)

```typescript
// adapters/base.adapter.ts

import { Message, ChatOptions, ChatResponse, StreamChunk, ILLMService } from '../types/llm';

export abstract class BaseLLMAdapter implements ILLMService {
  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;
  protected timeout: number;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
    this.defaultModel = config.defaultModel || this.getDefaultModel();
    this.timeout = config.timeout || 30000;
  }

  abstract getProvider(): string;
  abstract getDefaultBaseUrl(): string;
  abstract getDefaultModel(): string;
  abstract getModels(): Promise<string[]>;
  
  abstract chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  abstract streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk>;

  protected buildSystemMessage(messages: Message[], systemPrompt?: string): Message[] {
    if (!systemPrompt) return messages;
    
    const hasSystem = messages.some(m => m.role === 'system');
    if (hasSystem) return messages;
    
    return [{ role: 'system', content: systemPrompt }, ...messages];
  }
}
```

### 4.2 Qwen Adapter (阿里云通义千问)

```typescript
// adapters/qwen.adapter.ts

import { BaseLLMAdapter } from './base.adapter';
import { Message, ChatOptions, ChatResponse, StreamChunk } from '../types/llm';

export class QwenAdapter extends BaseLLMAdapter {
  
  getProvider(): string {
    return 'qwen';
  }

  getDefaultBaseUrl(): string {
    return 'https://dashscope.aliyuncs.com/api/v1';
  }

  getDefaultModel(): string {
    return 'qwen-turbo';
  }

  async getModels(): Promise<string[]> {
    return ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'];
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || this.defaultModel;
    const finalMessages = this.buildSystemMessage(messages, options?.systemPrompt);

    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: finalMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        parameters: {
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1500,
          top_p: options?.topP ?? 0.8,
          result_format: 'message'
        }
      })
    });

    const data = await response.json();

    if (data.code) {
      throw new Error(`Qwen API Error: ${data.message}`);
    }

    return {
      id: data.request_id,
      provider: 'qwen',
      model: model,
      content: data.output.choices[0].message.content,
      finishReason: data.output.choices[0].finish_reason === 'stop' ? 'stop' : 'length',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens
      },
      createdAt: new Date()
    };
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel;
    const finalMessages = this.buildSystemMessage(messages, options?.systemPrompt);

    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable'
      },
      body: JSON.stringify({
        model: model,
        input: { messages: finalMessages },
        parameters: {
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1500,
          incremental_output: true,
          result_format: 'message'
        }
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        const data = JSON.parse(line.slice(5));
        yield {
          id: data.request_id,
          delta: data.output?.choices?.[0]?.message?.content || '',
          finishReason: data.output?.choices?.[0]?.finish_reason === 'stop' ? 'stop' : null
        };
      }
    }
  }
}
```

### 4.3 Gemini Adapter (Google)

```typescript
// adapters/gemini.adapter.ts

import { BaseLLMAdapter } from './base.adapter';
import { Message, ChatOptions, ChatResponse, StreamChunk } from '../types/llm';

export class GeminiAdapter extends BaseLLMAdapter {
  
  getProvider(): string {
    return 'gemini';
  }

  getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1beta';
  }

  getDefaultModel(): string {
    return 'gemini-pro';
  }

  async getModels(): Promise<string[]> {
    return ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  private convertMessages(messages: Message[]): any[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
  }

  private getSystemInstruction(messages: Message[]): string | undefined {
    const systemMsg = messages.find(m => m.role === 'system');
    return systemMsg?.content;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || this.defaultModel;
    const contents = this.convertMessages(messages);
    const systemInstruction = options?.systemPrompt || this.getSystemInstruction(messages);

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1500,
          topP: options?.topP ?? 0.8
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    const candidate = data.candidates[0];

    return {
      id: `gemini-${Date.now()}`,
      provider: 'gemini',
      model: model,
      content: candidate.content.parts[0].text,
      finishReason: candidate.finishReason === 'STOP' ? 'stop' : 'length',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      createdAt: new Date()
    };
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel;
    const contents = this.convertMessages(messages);
    const systemInstruction = options?.systemPrompt || this.getSystemInstruction(messages);

    const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1500
        }
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(5));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const finishReason = data.candidates?.[0]?.finishReason;
          
          yield {
            id: `gemini-${Date.now()}`,
            delta: text,
            finishReason: finishReason === 'STOP' ? 'stop' : null
          };
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

### 4.4 OpenAI Adapter

```typescript
// adapters/openai.adapter.ts

import { BaseLLMAdapter } from './base.adapter';
import { Message, ChatOptions, ChatResponse, StreamChunk } from '../types/llm';

export class OpenAIAdapter extends BaseLLMAdapter {
  
  getProvider(): string {
    return 'openai';
  }

  getDefaultBaseUrl(): string {
    return 'https://api.openai.com/v1';
  }

  getDefaultModel(): string {
    return 'gpt-4o-mini';
  }

  async getModels(): Promise<string[]> {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || this.defaultModel;
    const finalMessages = this.buildSystemMessage(messages, options?.systemPrompt);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1500,
        top_p: options?.topP ?? 1,
        stream: false
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenAI API Error: ${data.error.message}`);
    }

    return {
      id: data.id,
      provider: 'openai',
      model: data.model,
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason === 'stop' ? 'stop' : 'length',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      createdAt: new Date(data.created * 1000)
    };
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel;
    const finalMessages = this.buildSystemMessage(messages, options?.systemPrompt);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1500,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        if (line === 'data: [DONE]') return;
        
        try {
          const data = JSON.parse(line.slice(5));
          yield {
            id: data.id,
            delta: data.choices[0]?.delta?.content || '',
            finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : null
          };
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

---

## 5. LLM Service Factory

```typescript
// services/llm.service.ts

import { ILLMService, ProviderConfig } from '../types/llm';
import { QwenAdapter } from '../adapters/qwen.adapter';
import { GeminiAdapter } from '../adapters/gemini.adapter';
import { OpenAIAdapter } from '../adapters/openai.adapter';

export class LLMServiceFactory {
  private static instance: ILLMService;
  private static config: ProviderConfig;

  static create(config: ProviderConfig): ILLMService {
    this.config = config;

    switch (config.provider) {
      case 'qwen':
        this.instance = new QwenAdapter({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel || 'qwen-turbo'
        });
        break;
      
      case 'gemini':
        this.instance = new GeminiAdapter({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel || 'gemini-pro'
        });
        break;
      
      case 'openai':
        this.instance = new OpenAIAdapter({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel || 'gpt-4o-mini'
        });
        break;
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    return this.instance;
  }

  static getInstance(): ILLMService {
    if (!this.instance) {
      throw new Error('LLM Service not initialized. Call create() first.');
    }
    return this.instance;
  }

  static getConfig(): ProviderConfig {
    return this.config;
  }
}
```

---

## 6. 配置文件 (Configuration)

```typescript
// config/llm.config.ts

export const LLM_CONFIG = {
  // 当前使用的提供商
  provider: process.env.LLM_PROVIDER || 'qwen',
  
  // 各提供商配置
  providers: {
    qwen: {
      apiKey: process.env.QWEN_API_KEY || '',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
      defaultModel: 'qwen-turbo'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-pro'
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini'
    }
  },

  // 默认参数
  defaults: {
    temperature: 0.7,
    maxTokens: 1500,
    topP: 0.8
  },

  // 系统提示词 (针对阳光房业务)
  systemPrompt: `你是Nestopia阳光房专家的智能客服助手。你需要：
1. 热情友好地回答客户关于阳光房的问题
2. 介绍产品特点、价格范围、安装流程等信息
3. 引导客户预约免费咨询或留下联系方式
4. 使用专业但通俗易懂的语言

公司信息：
- 电话：400-888-9999
- 邮箱：info@nestopia.com
- 地址：北京市朝阳区阳光大厦18楼
- 服务时间：周一至周日 9:00-18:00`
};
```

---

## 7. 使用示例 (Usage Examples)

### 7.1 初始化服务

```typescript
import { LLMServiceFactory } from './services/llm.service';
import { LLM_CONFIG } from './config/llm.config';

// 初始化LLM服务 (选择 Qwen)
const llmService = LLMServiceFactory.create({
  provider: 'qwen',
  apiKey: LLM_CONFIG.providers.qwen.apiKey,
  defaultModel: 'qwen-turbo'
});
```

### 7.2 单次对话

```typescript
const response = await llmService.chat([
  { role: 'user', content: '阳光房多少钱一平米？' }
], {
  systemPrompt: LLM_CONFIG.systemPrompt,
  temperature: 0.7,
  maxTokens: 1000
});

console.log(response.content);
// => "我们的阳光房价格根据材料和设计复杂度，一般在800-2000元/㎡之间..."
```

### 7.3 流式对话

```typescript
const stream = llmService.streamChat([
  { role: 'user', content: '介绍一下你们的产品' }
], {
  systemPrompt: LLM_CONFIG.systemPrompt
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
  
  if (chunk.finishReason === 'stop') {
    console.log('\n[完成]');
  }
}
```

### 7.4 切换提供商

```typescript
// 切换到 Gemini
const geminiService = LLMServiceFactory.create({
  provider: 'gemini',
  apiKey: LLM_CONFIG.providers.gemini.apiKey
});

// 切换到 OpenAI
const openaiService = LLMServiceFactory.create({
  provider: 'openai',
  apiKey: LLM_CONFIG.providers.openai.apiKey
});
```

---

## 8. 前端集成 (Frontend Integration)

### 8.1 Chatbot 组件更新

```javascript
// 更新聊天机器人使用LLM API
async function sendMessageToLLM(userMessage) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        options: {
          temperature: 0.7,
          maxTokens: 1000
        }
      })
    });

    const data = await response.json();
    
    // 更新对话历史
    conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: data.content }
    );

    return data.content;
  } catch (error) {
    console.error('LLM API Error:', error);
    return '抱歉，服务暂时不可用，请稍后再试或拨打 400-888-9999 联系我们。';
  }
}
```

### 8.2 流式响应处理

```javascript
async function streamMessageFromLLM(userMessage, onChunk) {
  const messages = [...conversationHistory, { role: 'user', content: userMessage }];

  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options: { stream: true } })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data:'));

    for (const line of lines) {
      if (line === 'data: [DONE]') break;
      const data = JSON.parse(line.slice(5));
      fullContent += data.delta;
      onChunk(data.delta);  // 实时更新UI
    }
  }

  return fullContent;
}
```

---

## 9. 错误处理 (Error Handling)

```typescript
// errors/llm.errors.ts

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(provider: string, retryAfter?: number) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class AuthenticationError extends LLMError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_ERROR', 401);
  }
}

export class QuotaExceededError extends LLMError {
  constructor(provider: string) {
    super('Quota exceeded', provider, 'QUOTA_EXCEEDED', 429);
  }
}
```

---

## 10. 文件结构 (File Structure)

```
src/
├── types/
│   └── llm.ts              # 类型定义
├── adapters/
│   ├── base.adapter.ts     # 抽象基类
│   ├── qwen.adapter.ts     # Qwen适配器
│   ├── gemini.adapter.ts   # Gemini适配器
│   ├── openai.adapter.ts   # OpenAI适配器
│   └── index.ts            # 导出
├── services/
│   └── llm.service.ts      # 服务工厂
├── config/
│   └── llm.config.ts       # 配置文件
├── errors/
│   └── llm.errors.ts       # 错误类
└── api/
    └── chat.ts             # API路由处理
```

---

*本文档将随项目迭代持续更新*  
*Last updated: 2026-01-30*
