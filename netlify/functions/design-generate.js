/**
 * Netlify Serverless Function - 阿里通义图像编辑 API 代理
 * 
 * 此函数作为前端和阿里云 DashScope API 之间的代理，
 * 安全地处理 API Key 并转发请求。
 */

exports.handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { background_image, foreground_image, prompt, product_type } = body;

    // 验证必需参数
    if (!background_image || !foreground_image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '请提供背景图和前景图' 
        })
      };
    }

    // 从环境变量获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'API Key 未配置' 
        })
      };
    }

    // 构建提示词
    const editPrompt = prompt || getPromptByProductType(product_type || 'sunroom');

    // 调用阿里通义 DashScope API - 使用图像编辑模型
    const dashscopeResponse = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-image-edit-max',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: background_image },
                  { image: foreground_image },
                  { text: editPrompt }
                ]
              }
            ]
          },
          parameters: {
            n: 1,
            size: '1024*1024'
          }
        })
      }
    );

    const dashscopeData = await dashscopeResponse.json();

    // 检查 API 响应
    if (!dashscopeResponse.ok) {
      console.error('DashScope API Error:', dashscopeData);
      return {
        statusCode: dashscopeResponse.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: dashscopeData.message || 'API 调用失败',
          details: dashscopeData
        })
      };
    }

    // 提取生成的图像 URL
    const resultImage = dashscopeData.output?.choices?.[0]?.message?.content?.[0]?.image;

    if (!resultImage) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '未能生成图像',
          details: dashscopeData
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result_image: resultImage,
        request_id: dashscopeData.request_id,
        usage: dashscopeData.usage
      })
    };

  } catch (error) {
    console.error('Server Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '服务器错误',
        message: error.message
      })
    };
  }
};

/**
 * 根据产品类型获取融合提示词
 */
function getPromptByProductType(productType) {
  const prompts = {
    sunroom: '请将第二张图中的阳光房自然地融合到第一张后院实景照片中。保持透视关系正确，光影效果真实，使阳光房看起来就像是原本就在这个位置一样。整体效果要协调美观，无明显的拼接痕迹。',
    pavilion: '请将第二张图中的凉亭自然地放置到第一张后院实景照片中。确保凉亭与周围环境协调，阴影和光线效果真实自然，比例和透视正确。',
    roller_blind: '请将第二张图中的防风卷帘安装效果自然地展示在第一张图的阳台或廊道中。保持比例和透视正确，整体效果真实自然。',
    yard_accessory: '请将第二张图中的庭院设施自然地融入第一张后院实景照片中。确保整体效果和谐统一，光影自然，无明显拼接痕迹。'
  };
  return prompts[productType] || prompts.sunroom;
}
