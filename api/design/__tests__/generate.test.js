/**
 * Vercel API - Design Generate 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 动态导入 handler（需要在测试环境中模拟）
const createMockHandler = () => {
  return async (req, res) => {
    // 模拟 res 对象
    const mockRes = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader: function(key, value) {
        this.headers[key] = value;
        return this;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      end: function() {
        return this;
      }
    };

    // 导入并执行 handler
    const handler = (await import('../generate.js')).default;
    await handler(req, mockRes);
    
    return mockRes;
  };
};

describe('Design Generate API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // 设置环境变量
    process.env.DASHSCOPE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.DASHSCOPE_API_KEY;
  });

  describe('HTTP 方法验证', () => {
    it('应该拒绝 GET 请求', async () => {
      const req = { method: 'GET', body: {} };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('应该处理 OPTIONS 预检请求', async () => {
      const req = { method: 'OPTIONS', body: {} };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('参数验证', () => {
    it('应该拒绝缺少背景图的请求', async () => {
      const req = {
        method: 'POST',
        body: {
          foreground_image: 'data:image/png;base64,test'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('背景图')
        })
      );
    });

    it('应该拒绝缺少前景图的请求', async () => {
      const req = {
        method: 'POST',
        body: {
          background_image: 'data:image/png;base64,test'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('API Key 验证', () => {
    it('应该在 API Key 未配置时返回错误', async () => {
      delete process.env.DASHSCOPE_API_KEY;

      const req = {
        method: 'POST',
        body: {
          background_image: 'data:image/png;base64,bg',
          foreground_image: 'data:image/png;base64,fg'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('API Key')
        })
      );
    });
  });

  describe('成功调用', () => {
    it('应该成功调用 DashScope API 并返回结果', async () => {
      const mockApiResponse = {
        output: {
          choices: [{
            message: {
              content: [{
                image: 'https://example.com/generated-image.png'
              }]
            }
          }]
        },
        request_id: 'test-request-id',
        usage: { input_tokens: 100, output_tokens: 50 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const req = {
        method: 'POST',
        body: {
          background_image: 'data:image/png;base64,bg',
          foreground_image: 'data:image/png;base64,fg',
          product_type: 'sunroom'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result_image: 'https://example.com/generated-image.png',
          request_id: 'test-request-id'
        })
      );
    });
  });

  describe('API 错误处理', () => {
    it('应该处理 DashScope API 错误响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: 'Rate limit exceeded' })
      });

      const req = {
        method: 'POST',
        body: {
          background_image: 'data:image/png;base64,bg',
          foreground_image: 'data:image/png;base64,fg'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const req = {
        method: 'POST',
        body: {
          background_image: 'data:image/png;base64,bg',
          foreground_image: 'data:image/png;base64,fg'
        }
      };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: '服务器错误'
        })
      );
    });
  });

  describe('产品类型提示词', () => {
    it('应该支持不同的产品类型', async () => {
      const productTypes = ['sunroom', 'pavilion', 'roller_blind', 'yard_accessory'];

      for (const productType of productTypes) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            output: {
              choices: [{
                message: {
                  content: [{ image: 'https://example.com/image.png' }]
                }
              }]
            },
            request_id: 'test-id'
          })
        });

        const req = {
          method: 'POST',
          body: {
            background_image: 'data:image/png;base64,bg',
            foreground_image: 'data:image/png;base64,fg',
            product_type: productType
          }
        };
        const res = {
          statusCode: 200,
          headers: {},
          setHeader: vi.fn().mockReturnThis(),
          status: vi.fn().mockReturnThis(),
          json: vi.fn().mockReturnThis(),
          end: vi.fn().mockReturnThis()
        };

        const handler = (await import('../generate.js')).default;
        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      }
    });
  });

  describe('CORS 头设置', () => {
    it('应该设置正确的 CORS 头', async () => {
      const req = { method: 'OPTIONS', body: {} };
      const res = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      };

      const handler = (await import('../generate.js')).default;
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });
  });
});
