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
          error: 'API Key 未配置，请在 Netlify 环境变量中设置 DASHSCOPE_API_KEY' 
        })
      };
    }

    // 构建提示词
    const editPrompt = prompt || getPromptByProductType(product_type || 'sunroom');

    console.log('Calling DashScope API with model: qwen-image-edit-max');
    console.log('Prompt:', editPrompt);

    // 调用阿里通义 DashScope API - 使用图像编辑模型
    const requestBody = {
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
    };

    const dashscopeResponse = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
      }
    );

    const dashscopeData = await dashscopeResponse.json();
    console.log('DashScope Response Status:', dashscopeResponse.status);
    console.log('DashScope Response:', JSON.stringify(dashscopeData, null, 2));

    // 检查 API 响应错误
    if (!dashscopeResponse.ok || dashscopeData.code) {
      console.error('DashScope API Error:', dashscopeData);
      return {
        statusCode: dashscopeResponse.status || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: dashscopeData.message || dashscopeData.code || 'API 调用失败',
          code: dashscopeData.code,
          request_id: dashscopeData.request_id,
          details: dashscopeData
        })
      };
    }

    // 尝试多种路径提取生成的图像 URL
    let resultImage = null;
    
    // 路径1: output.choices[0].message.content[0].image
    if (dashscopeData.output?.choices?.[0]?.message?.content) {
      const content = dashscopeData.output.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.image) {
            resultImage = item.image;
            break;
          }
        }
      } else if (typeof content === 'string') {
        // 可能是直接的图像URL
        resultImage = content;
      }
    }
    
    // 路径2: output.results[0].url (某些模型的格式)
    if (!resultImage && dashscopeData.output?.results?.[0]?.url) {
      resultImage = dashscopeData.output.results[0].url;
    }

    // 路径3: output.task_id (异步任务)
    if (!resultImage && dashscopeData.output?.task_id) {
      return {
        statusCode: 202,
        headers,
        body: JSON.stringify({
          success: false,
          error: '任务正在处理中，请稍后查询',
          task_id: dashscopeData.output.task_id,
          request_id: dashscopeData.request_id
        })
      };
    }

    if (!resultImage) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '未能从响应中提取图像',
          raw_response: dashscopeData
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
        error: '服务器错误: ' + error.message,
        stack: error.stack
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
