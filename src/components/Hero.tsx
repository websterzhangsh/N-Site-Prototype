import React from 'react'
import { ArrowRight, Phone } from 'lucide-react'
import { products, categoryOrder, type ProductCategory } from '../data/products'

interface HeroProps {
  activeCategory: ProductCategory
  onCategoryChange: (cat: ProductCategory) => void
}

const Hero: React.FC<HeroProps> = ({ activeCategory, onCategoryChange }) => {
  const product = products[activeCategory]

  return (
    <section id="home" className="relative bg-background overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* ---- Top text ---- */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            Transform Your
            <span className="block text-primary">Outdoor Living Space</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Premium custom solutions designed to elevate your home
          </p>

          {/* ---- Product category tabs ---- */}
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            {categoryOrder.map((cat) => {
              const isActive = cat === activeCategory
              return (
                <button
                  key={cat}
                  onMouseEnter={() => onCategoryChange(cat)}
                  onClick={() => onCategoryChange(cat)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide
                    transition-all duration-300 border
                    ${isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }
                  `}
                >
                  {products[cat].label}
                </button>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground transition-all duration-300">
            {product.tagline}
          </p>
        </div>

        {/* ---- Hero image grid (3 images) ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
          {product.heroImages.map((img, i) => (
            <div
              key={`${activeCategory}-hero-${i}`}
              className={`
                relative overflow-hidden rounded-2xl shadow-lg
                ${i === 1 ? 'md:row-span-1 md:-mt-4 md:mb-4' : ''}
                group
              `}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="w-full h-56 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* ---- CTA buttons ---- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="btn-primary flex items-center justify-center group">
            Get Free Design
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <Phone className="mr-2 w-5 h-5" />
            Contact Us
          </button>
        </div>

        {/* ---- Stats ---- */}
        <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-muted-foreground text-sm">Projects</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">10yr</div>
            <div className="text-muted-foreground text-sm">Experience</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-muted-foreground text-sm">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
