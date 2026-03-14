import type { PortableTextBlock } from 'next-sanity'

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    url: string
  }
  alt?: string
  hotspot?: { x: number; y: number }
}

export interface Category {
  _id: string
  name: string
  slug: { current: string }
}

export interface Product {
  _id: string
  name: string
  slug: { current: string }
  price: number
  salePrice?: number
  images: SanityImage[]
  categories: Category[]
  shortDescription?: string
  description?: PortableTextBlock[]
  year?: string
  stripePriceId?: string
  productType: 'simple' | 'variable'
  variants?: Array<{
    name: string
    option: string
    price: number
    stripePriceId?: string
  }>
}

export interface Post {
  _id: string
  title: string
  slug: { current: string }
  featuredImage?: SanityImage
  excerpt?: string
  body?: PortableTextBlock[]
  publishedAt: string
  categories?: Category[]
}

export interface MediaItem {
  _id: string
  title: string
  slug: { current: string }
  mediaType: 'photo' | 'video' | 'audio'
  featuredImage?: SanityImage
  description?: PortableTextBlock[]
  videoUrl?: string
  audioFile?: { asset: { url: string } }
  featured: boolean
  order: number
  publishedAt: string
}

export interface Page {
  _id: string
  title: string
  slug: { current: string }
  body?: PortableTextBlock[]
}

export interface RadioTrack {
  title: string
  label?: string
  audioUrl: string
  coverArt?: string
  status?: 'approved' | 'pending' | 'rejected'
  duration?: number
}

export interface RadioQueue {
  tracks: RadioTrack[]
  loopPlaylist: boolean
  currentTrackIndex: number
  currentTrackStartedAt?: string
}

export interface RadioSettings {
  moderationEnabled: boolean
  maxUploadSizeMB: number
}

export interface Comment {
  _id: string
  author_name: string
  date: string
  content: string
  parent?: string
}
