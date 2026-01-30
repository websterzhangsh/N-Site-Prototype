import React from 'react'
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-primary">阳光房专家</h3>
            <p className="text-gray-400 mb-6">
              专业阳光房设计与建造服务商，致力于为客户打造理想的休闲生活空间。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-400 hover:text-primary transition-colors">首页</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-primary transition-colors">产品特色</a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-primary transition-colors">案例展示</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-primary transition-colors">客户评价</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-primary transition-colors">联系我们</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">服务项目</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">阳光房设计</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">阳光房建造</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">改造升级</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">维护保养</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">咨询服务</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">联系我们</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-primary mr-3" />
                <span className="text-gray-400">400-888-8888</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-primary mr-3" />
                <span className="text-gray-400">info@sunroom.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-primary mr-3" />
                <span className="text-gray-400">北京市朝阳区建国路88号</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 阳光房专家. 保留所有权利. 京ICP备12345678号
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer