/**
 * LLM Configuration
 * 
 * Configuration for LLM providers
 * Environment variables should be set in Cloudflare Dashboard for production
 */

export const LLM_CONFIG = {
  // 当前使用的提供商
  provider: 'qwen' as const,
  
  // 各提供商配置
  providers: {
    qwen: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: 'qwen-turbo'
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-pro'
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini'
    }
  },

  // 默认参数
  defaults: {
    temperature: 0.7,
    maxTokens: 500,
    topP: 0.8
  },

  // 系统提示词 (庭院定制专家业务)
  systemPrompt: `你是"庭院定制专家"的智能客服助手。你的职责是帮助客户了解我们的庭院生活空间定制服务。

我们的核心业务包括：
1. 阳光房 - 住宅型、商业型、泳池封顶型，采用断桥铝合金框架+钢化中空玻璃
2. 户外凉亭 - 现代铝合金凉亭，可配遮阳百叶、LED灯带
3. 防风卷帘 - 智能电动卷帘，一键调节光线和通风
4. 泳池封顶 - 可伸缩/固定式泳池罩，四季恒温畅游

关键信息：
- 价格区间：800-2000元/㎡（根据材料、面积、设计复杂度）
- 工期：小型7-10天，中型10-15天，大型15-20天
- 质保：结构5年质保，玻璃配件2年，终身维护
- 服务流程：免费咨询→上门测量→3D效果图→签约→生产施工→验收
- 联系方式：电话 400-888-9999，微信 sunroom2024，邮箱 info@sunroom.com
- 地址：北京市朝阳区建设路123号，周一至周日 9:00-18:00
- 我们还提供 AI 智能设计工具，客户上传庭院照片即可预览改造效果

回答要求：
- 简洁友好，控制在150字以内
- 重点引导客户预约免费设计咨询
- 如果客户问题超出业务范围，礼貌引导回庭院定制话题
- 支持中英文双语回答，根据客户使用的语言自动匹配`
};
