export type ProductCategory = 'sunroom' | 'pergola' | 'windproof'

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
  pergola: {
    id: 'pergola',
    label: 'Pergola',
    tagline: 'Elegant outdoor shelters for gatherings and relaxation',
    heroImages: [
      { src: '/images/products/pergola/hero-1.jpg', alt: 'Modern aluminum pergola' },
      { src: '/images/products/pergola/hero-2.jpg', alt: 'Garden pergola with seating' },
      { src: '/images/products/pergola/hero-3.jpg', alt: 'Luxury outdoor pergola' },
    ],
    galleryImages: [
      { src: '/images/products/pergola/gallery-1.jpg', alt: 'Contemporary pergola design', title: 'Contemporary Style' },
      { src: '/images/products/pergola/gallery-2.jpg', alt: 'Pergola with louvered roof', title: 'Louvered Roof' },
      { src: '/images/products/pergola/gallery-3.jpg', alt: 'Backyard pergola setup', title: 'Backyard Retreat' },
      { src: '/images/products/pergola/gallery-4.jpg', alt: 'Pergola with LED lighting', title: 'LED Ambiance' },
      { src: '/images/products/pergola/gallery-5.jpg', alt: 'Large entertaining pergola', title: 'Entertainment Space' },
      { src: '/images/products/pergola/gallery-6.jpg', alt: 'Pergola with dining area', title: 'Outdoor Dining' },
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

export const categoryOrder: ProductCategory[] = ['sunroom', 'pergola', 'windproof']
