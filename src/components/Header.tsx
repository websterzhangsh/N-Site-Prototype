import React, { useState } from 'react'
import { Menu, X, Phone, Mail } from 'lucide-react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-secondary-900 border-b border-secondary-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary-400">
              阳光房专家
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-secondary-300 hover:text-primary-400 transition-colors">首页</a>
            <a href="#features" className="text-secondary-300 hover:text-primary-400 transition-colors">产品特色</a>
            <a href="#design-tool" className="text-secondary-300 hover:text-primary-400 transition-colors flex items-center">
              <span className="mr-1">✨</span>智能设计
            </a>
            <a href="#gallery" className="text-secondary-300 hover:text-primary-400 transition-colors">案例展示</a>
            <a href="#testimonials" className="text-secondary-300 hover:text-primary-400 transition-colors">客户评价</a>
            <a href="#contact" className="text-secondary-300 hover:text-primary-400 transition-colors">联系我们</a>
          </nav>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center text-sm text-secondary-400">
              <Phone className="w-4 h-4 mr-1" />
              <span>400-888-8888</span>
            </div>
            <div className="flex items-center text-sm text-secondary-400">
              <Mail className="w-4 h-4 mr-1" />
              <span>info@sunroom.com</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-secondary-300"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-700">
            <nav className="flex flex-col space-y-3">
              <a href="#home" className="text-secondary-300 hover:text-primary-400 transition-colors">首页</a>
              <a href="#features" className="text-secondary-300 hover:text-primary-400 transition-colors">产品特色</a>
              <a href="#design-tool" className="text-secondary-300 hover:text-primary-400 transition-colors flex items-center">
                <span className="mr-1">✨</span>智能设计
              </a>
              <a href="#gallery" className="text-secondary-300 hover:text-primary-400 transition-colors">案例展示</a>
              <a href="#testimonials" className="text-secondary-300 hover:text-primary-400 transition-colors">客户评价</a>
              <a href="#contact" className="text-secondary-300 hover:text-primary-400 transition-colors">联系我们</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
