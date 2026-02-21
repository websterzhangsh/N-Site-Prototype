/**
 * Cloudflare Pages Function - 阿里通义图像编辑 API 代理 (SSE 流式响应)
 * 路径: /api/design-generate
 * 同步调用 DashScope API，通过 SSE 流式心跳保持连接活跃，实时推送进度与结果
 */

// 模型配置
const MODELS = {
  max: 'qwen-image-edit-max',
  plus: 'qwen-image-edit-plus'
};

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

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 同步调用 DashScope API（无异步头）
async function callDashScope(apiKey, model, bgImage, fgImage, refImage, prompt, isIteration) {
  const imageContent = [];

  if (isIteration) {
    console.log(`Calling DashScope: model=${model}, iteration mode (1 image)`);
    imageContent.push({ image: bgImage });
  } else {
    console.log(`Calling DashScope: model=${model}, initial mode (${refImage ? 3 : 2} images)`);
    imageContent.push({ image: bgImage });
    imageContent.push({ image: fgImage });
    if (refImage) {
      imageContent.push({ image: refImage });
    }
  }

  imageContent.push({ text: prompt });

  const response = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // 注意：不使用 X-DashScope-Async 头，qwen-image-edit 不支持异步模式
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: [
            {
              role: 'user',
              content: imageContent
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
  return { response, data };
}

// 检查是否为服务繁忙/限流错误
function isServiceBusy(response, data) {
  if (response.status === 429 || response.status === 503) return true;

  const busyCodes = [
    'Throttling', 'Throttling.RateQuota', 'Throttling.AllocationQuota',
    'ServiceUnavailable', 'InternalError.Busy', 'QueueFull'
  ];
  if (data?.code && busyCodes.some(code => data.code.includes(code))) return true;

  const busyMessages = ['busy', 'throttl', 'rate limit', 'quota', 'overload', 'too many'];
  const msg = (data?.message || '').toLowerCase();
  if (busyMessages.some(keyword => msg.includes(keyword))) return true;

  return false;
}

// 从 DashScope 响应中提取图像 URL
function extractImage(data) {
  // 路径1: output.choices[0].message.content[].image
  if (data.output?.choices?.[0]?.message?.content) {
    const content = data.output.choices[0].message.content;
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.image) return item.image;
      }
    }
  }

  // 路径2: output.results[].url or output.results[] (string)
  if (data.output?.results?.[0]) {
    const first = data.output.results[0];
    return typeof first === 'string' ? first : first.url || null;
  }

  return null;
}

// 处理 POST 请求 - SSE 流式响应
export async function onRequestPost(context) {
  // 解析请求体
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { background_image, foreground_image, reference_image, prompt, is_iteration } = body;

  // 验证必要参数
  if (is_iteration) {
    if (!background_image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide the image to edit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    if (!background_image || !foreground_image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide both backyard photo and product image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 获取 API Key
  const apiKey = context.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'API Key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const editPrompt = prompt || DEFAULT_PROMPT;

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // SSE 事件发送辅助函数
  const sendEvent = async (data) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      // 客户端已断开连接，忽略写入错误
      console.log('SSE write failed (client likely disconnected):', e.message);
    }
  };

  // 后台处理任务
  const processTask = async () => {
    try {
      await sendEvent({ type: 'processing', elapsed: 0 });

      // 带心跳的 DashScope 调用
      const fetchWithHeartbeats = async (model, startElapsed) => {
        let done = false;
        let result = null;
        let fetchError = null;
        let elapsed = startElapsed;

        // 启动 DashScope 调用（不 await，让它在后台运行）
        callDashScope(apiKey, model, background_image, foreground_image, reference_image, editPrompt, is_iteration)
          .then(r => { result = r; done = true; })
          .catch(e => { fetchError = e; done = true; });

        // 每 5 秒发送心跳，保持连接活跃
        while (!done) {
          await new Promise(r => setTimeout(r, 5000));
          elapsed += 5;
          if (!done) {
            await sendEvent({ type: 'heartbeat', elapsed });
          }
          // 安全超时：5 分钟
          if (elapsed > 300) {
            done = true;
            throw new Error('Generation timed out (5 min)');
          }
        }

        if (fetchError) throw fetchError;
        return { ...result, elapsed };
      };

      // 先尝试 max 模型
      let usedModel = MODELS.max;
      let { response, data, elapsed } = await fetchWithHeartbeats(MODELS.max, 0);

      // 如果 max 繁忙，降级到 plus
      if (isServiceBusy(response, data)) {
        console.log(`${MODELS.max} is busy, falling back to ${MODELS.plus}...`);
        await sendEvent({ type: 'fallback', message: 'Primary model busy, switching to standard...' });
        usedModel = MODELS.plus;
        ({ response, data, elapsed } = await fetchWithHeartbeats(MODELS.plus, elapsed));
      }

      // 检查 API 错误
      if (!response.ok || data.code) {
        await sendEvent({
          type: 'error',
          message: data.message || data.code || 'Generation failed',
          model_used: usedModel
        });
        return;
      }

      // 提取结果图像
      const resultImage = extractImage(data);
      if (!resultImage) {
        await sendEvent({
          type: 'error',
          message: 'Task completed but no image found in response'
        });
        return;
      }

      console.log(`Generation succeeded: model=${usedModel}, elapsed=${elapsed}s`);

      // 发送最终结果
      await sendEvent({
        type: 'result',
        success: true,
        result_image: resultImage,
        model_used: usedModel,
        fallback_used: usedModel === MODELS.plus
      });

    } catch (e) {
      console.error('Processing error:', e);
      try {
        await sendEvent({ type: 'error', message: e.message || 'Unknown server error' });
      } catch (_) { /* stream already closed */ }
    } finally {
      try { await writer.close(); } catch (_) { /* already closed */ }
    }
  };

  // 使用 waitUntil 确保后台任务完成
  context.waitUntil(processTask());

  // 立即返回 SSE 流式响应
  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}
