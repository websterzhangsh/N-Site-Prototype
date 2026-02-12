/**
 * Cloudflare Pages Function - 阿里通义图像编辑 API 代理
 * 路径: /api/design-generate
 */

// 优化后的提示词
const DEFAULT_PROMPT = `请将第二张图片中的阳光房（sunroom/glass conservatory）融合到第一张图片的后院场景中。

核心要求：
1. 【保持原设计】必须完整保留第二张图片中阳光房的原始设计、外观、结构和风格，不得修改或简化
2. 【位置】阳光房必须紧贴主建筑物墙壁，作为房屋的延伸部分（attached sunroom），不能独立放置在草坪中央
3. 【大小】阳光房尺寸要适中，宽度不超过主建筑的1/3，高度与主建筑一层齐平，保持合理比例
4. 【透视】阳光房的透视角度必须与主建筑保持一致
5. 【融合】添加自然过渡，包括阴影、光照方向一致性

禁止事项 - NO 喧宾夺主：
- 禁止改变阳光房的原始设计、颜色、材质和结构
- 阳光房不能比主建筑更突出或更大
- 阳光房不能放在草坪中央或离主建筑太远
- 不能破坏原有后院的整体布局
- 不能简化或修改阳光房的细节`;

// --- Stability utilities ---
const REQUEST_TIMEOUT_MS = 25000; // 25s (Cloudflare limit ~30s)
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // backoff: 1s, 2s

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
      // Retry on 502/503/504 server errors
      if (attempt < retries && [502, 503, 504].includes(resp.status)) {
        console.warn(`Attempt ${attempt + 1} got ${resp.status}, retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 2000));
        continue;
      }
      return resp;
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        console.warn(`Attempt ${attempt + 1} failed: ${err.message}, retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 2000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// 处理 OPTIONS 请求 (CORS 预检)
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 处理 POST 请求
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { background_image, foreground_image, prompt } = body;

    // 验证必要参数
    if (!background_image || !foreground_image) {
      return new Response(
        JSON.stringify({ success: false, error: '请提供背景图和前景图' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 获取 API Key
    const apiKey = context.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key 未配置' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const editPrompt = prompt || DEFAULT_PROMPT;

    console.log('Calling DashScope API...');

    // 调用 qwen-image-edit-max (with retry & timeout)
    const response = await fetchWithRetry(
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

    console.log('API Response received');

    // 检查错误
    if (!response.ok || data.code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || data.code || 'API 调用失败',
          details: data
        }),
        { status: response.status || 500, headers: corsHeaders }
      );
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
      const firstResult = data.output.results[0];
      resultImage = typeof firstResult === 'string' ? firstResult : firstResult.url || null;
    }

    if (!resultImage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '未能从API响应中提取生成的图像',
          raw_response: data
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result_image: resultImage,
        request_id: data.request_id
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    let userMsg = 'Server error: ' + msg;
    if (msg.includes('abort') || msg.includes('timeout')) {
      userMsg = 'Request timed out. The image generation service is busy, please try again.';
    } else if (msg.includes('network') || msg.includes('connection') || msg.includes('socket')) {
      userMsg = 'Network connection lost. Please check your connection and try again.';
    }
    return new Response(
      JSON.stringify({ success: false, error: userMsg }),
      { status: 500, headers: corsHeaders }
    );
  }
}
