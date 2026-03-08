import type { WPPost, WPPage, WPMediaItem, WPComment } from './types'

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://wp.example.com'
const API = `${WP_URL}/wp-json/wp/v2`

async function wpFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`WP API error ${res.status}: ${path}`)
  return res.json()
}

// ── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(perPage = 25): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(
    `/posts?_embed&per_page=${perPage}&orderby=date&order=desc`
  )
}

export async function getPost(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/posts?slug=${slug}&_embed`)
  return posts[0] ?? null
}

// ── Pages ────────────────────────────────────────────────────────────────────

export async function getPage(slug: string): Promise<WPPage | null> {
  const pages = await wpFetch<WPPage[]>(`/pages?slug=${slug}&_embed`)
  return pages[0] ?? null
}

// ── nv_media CPT ─────────────────────────────────────────────────────────────

export async function getMediaItems(perPage = 25): Promise<WPMediaItem[]> {
  return wpFetch<WPMediaItem[]>(
    `/nv_media?_embed&per_page=${perPage}&orderby=date&order=desc`
  )
}

export async function getMediaItem(slug: string): Promise<WPMediaItem | null> {
  const items = await wpFetch<WPMediaItem[]>(`/nv_media?slug=${slug}&_embed`)
  return items[0] ?? null
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(postId: number): Promise<WPComment[]> {
  return wpFetch<WPComment[]>(
    `/comments?post=${postId}&per_page=100&orderby=date&order=asc`
  )
}

export async function postComment(data: {
  post: number
  author_name: string
  author_email: string
  content: string
  parent?: number
}): Promise<WPComment> {
  const res = await fetch(`${API}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Comment submission failed (${res.status})`)
  }
  return res.json()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getFeaturedImage(
  post: WPPost | WPMediaItem
): { src: string; alt: string } | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  if (!media) return null
  return { src: media.source_url, alt: media.alt_text || '' }
}

export function getCategories(post: WPPost): Array<{ id: number; name: string; slug: string }> {
  return post._embedded?.['wp:term']?.[0] ?? []
}

export function getTags(post: WPPost): Array<{ id: number; name: string; slug: string }> {
  return post._embedded?.['wp:term']?.[1] ?? []
}

export function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  const years = Math.floor(diff / 31536000)
  const weeks = Math.floor(diff / 604800)
  const days  = Math.floor(diff / 86400)
  const hours = Math.floor(diff / 3600)
  const mins  = Math.floor(diff / 60)
  if (years >= 1) return `${years}y`
  if (weeks >= 1) return `${weeks}w`
  if (days >= 1)  return `${days}d`
  if (hours >= 1) return `${hours}h`
  if (mins >= 1)  return `${mins}m`
  return 'now'
}

export function avatarColor(name: string): string {
  const colors = ['#ff3700', '#16b3e8', '#ead814', '#684c0b', '#369843', '#d90a8a', '#cd2f2f']
  const idx = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}
