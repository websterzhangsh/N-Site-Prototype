/**
 * LLM Service Factory for Cloudflare Functions
 * 
 * Creates LLM adapter instances based on provider configuration
 */

import { QwenAdapter } from './qwen-adapter.js';
// Future: import { GeminiAdapter } from './gemini-adapter.js';
// Future: import { OpenAIAdapter } from './openai-adapter.js';

/**
 * Create an LLM service adapter
 * @param {Object} config - Provider configuration
 * @param {string} config.provider - Provider name ('qwen', 'gemini', 'openai')
 * @param {string} config.apiKey - API key for the provider
 * @param {string} [config.baseUrl] - Optional custom base URL
 * @param {string} [config.defaultModel] - Optional default model name
 * @returns {Object} LLM adapter instance
 */
export function createLLMService(config) {
  switch (config.provider) {
    case 'qwen':
      return new QwenAdapter({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel
      });
    
    // Future providers:
    // case 'gemini':
    //   return new GeminiAdapter({...});
    // case 'openai':
    //   return new OpenAIAdapter({...});
    
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
