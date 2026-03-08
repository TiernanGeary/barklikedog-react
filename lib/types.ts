export interface WPPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>
  }
}

export interface WPPage {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
}

export interface WPMediaItem {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  date: string
  featured_media: number
  nv_media_type: string        // 'photo' | 'video' | 'audio'
  nv_video_url: string
  nv_audio_url: string
  nv_media_featured: string    // '0' | '1'
  nv_media_order: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
  }
}

export interface WCProduct {
  id: number
  slug: string
  name: string
  price: string
  regular_price: string
  sale_price: string
  price_html: string
  images: Array<{ src: string; alt: string }>
  categories: Array<{ id: number; name: string; slug: string }>
  short_description: string
  description: string
  product_year?: string
  type: string   // 'simple' | 'variable'
  attributes: Array<{
    id: number
    name: string
    options: string[]
  }>
  variations: number[]
}

export interface WCVariation {
  id: number
  price: string
  price_html: string
  attributes: Array<{
    name: string
    option: string
  }>
}

export interface WCCategory {
  id: number
  name: string
  slug: string
  count: number
}

export interface WPComment {
  id: number
  author_name: string
  author_url: string
  date: string
  content: { rendered: string }
  parent: number
  status: string
}
