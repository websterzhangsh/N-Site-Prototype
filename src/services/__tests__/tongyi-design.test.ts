/**
 * 阿里通义设计 API 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateDesignImage,
  checkApiStatus,
  getTaskStatus,
  DesignGenerateRequest,
} from '../tongyi-design'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('tongyi-design API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateDesignImage', () => {
    const validRequest: DesignGenerateRequest = {
      background_image: 'base64_background_image_data',
      foreground_image: 'base64_foreground_image_data',
      product_type: 'sunroom',
    }

    it('应该成功生成设计图', async () => {
      const mockResponse = {
        output: {
          results: [{ url: 'https://example.com/result.png' }]
        },
        request_id: 'task_123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateDesignImage(validRequest)

      expect(result.success).toBe(true)
      expect(result.result_image).toBe('https://example.com/result.png')
      expect(result.task_id).toBe('task_123')
    })

    it('应该处理 API 调用失败', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await generateDesignImage(validRequest)

      expect(result.success).toBe(false)
      expect(result.message).toContain('API 调用失败')
    })

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await generateDesignImage(validRequest)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
    })

    it('应该正确发送请求参数', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ output: { results: [{ url: 'test.png' }] } }),
      })

      await generateDesignImage(validRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/design/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.input.image_synthesis.base_image).toBe(validRequest.background_image)
      expect(callBody.input.image_synthesis.reference_image).toBe(validRequest.foreground_image)
    })

    it('应该支持不同产品类型', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: { results: [{ url: 'test.png' }] } }),
      })

      const productTypes: DesignGenerateRequest['product_type'][] = [
        'sunroom',
        'pavilion',
        'roller_blind',
        'yard_accessory'
      ]

      for (const productType of productTypes) {
        await generateDesignImage({ ...validRequest, product_type: productType })
        
        const callBody = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body)
        expect(callBody.input.image_synthesis.prompt).toBeTruthy()
      }
    })

    it('应该支持可选的样式参数', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ output: { results: [{ url: 'test.png' }] } }),
      })

      await generateDesignImage({
        ...validRequest,
        style: 'modern',
        quality: 'high',
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.parameters.style).toBe('modern')
    })
  })

  describe('checkApiStatus', () => {
    it('应该返回 true 当 API 可用时', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const result = await checkApiStatus()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/design/health')
    })

    it('应该返回 false 当 API 不可用时', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await checkApiStatus()

      expect(result).toBe(false)
    })

    it('应该返回 false 当网络错误时', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await checkApiStatus()

      expect(result).toBe(false)
    })
  })

  describe('getTaskStatus', () => {
    it('应该返回任务状态', async () => {
      const mockStatus = {
        status: 'completed',
        result_image: 'https://example.com/result.png',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      })

      const result = await getTaskStatus('task_123')

      expect(result.status).toBe('completed')
      expect(result.result_image).toBe('https://example.com/result.png')
      expect(mockFetch).toHaveBeenCalledWith('/api/design/task/task_123')
    })

    it('应该处理获取状态失败', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getTaskStatus('task_123')

      expect(result.status).toBe('failed')
      expect(result.message).toBe('获取任务状态失败')
    })

    it('应该正确处理不同的任务状态', async () => {
      const statuses = ['pending', 'processing', 'completed', 'failed'] as const

      for (const status of statuses) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status }),
        })

        const result = await getTaskStatus('task_123')
        expect(result.status).toBe(status)
      }
    })
  })
})
