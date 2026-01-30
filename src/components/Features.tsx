import React from 'react'
import { 
  Shield, 
  Zap, 
  Thermometer, 
  Droplets, 
  Ruler, 
  Award,
  CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: "高品质材料",
    description: "采用优质铝合金框架和钢化玻璃，坚固耐用，安全可靠"
  },
  {
    icon: Thermometer,
    title: "智能温控",
    description: "先进的通风系统和遮阳设计，四季舒适宜人"
  },
  {
    icon: Droplets,
    title: "防水防漏",
    description: "专业密封工艺，有效防止雨水渗透，经久耐用"
  },
  {
    icon: Zap,
    title: "节能环保",
    description: "优良的保温隔热性能，降低能耗，绿色环保"
  },
  {
    icon: Ruler,
    title: "个性化定制",
    description: "根据您的需求和空间特点，量身定制专属方案"
  },
  {
    icon: Award,
    title: "专业施工",
    description: "经验丰富的施工团队，标准化安装流程，品质保障"
  }
]

const Features = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">为什么选择我们的阳光房</h2>
          <p className="section-subtitle">
            我们致力于为每一位客户提供最优质的阳光房解决方案
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Process section */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            服务流程
          </h3>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "免费咨询", desc: "详细沟通需求" },
              { step: "02", title: "现场测量", desc: "专业精准测量" },
              { step: "03", title: "方案设计", desc: "3D效果图展示" },
              { step: "04", title: "施工安装", desc: "标准化施工" }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h4 className="text-xl font-semibold mb-2 text-gray-900">
                  {item.title}
                </h4>
                <p className="text-gray-600">
                  {item.desc}
                </p>
                
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 h-1 bg-primary/20">
                    <CheckCircle className="w-6 h-6 text-primary absolute -right-3 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features