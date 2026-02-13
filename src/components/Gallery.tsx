import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { products, type ProductCategory } from '../data/products'

interface GalleryProps {
  activeCategory: ProductCategory
}

const Gallery: React.FC<GalleryProps> = ({ activeCategory }) => {
  const [currentImage, setCurrentImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const images = products[activeCategory].galleryImages

  const nextImage = () => setCurrentImage((p) => (p >= images.length - 1 ? 0 : p + 1))
  const prevImage = () => setCurrentImage((p) => (p <= 0 ? images.length - 1 : p - 1))

  const openModal = (index: number) => {
    setCurrentImage(index)
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  return (
    <section id="gallery" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="section-title">Project Gallery</h2>
          <p className="section-subtitle">
            Showcasing our finest {products[activeCategory].label.toLowerCase()} installations
          </p>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {images.map((img, index) => (
            <div
              key={`${activeCategory}-gal-${index}`}
              className="group relative overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300"
              onClick={() => openModal(index)}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-60 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{img.title}</h3>
                  <p className="text-sm text-white/80">{img.alt}</p>
                  <Maximize2 className="w-6 h-6 mx-auto mt-3 text-white/70" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute -top-10 right-0 text-white/70 hover:text-white z-10"
                onClick={closeModal}
                aria-label="Close"
              >
                <X className="w-7 h-7" />
              </button>

              <img
                src={images[currentImage].src}
                alt={images[currentImage].alt}
                className="w-full h-auto rounded-lg"
              />

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <h3 className="text-white text-xl font-semibold">{images[currentImage].title}</h3>
                <p className="text-white/70 text-sm">{images[currentImage].alt}</p>
              </div>

              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                onClick={prevImage}
                aria-label="Previous"
              >
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                onClick={nextImage}
                aria-label="Next"
              >
                <ChevronRight className="w-9 h-9" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Gallery
