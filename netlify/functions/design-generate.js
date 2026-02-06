/**
 * Netlify Serverless Function - 阿里通义图像编辑 API 代理
 */

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { background_image, foreground_image, prompt } = body;

    if (!background_image || !foreground_image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '请提供背景图和前景图' })
      };
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'API Key 未配置' })
      };
    }

    // 使用更明确的提示词进行图像合成 - 优化版本
    const editPrompt = prompt || `请将第二张图片中的阳光房（sunroom/glass conservatory）融合到第一张图片的后院场景中。

核心要求：
1. 【位置】阳光房必须紧贴主建筑物墙壁，作为房屋的延伸部分（attached sunroom），不能独立放置在草坪中央
2. 【大小】阳光房尺寸要适中，宽度不超过主建筑的1/3，高度与主建筑一层齐平，保持合理比例
3. 【透视】阳光房的透视角度必须与主建筑保持一致
4. 【融合】添加自然过渡，包括阴影、光照方向一致性

禁止事项 - NO 喧宾夺主：
- 阳光房不能比主建筑更突出或更大
- 阳光房不能放在草坪中央或离主建筑太远
- 不能破坏原有后院的整体布局`;

    console.log('Calling DashScope API...');
    console.log('Prompt:', editPrompt);

    // 调用 qwen-image-edit-max
    const response = await fetch(
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

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    // 检查错误
    if (!response.ok || data.code) {
      return {
        statusCode: response.status || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: data.message || data.code || 'API 调用失败',
          details: data
        })
      };
    }

    // 尝试提取图像
    let resultImage = null;
    
    // 路径1: output.choices[0].message.content[].image
    if (data.output?.choices?.[0]?.message?.content) {
      const content = data.output.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.image) {
            resultImage = item.image;
            break;
          }
        }
      }
    }
    
    // 路径2: output.results
    if (!resultImage && data.output?.results?.[0]) {
      resultImage = data.output.results[0].url || data.output.results[0];
    }

    if (!resultImage) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '未能从API响应中提取生成的图像',
          raw_response: data
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result_image: resultImage,
        request_id: data.request_id
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '服务器错误: ' + error.message
      })
    };
  }
};
