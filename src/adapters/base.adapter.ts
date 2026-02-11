/**
 * Base LLM Adapter (Abstract)
 * 
 * All provider-specific adapters extend this base class
 */

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
