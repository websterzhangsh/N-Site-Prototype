export type ProductCategory = 'sunroom' | 'pavilion' | 'windproof'

export interface ProductInfo {
  id: ProductCategory
  label: string
  tagline: string
  heroImages: { src: string; alt: string }[]
  galleryImages: { src: string; alt: string; title: string }[]
}

export const products: Record<ProductCategory, ProductInfo> = {
  sunroom: {
    id: 'sunroom',
    label: 'Sun Room',
    tagline: 'Bright, open living spaces bathed in natural light',
    heroImages: [
      { src: '/images/products/sunroom/hero-1.jpg', alt: 'Residential sun room with glass walls' },
      { src: '/images/products/sunroom/hero-2.jpg', alt: 'Commercial sun room installation' },
      { src: '/images/products/sunroom/hero-3.jpg', alt: 'Pool enclosure sun room' },
    ],
    galleryImages: [
      { src: '/images/products/sunroom/gallery-1.jpg', alt: 'Modern residential sun room', title: 'Residential Living' },
      { src: '/images/products/sunroom/gallery-2.jpg', alt: 'Spacious sun room interior', title: 'Open Space Design' },
      { src: '/images/products/sunroom/gallery-3.jpg', alt: 'Commercial sun room project', title: 'Commercial Project' },
      { src: '/images/products/sunroom/gallery-4.jpg', alt: 'Sun room with panoramic view', title: 'Panoramic View' },
      { src: '/images/products/sunroom/gallery-5.jpg', alt: 'Pool-side sun room enclosure', title: 'Pool Enclosure' },
      { src: '/images/products/sunroom/gallery-6.jpg', alt: 'Sun room with swimming pool', title: 'Luxury Pool Room' },
    ],
  },
  pavilion: {
    id: 'pavilion',
    label: 'Pavilion',
    tagline: 'Elegant outdoor shelters for gatherings and relaxation',
    heroImages: [
      { src: '/images/products/pavilion/hero-1.jpg', alt: 'Modern aluminum pavilion' },
      { src: '/images/products/pavilion/hero-2.jpg', alt: 'Garden pavilion with seating' },
      { src: '/images/products/pavilion/hero-3.jpg', alt: 'Luxury outdoor pavilion' },
    ],
    galleryImages: [
      { src: '/images/products/pavilion/gallery-1.jpg', alt: 'Contemporary pavilion design', title: 'Contemporary Style' },
      { src: '/images/products/pavilion/gallery-2.jpg', alt: 'Pavilion with louvered roof', title: 'Louvered Roof' },
      { src: '/images/products/pavilion/gallery-3.jpg', alt: 'Backyard pavilion setup', title: 'Backyard Retreat' },
      { src: '/images/products/pavilion/gallery-4.jpg', alt: 'Pavilion with LED lighting', title: 'LED Ambiance' },
      { src: '/images/products/pavilion/gallery-5.jpg', alt: 'Large entertaining pavilion', title: 'Entertainment Space' },
      { src: '/images/products/pavilion/gallery-6.jpg', alt: 'Pavilion with dining area', title: 'Outdoor Dining' },
    ],
  },
  windproof: {
    id: 'windproof',
    label: 'Windproof Roller Shutter',
    tagline: 'Smart protection against wind, rain, and harsh weather',
    heroImages: [
      { src: '/images/products/windproof/hero-1.jpg', alt: 'Windproof roller shutter system' },
      { src: '/images/products/windproof/hero-2.jpg', alt: 'Electric roller shutter installation' },
      { src: '/images/products/windproof/hero-3.jpg', alt: 'Outdoor roller shutter protection' },
    ],
    galleryImages: [
      { src: '/images/products/windproof/gallery-1.jpg', alt: 'Motorized windproof shutter', title: 'Smart Motorized' },
      { src: '/images/products/windproof/gallery-2.jpg', alt: 'Transparent roller shutter', title: 'Clear View Shield' },
      { src: '/images/products/windproof/gallery-3.jpg', alt: 'Patio roller shutter', title: 'Patio Protection' },
      { src: '/images/products/windproof/gallery-4.jpg', alt: 'Commercial roller shutter', title: 'Commercial Grade' },
      { src: '/images/products/windproof/gallery-5.jpg', alt: 'Retractable wind barrier', title: 'Retractable Barrier' },
      { src: '/images/products/windproof/gallery-6.jpg', alt: 'Full coverage wind shield', title: 'Full Coverage' },
    ],
  },
}

export const categoryOrder: ProductCategory[] = ['sunroom', 'pavilion', 'windproof']
