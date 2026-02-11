/**
 * LLM Agnostic API Interface - Type Definitions
 * 
 * Provider-agnostic types for LLM services
 * Supports: Qwen, Gemini, OpenAI, Claude, etc.
 */

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
export type ProviderType = 'qwen' | 'gemini' | 'openai' | 'claude' | 'ollama';

export interface ProviderConfig {
  provider: ProviderType;
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
