import React from 'react'
import { ArrowRight, Phone, Calendar } from 'lucide-react'

const Hero = () => {
  return (
    <section id="home" className="relative bg-gradient-to-br from-blue-50 to-cyan-50 py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              打造您的
              <span className="text-primary block">理想阳光房</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              专业阳光房设计与建造服务，采用高品质材料，提供个性化定制方案，
              让您的家拥有一个四季皆宜的休闲空间。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <button className="btn-primary flex items-center justify-center group">
                免费设计方案
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-secondary flex items-center justify-center">
                <Phone className="mr-2 w-5 h-5" />
                立即咨询
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-gray-600">成功案例</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10年</div>
                <div className="text-gray-600">行业经验</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-gray-600">客户满意</div>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gray-200 rounded-xl h-80 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🏠</div>
                  <p className="text-lg font-medium">阳光房效果图</p>
                  <p className="text-sm">专业3D设计展示</p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg animate-float">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg animate-float" style={{animationDelay: '1s'}}>
              <Phone className="w-8 h-8 text-cyan-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero