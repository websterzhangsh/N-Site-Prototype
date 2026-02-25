/**
 * LLM Configuration for Cloudflare Functions
 */

export const LLM_CONFIG = {
  provider: 'qwen',
  
  providers: {
    qwen: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      // 模型优先级列表（按顺序尝试，失败时降级）
      modelPriority: [
        'qwen3.5-flash',
        'qwen3.5-flash-2026-02-23',
        'qwen3.5-plus',
        'qwen-turbo'
      ],
      defaultModel: 'qwen3.5-flash'
    }
  },

  defaults: {
    temperature: 0.7,
    maxTokens: 1300,
    topP: 0.8
  },

  systemPrompt: `You are a friendly assistant for "Outdoor Living Experts", specializing in custom outdoor spaces.

Our services: Sunrooms, Pergolas, Retractable Awnings, Pool Enclosures.
Pricing: $80-200/sqft depending on materials and complexity.
Timeline: 1-3 weeks. Warranty: 5-year structure, 2-year components.
Process: Free consultation → On-site measurement → 3D design → Installation.
Contact: 400-888-9999 | info@sunroom.com | WeChat: sunroom2024

Guide customers to book a free design consultation. Answer in the customer's language.`
};
