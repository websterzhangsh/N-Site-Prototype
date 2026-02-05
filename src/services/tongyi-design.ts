/**
 * 阿里通义图像融合 API 服务
 * 
 * 用于调用阿里通义的图像生成和融合能力
 * 将后院实景照片与产品效果图进行智能融合
 * 
 * API 文档: https://help.aliyun.com/document_detail/xxx.html
 */

export interface DesignGenerateRequest {
  background_image: string  // Base64 编码的后院实景照片
  foreground_image: string  // Base64 编码的产品效果图
  product_type: 'sunroom' | 'pavilion' | 'roller_blind' | 'yard_accessory'
  style?: string           // 可选的风格参数
  quality?: 'standard' | 'high'  // 生成质量
}

export interface DesignGenerateResponse {
  success: boolean
  result_image: string     // Base64 编码的结果图片
  message?: string
  task_id?: string
}

/**
 * 阿里通义 API 配置
 * 注意：生产环境中，API_KEY 应该通过后端代理调用，不要暴露在前端
 */
const TONGYI_API_CONFIG = {
  // 图像生成 API 端点
  IMAGE_SYNTHESIS_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-synthesis/image-synthesis',
  // 图像编辑 API 端点 (用于图像融合)
  IMAGE_EDITING_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
  // 模型名称
  MODEL: 'wanx-v1',
}

/**
 * 生成设计效果图
 * 
 * 流程说明:
 * 1. 接收后院实景照片和产品效果图
 * 2. 调用通义图像融合API
 * 3. 返回融合后的设计效果图
 */
export async function generateDesignImage(
  request: DesignGenerateRequest
): Promise<DesignGenerateResponse> {
  try {
    // 构建 API 请求
    const apiRequest = {
      model: TONGYI_API_CONFIG.MODEL,
      input: {
        // 使用图像融合/编辑能力
        image_synthesis: {
          // 背景图（后院实景）
          base_image: request.background_image,
          // 前景图（产品效果图）
          reference_image: request.foreground_image,
          // 融合提示词
          prompt: getPromptByProductType(request.product_type),
          // 负面提示词
          negative_prompt: '模糊, 变形, 不自然, 拼接痕迹明显',
        }
      },
      parameters: {
        style: request.style || 'realistic',
        n: 1,
        size: '1024*1024',
      }
    }

    // 注意：实际调用时需要通过后端代理
    // 这里只是展示 API 调用结构
    const response = await fetch('/api/design/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    })

    if (!response.ok) {
      throw new Error(`API 调用失败: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      result_image: data.output?.results?.[0]?.url || data.result_image,
      task_id: data.request_id,
    }
  } catch (error) {
    console.error('生成设计图失败:', error)
    return {
      success: false,
      result_image: '',
      message: error instanceof Error ? error.message : '生成失败，请稍后重试',
    }
  }
}

/**
 * 根据产品类型获取融合提示词
 */
function getPromptByProductType(productType: string): string {
  const prompts: Record<string, string> = {
    sunroom: '将阳光房自然地融合到后院场景中，保持透视关系正确，光影效果真实，整体协调美观',
    pavilion: '将凉亭自然地放置在后院中，与周围环境协调，阴影和光线效果真实',
    roller_blind: '将防风卷帘安装效果自然地展示在阳台或廊道中，保持比例和透视正确',
    yard_accessory: '将庭院附属设施自然地融入后院环境，整体效果和谐统一',
  }
  return prompts[productType] || prompts.sunroom
}

/**
 * 检查 API 状态
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/design/health')
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取生成任务状态（用于异步任务）
 */
export async function getTaskStatus(taskId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result_image?: string
  message?: string
}> {
  try {
    const response = await fetch(`/api/design/task/${taskId}`)
    return await response.json()
  } catch (error) {
    return {
      status: 'failed',
      message: '获取任务状态失败',
    }
  }
}
