/**
 * Qwen Adapter for Cloudflare Functions
 * 
 * Implements the unified LLM interface for Alibaba Cloud Qwen models
 */

import { LLM_CONFIG } from './llm-config.js';

export class QwenAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || LLM_CONFIG.providers.qwen.baseUrl;
    this.defaultModel = config.defaultModel || LLM_CONFIG.providers.qwen.defaultModel;
  }

  getProvider() {
    return 'qwen';
  }

  getModels() {
    return ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'];
  }

  /**
   * Build messages array with system prompt
   */
  buildMessages(messages, systemPrompt) {
    if (!systemPrompt) return messages;
    
    const hasSystem = messages.some(m => m.role === 'system');
    if (hasSystem) return messages;
    
    return [{ role: 'system', content: systemPrompt }, ...messages];
  }

  /**
   * Single chat completion
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - Chat options (model, temperature, maxTokens, systemPrompt)
   * @returns {Promise<Object>} ChatResponse
   */
  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const finalMessages = this.buildMessages(messages, options.systemPrompt);

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
        temperature: options.temperature ?? LLM_CONFIG.defaults.temperature,
        max_tokens: options.maxTokens ?? LLM_CONFIG.defaults.maxTokens,
        top_p: options.topP ?? LLM_CONFIG.defaults.topP,
        stream: false
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Qwen API Error: ${data.error.message || JSON.stringify(data.error)}`);
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
}
