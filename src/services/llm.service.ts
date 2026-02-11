/**
 * LLM Service Factory
 * 
 * Creates LLM service instances based on provider configuration
 * Supports switching between providers without code changes
 */

import { ILLMService, ProviderConfig } from '../types/llm';
import { QwenAdapter } from '../adapters/qwen.adapter';
// Future imports:
// import { GeminiAdapter } from '../adapters/gemini.adapter';
// import { OpenAIAdapter } from '../adapters/openai.adapter';

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
          defaultModel: config.defaultModel || 'qwen-turbo',
          timeout: config.timeout
        });
        break;
      
      // Future providers:
      // case 'gemini':
      //   this.instance = new GeminiAdapter({...});
      //   break;
      // case 'openai':
      //   this.instance = new OpenAIAdapter({...});
      //   break;
      
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

/**
 * Convenience function to create a chat service
 */
export function createChatService(config: ProviderConfig): ILLMService {
  return LLMServiceFactory.create(config);
}
