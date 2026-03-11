import { client } from '@/sanity/lib/client'
import imageUrlBuilder from '@sanity/image-url'
import type { Product, Post, MediaItem, Page, Category, SanityImage } from './types'

// ── Site Settings ───────────────────────────────────────────────────────────

export async function isComingSoon(): Promise<boolean> {
  const settings = await client.fetch(
    `*[_type == "siteSettings" && _id == "siteSettings"][0] { comingSoon }`
  )
  return settings?.comingSoon ?? false
}

// ── Image URL helper ────────────────────────────────────────────────────────

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImage) {
  return builder.image(source)
}

// ── Products ────────────────────────────────────────────────────────────────

export async function getProducts(perPage = 25): Promise<Product[]> {
  return client.fetch(
    `*[_type == "product"] | order(_createdAt desc) [0...$perPage] {
      _id, name, slug, price, salePrice, year, productType, shortDescription, stripePriceId,
      images[] { _type, asset-> { _ref, url }, alt },
      categories[]-> { _id, name, slug },
      variants
    }`,
    { perPage }
  )
}

export async function getProduct(slug: string): Promise<Product | null> {
  return client.fetch(
    `*[_type == "product" && slug.current == $slug][0] {
      _id, name, slug, price, salePrice, year, productType, shortDescription, description, stripePriceId,
      images[] { _type, asset-> { _ref, url }, alt },
      categories[]-> { _id, name, slug },
      variants
    }`,
    { slug }
  )
}

export async function getProductCategories(): Promise<Category[]> {
  return client.fetch(
    `*[_type == "category" && count(*[_type == "product" && references(^._id)]) > 0] {
      _id, name, slug,
      "count": count(*[_type == "product" && references(^._id)])
    }`
  )
}

// ── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(perPage = 25): Promise<Post[]> {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) [0...$perPage] {
      _id, title, slug, excerpt, publishedAt,
      featuredImage { _type, asset-> { _ref, url }, alt },
      categories[]-> { _id, name, slug }
    }`,
    { perPage }
  )
}

export async function getPost(slug: string): Promise<Post | null> {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id, title, slug, excerpt, body, publishedAt,
      featuredImage { _type, asset-> { _ref, url }, alt },
      categories[]-> { _id, name, slug }
    }`,
    { slug }
  )
}

// ── Media ───────────────────────────────────────────────────────────────────

export async function getMediaItems(perPage = 25): Promise<MediaItem[]> {
  return client.fetch(
    `*[_type == "media"] | order(featured desc, order asc, publishedAt desc) [0...$perPage] {
      _id, title, slug, mediaType, featured, order, publishedAt, videoUrl,
      featuredImage { _type, asset-> { _ref, url }, alt },
      audioFile { asset-> { url } }
    }`,
    { perPage }
  )
}

export async function getMediaItem(slug: string): Promise<MediaItem | null> {
  return client.fetch(
    `*[_type == "media" && slug.current == $slug][0] {
      _id, title, slug, mediaType, featured, order, publishedAt, description, videoUrl,
      featuredImage { _type, asset-> { _ref, url }, alt },
      audioFile { asset-> { url } }
    }`,
    { slug }
  )
}

// ── Pages ───────────────────────────────────────────────────────────────────

export async function getPage(slug: string): Promise<Page | null> {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug][0] {
      _id, title, slug, body
    }`,
    { slug }
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  const years = Math.floor(diff / 31536000)
  const weeks = Math.floor(diff / 604800)
  const days = Math.floor(diff / 86400)
  const hours = Math.floor(diff / 3600)
  const mins = Math.floor(diff / 60)
  if (years >= 1) return `${years}y`
  if (weeks >= 1) return `${weeks}w`
  if (days >= 1) return `${days}d`
  if (hours >= 1) return `${hours}h`
  if (mins >= 1) return `${mins}m`
  return 'now'
}

export function avatarColor(name: string): string {
  const colors = ['#ff3700', '#16b3e8', '#ead814', '#684c0b', '#369843', '#d90a8a', '#cd2f2f']
  const idx = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}
