/**
 * Qwen Adapter for Cloudflare Functions
 * 
 * Implements the unified LLM interface for Alibaba Cloud Qwen models
 */

import { LLM_CONFIG } from './llm-config.js';

const REQUEST_TIMEOUT_MS = 15000; // 15s for chat
const MAX_RETRIES = 2;
const RETRY_DELAYS = [800, 1500];

function isRetryable(error) {
  const msg = String(error?.message || error).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('abort') ||
    msg.includes('connection') ||
    msg.includes('econnreset') ||
    msg.includes('socket')
  );
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url, options, { retries = MAX_RETRIES, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetchWithTimeout(url, options, timeoutMs);
      if (attempt < retries && [502, 503, 504].includes(resp.status)) {
        console.warn(`Qwen attempt ${attempt + 1} got ${resp.status}, retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 1500));
        continue;
      }
      return resp;
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        console.warn(`Qwen attempt ${attempt + 1} failed: ${err.message}, retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 1500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export class QwenAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || LLM_CONFIG.providers.qwen.baseUrl;
    this.defaultModel = config.defaultModel || LLM_CONFIG.providers.qwen.defaultModel;
    this.modelPriority = config.modelPriority || LLM_CONFIG.providers.qwen.modelPriority || [this.defaultModel];
  }

  getProvider() {
    return 'qwen';
  }

  getModels() {
    return this.modelPriority;
  }

  /**
   * Check if error indicates model unavailable (should try next model)
   */
  isModelUnavailable(error, response) {
    if (response?.status === 429 || response?.status === 503) return true;
    const msg = String(error?.message || error).toLowerCase();
    return (
      msg.includes('model') ||
      msg.includes('quota') ||
      msg.includes('rate') ||
      msg.includes('busy') ||
      msg.includes('unavailable') ||
      msg.includes('not found') ||
      msg.includes('not exist')
    );
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
   * Single chat completion with automatic model fallback
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - Chat options (model, temperature, maxTokens, systemPrompt)
   * @returns {Promise<Object>} ChatResponse
   */
  async chat(messages, options = {}) {
    const finalMessages = this.buildMessages(messages, options.systemPrompt);
    
    // 按优先级尝试模型
    let lastError;
    for (const model of this.modelPriority) {
      try {
        console.log(`Trying model: ${model}`);
        const result = await this._callModel(model, finalMessages, options);
        console.log(`Model ${model} succeeded`);
        return result;
      } catch (err) {
        console.warn(`Model ${model} failed: ${err.message}`);
        lastError = err;
        // 如果是模型不可用错误，尝试下一个模型
        if (this.isModelUnavailable(err)) {
          continue;
        }
        // 其他错误直接抛出
        throw err;
      }
    }
    // 所有模型都失败
    throw lastError || new Error('All models failed');
  }

  /**
   * Internal method to call a specific model
   */
  async _callModel(model, finalMessages, options) {
    const response = await fetchWithRetry(`${this.baseUrl}/chat/completions`, {
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
      const err = new Error(`Qwen API Error: ${data.error.message || JSON.stringify(data.error)}`);
      err.response = response;
      throw err;
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
