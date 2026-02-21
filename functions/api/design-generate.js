/**
 * Cloudflare Pages Function - 阿里通义图像编辑 API 代理 (异步模式)
 * 路径: /api/design-generate
 * 提交异步任务，返回 task_id，前端通过 /api/design-status 轮询结果
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
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 提交异步任务
async function submitAsyncTask(apiKey, model, bgImage, fgImage, refImage, prompt, isIteration = false) {
  const imageContent = [];

  if (isIteration) {
    console.log(`Submitting async task: model=${model}, iteration mode (1 image)`);
    imageContent.push({ image: bgImage });
  } else {
    console.log(`Submitting async task: model=${model}, images=${refImage ? 3 : 2}`);
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
        'X-DashScope-Async': 'enable',  // 启用异步模式
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

// 处理 POST 请求 - 提交异步任务
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { background_image, foreground_image, reference_image, prompt, is_iteration } = body;

    // 验证必要参数
    if (is_iteration) {
      if (!background_image) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please provide the image to edit' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      if (!background_image || !foreground_image) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please provide both backyard photo and product image' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 获取 API Key
    const apiKey = context.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const editPrompt = prompt || DEFAULT_PROMPT;
    let usedModel = MODELS.max;

    // 尝试 max 模型
    let { response, data } = await submitAsyncTask(apiKey, MODELS.max, background_image, foreground_image, reference_image, editPrompt, is_iteration);

    // 如果 max 繁忙，降级到 plus
    if (isServiceBusy(response, data)) {
      console.log(`${MODELS.max} is busy, falling back to ${MODELS.plus}...`);
      usedModel = MODELS.plus;
      ({ response, data } = await submitAsyncTask(apiKey, MODELS.plus, background_image, foreground_image, reference_image, editPrompt, is_iteration));
    }

    // 检查提交是否成功
    if (!response.ok || data.code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || data.code || 'Failed to submit task',
          model_used: usedModel
        }),
        { status: response.status || 500, headers: corsHeaders }
      );
    }

    // 提取 task_id
    const taskId = data.output?.task_id;
    const taskStatus = data.output?.task_status;

    if (!taskId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No task_id returned from API',
          raw_response: data
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Task submitted: ${taskId}, status: ${taskStatus}, model: ${usedModel}`);

    return new Response(
      JSON.stringify({
        success: true,
        task_id: taskId,
        task_status: taskStatus || 'PENDING',
        model_used: usedModel,
        fallback_used: usedModel === MODELS.plus
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error: ' + msg }),
      { status: 500, headers: corsHeaders }
    );
  }
}
