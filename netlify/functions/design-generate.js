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

    // 使用更明确的提示词进行图像合成
    const editPrompt = prompt || `基于这两张图片生成一张新图片：
将第二张图中的阳光房建筑物抠出来，然后自然地放置到第一张图的后院场景中。
要求：
1. 阳光房要放置在合适的位置，看起来像是真实存在于这个后院中
2. 调整阳光房的大小和透视使其与场景匹配
3. 添加自然的阴影效果
4. 保持光照方向一致
5. 整体效果要真实自然，无拼接痕迹`;

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
