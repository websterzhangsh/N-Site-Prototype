import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    alt: "现代简约阳光房",
    title: "现代简约风格"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    alt: "欧式豪华阳光房",
    title: "欧式豪华风格"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    alt: "田园风格阳光房",
    title: "田园自然风格"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    alt: "智能阳光房",
    title: "智能科技风格"
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
    alt: "休闲娱乐阳光房",
    title: "休闲娱乐风格"
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    alt: "商务办公阳光房",
    title: "商务办公风格"
  }
]

const Gallery = () => {
  const [currentImage, setCurrentImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const nextImage = () => {
    setCurrentImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const openModal = (index: number) => {
    setCurrentImage(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">案例展示</h2>
          <p className="section-subtitle">
            精选成功案例，展现我们的专业实力和设计理念
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer"
              onClick={() => openModal(index)}
            >
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
                  <p className="text-sm">{image.alt}</p>
                  <Maximize2 className="w-8 h-8 mx-auto mt-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                onClick={closeModal}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative">
                <img 
                  src={galleryImages[currentImage].src} 
                  alt={galleryImages[currentImage].alt}
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white text-2xl font-semibold">
                    {galleryImages[currentImage].title}
                  </h3>
                  <p className="text-gray-200">
                    {galleryImages[currentImage].alt}
                  </p>
                </div>
              </div>

              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                onClick={prevImage}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                onClick={nextImage}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Gallery