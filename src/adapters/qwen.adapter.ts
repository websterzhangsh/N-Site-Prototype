/**
 * Qwen Adapter (阿里云通义千问)
 * 
 * Adapter for DashScope Qwen models
 */

import { BaseLLMAdapter } from './base.adapter';
import { Message, ChatOptions, ChatResponse, StreamChunk } from '../types/llm';

export class QwenAdapter extends BaseLLMAdapter {
  
  getProvider(): string {
    return 'qwen';
  }

  getDefaultBaseUrl(): string {
    // Using OpenAI-compatible endpoint for simplicity
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
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

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: finalMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 300,
        top_p: options?.topP ?? 0.8,
        stream: false
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Qwen API Error: ${data.error.message || data.error}`);
    }

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from Qwen API');
    }

    return {
      id: data.id || `qwen-${Date.now()}`,
      provider: 'qwen',
      model: data.model || model,
      content: choice.message?.content || '',
      finishReason: choice.finish_reason === 'stop' ? 'stop' : 'length',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      createdAt: new Date()
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
        model: model,
        messages: finalMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 300,
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
          const data = JSON.parse(line.slice(5).trim());
          const delta = data.choices?.[0]?.delta?.content || '';
          const finishReason = data.choices?.[0]?.finish_reason;
          
          yield {
            id: data.id || `qwen-${Date.now()}`,
            delta: delta,
            finishReason: finishReason === 'stop' ? 'stop' : null
          };
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}
