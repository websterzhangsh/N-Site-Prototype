import React, { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Gallery from './components/Gallery'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import DesignTool from './components/DesignTool'
import { type ProductCategory } from './data/products'

function App() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('sunroom')

  return (
    <div className="min-h-screen bg-secondary-900">
      <Header />
      <main>
        <Hero activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <Features />
        <DesignTool />
        <Gallery activeCategory={activeCategory} />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
