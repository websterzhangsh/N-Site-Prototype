import React from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Gallery from './components/Gallery'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import DesignTool from './components/DesignTool'

function App() {
  return (
    <div className="min-h-screen bg-secondary-900">
      <Header />
      <main>
        <Hero />
        <Features />
        <DesignTool />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App