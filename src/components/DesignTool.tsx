import React, { useState, useRef } from 'react'

interface ImageState {
  file: File | null
  preview: string | null
}

const DesignTool: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<ImageState>({ file: null, preview: null })
  const [foregroundImage, setForegroundImage] = useState<ImageState>({ file: null, preview: null })
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bgInputRef = useRef<HTMLInputElement>(null)
  const fgInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage({
          file,
          preview: reader.result as string
        })
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setImage: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage({
          file,
          preview: reader.result as string
        })
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const generateDesign = async () => {
    if (!backgroundImage.file || !foregroundImage.file) {
      setError('请先上传后院实景照片和产品效果图')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // 将图片转换为base64
      const bgBase64 = backgroundImage.preview?.split(',')[1]
      const fgBase64 = foregroundImage.preview?.split(',')[1]

      // 调用阿里通义API进行图像融合
      // 注意：实际部署时需要通过后端代理调用，避免暴露API密钥
      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          background_image: bgBase64,
          foreground_image: fgBase64,
          product_type: 'sunroom', // 可扩展为其他产品类型
        }),
      })

      if (!response.ok) {
        throw new Error('生成失败，请稍后重试')
      }

      const data = await response.json()
      setResultImage(data.result_image)
    } catch (err) {
      // 演示模式：显示模拟结果
      setError('API未配置，显示演示效果')
      // 模拟生成效果 - 实际使用时会调用真实API
      setTimeout(() => {
        setResultImage(backgroundImage.preview)
        setIsGenerating(false)
      }, 2000)
      return
    }

    setIsGenerating(false)
  }

  const resetAll = () => {
    setBackgroundImage({ file: null, preview: null })
    setForegroundImage({ file: null, preview: null })
    setResultImage(null)
    setError(null)
  }

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement('a')
      link.href = resultImage
      link.download = `design-${Date.now()}.png`
      link.click()
    }
  }

  return (
    <section id="design-tool" className="py-20 bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            智能设计工具
          </h2>
          <p className="text-lg text-secondary-300 max-w-2xl mx-auto">
            上传您客户的后院实景照片和产品效果图，AI 将自动生成专业的设计效果图
          </p>
        </div>

        {/* 流程步骤指示 */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <span className="ml-2 text-white text-sm md:text-base">上传实景</span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-secondary-600" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2 text-white text-sm md:text-base">上传效果图</span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-secondary-600" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 text-white text-sm md:text-base">AI 生成</span>
            </div>
          </div>
        </div>

        {/* 上传区域 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* 背景图上传 */}
          <div className="bg-secondary-800 rounded-2xl p-6 border border-secondary-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              后院实景照片
            </h3>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                backgroundImage.preview
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-secondary-600 hover:border-primary-400 hover:bg-secondary-700/50'
              }`}
              onClick={() => bgInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, setBackgroundImage)}
              onDragOver={handleDragOver}
            >
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, setBackgroundImage)}
              />
              {backgroundImage.preview ? (
                <div className="relative">
                  <img
                    src={backgroundImage.preview}
                    alt="后院实景"
                    className="max-h-48 mx-auto rounded-lg shadow-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setBackgroundImage({ file: null, preview: null })
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-secondary-400">点击或拖拽上传图片</p>
                  <p className="text-secondary-500 text-sm mt-2">支持 JPG, PNG, WEBP</p>
                </>
              )}
            </div>
          </div>

          {/* 效果图上传 */}
          <div className="bg-secondary-800 rounded-2xl p-6 border border-secondary-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              产品效果图
            </h3>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                foregroundImage.preview
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-secondary-600 hover:border-primary-400 hover:bg-secondary-700/50'
              }`}
              onClick={() => fgInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, setForegroundImage)}
              onDragOver={handleDragOver}
            >
              <input
                ref={fgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, setForegroundImage)}
              />
              {foregroundImage.preview ? (
                <div className="relative">
                  <img
                    src={foregroundImage.preview}
                    alt="产品效果图"
                    className="max-h-48 mx-auto rounded-lg shadow-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setForegroundImage({ file: null, preview: null })
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-secondary-400">点击或拖拽上传图片</p>
                  <p className="text-secondary-500 text-sm mt-2">阳光房、凉亭、卷帘等</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-center">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={generateDesign}
            disabled={isGenerating || !backgroundImage.preview || !foregroundImage.preview}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center ${
              isGenerating || !backgroundImage.preview || !foregroundImage.preview
                ? 'bg-secondary-700 text-secondary-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-primary-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI 生成中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                生成设计效果图
              </>
            )}
          </button>
          <button
            onClick={resetAll}
            className="px-6 py-3 rounded-full font-semibold border border-secondary-600 text-secondary-300 hover:bg-secondary-800 transition-all duration-300"
          >
            重置
          </button>
        </div>

        {/* 结果展示 */}
        {resultImage && (
          <div className="bg-secondary-800 rounded-2xl p-8 border border-secondary-700">
            <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              设计效果图
            </h3>
            <div className="relative max-w-3xl mx-auto">
              <img
                src={resultImage}
                alt="设计效果图"
                className="w-full rounded-xl shadow-2xl"
              />
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={downloadResult}
                  className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载效果图
                </button>
                <button
                  onClick={() => setResultImage(null)}
                  className="px-6 py-2 border border-secondary-600 text-secondary-300 rounded-full font-semibold hover:bg-secondary-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 产品类型说明 */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {[
            { name: '阳光房', icon: '🏠', desc: '全景玻璃阳光房' },
            { name: '凉亭', icon: '⛱️', desc: '户外休闲凉亭' },
            { name: '防风卷帘', icon: '🪟', desc: '阳台防风卷帘' },
            { name: '庭院附属物', icon: '🌳', desc: '各类庭院设施' },
          ].map((item) => (
            <div
              key={item.name}
              className="bg-secondary-800/50 rounded-xl p-4 text-center border border-secondary-700 hover:border-primary-500/50 transition-colors"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h4 className="text-white font-semibold">{item.name}</h4>
              <p className="text-secondary-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DesignTool
