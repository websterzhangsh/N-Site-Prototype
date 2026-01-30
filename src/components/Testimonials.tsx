import React from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: "张先生",
    location: "北京朝阳区",
    rating: 5,
    content: "非常满意这次的阳光房建造服务！从设计到施工都非常专业，质量超出预期。现在每天在阳光房里喝茶看书，感觉生活品质提升了很多。",
    project: "15㎡现代简约阳光房"
  },
  {
    id: 2,
    name: "李女士",
    location: "上海浦东新区",
    rating: 5,
    content: "设计师很专业，充分考虑了我们的需求和院子的整体风格。施工团队也很负责，工期准时，细节处理得很到位。强烈推荐！",
    project: "20㎡欧式豪华阳光房"
  },
  {
    id: 3,
    name: "王先生",
    location: "广州天河区",
    rating: 5,
    content: "性价比很高的一次消费。阳光房的保温效果很好，夏天不热冬天不冷。售后服务也很及时，有问题都能快速解决。",
    project: "12㎡智能阳光房"
  }
]

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">客户评价</h2>
          <p className="section-subtitle">
            听听我们的客户怎么说
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="card relative hover:shadow-xl transition-all duration-300"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              <div className="mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current inline" />
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 italic">
                "{testimonial.content}"
              </p>
              
              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {testimonial.location}
                </div>
                <div className="text-xs text-primary font-medium">
                  {testimonial.project}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 bg-primary/5 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-gray-600">客户满意度</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">完成项目</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24</div>
              <div className="text-gray-600">小时售后</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5</div>
              <div className="text-gray-600">年质保</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials