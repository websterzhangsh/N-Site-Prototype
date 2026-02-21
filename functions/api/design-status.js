/**
 * Cloudflare Pages Function - 查询异步任务状态
 * 路径: /api/design-status
 * 前端轮询此接口获取图像生成进度和结果
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 从响应中提取图像
function extractImage(data) {
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

  // 路径2: output.results[].url or output.results[] (string)
  if (!resultImage && data.output?.results?.[0]) {
    const firstResult = data.output.results[0];
    resultImage = typeof firstResult === 'string' ? firstResult : firstResult.url || null;
  }

  return resultImage;
}

// 处理 GET 请求 - 查询任务状态
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('task_id');

    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing task_id parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = context.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 查询任务状态
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || 'Failed to query task status',
          task_status: 'FAILED'
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const taskStatus = data.output?.task_status;
    const requestId = data.request_id;

    // 任务完成
    if (taskStatus === 'SUCCEEDED') {
      const resultImage = extractImage(data);

      if (!resultImage) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Task completed but no image found',
            task_status: 'FAILED',
            raw_response: data
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          task_status: 'SUCCEEDED',
          result_image: resultImage,
          request_id: requestId
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 任务失败
    if (taskStatus === 'FAILED') {
      return new Response(
        JSON.stringify({
          success: false,
          task_status: 'FAILED',
          error: data.output?.message || 'Task failed',
          code: data.output?.code
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 任务仍在进行中 (PENDING / RUNNING)
    return new Response(
      JSON.stringify({
        success: true,
        task_status: taskStatus || 'PENDING',
        request_id: requestId
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error querying task:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error: ' + (error instanceof Error ? error.message : String(error)),
        task_status: 'FAILED'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
