import type { WCProduct, WCVariation, WCCategory } from './types'

// These are server-side only — never prefixed with NEXT_PUBLIC_
const WP_URL     = process.env.NEXT_PUBLIC_WP_URL     || 'https://wp.example.com'
const WC_KEY     = process.env.WC_CONSUMER_KEY        || ''
const WC_SECRET  = process.env.WC_CONSUMER_SECRET     || ''

const WC_API = `${WP_URL}/wp-json/wc/v3`

function authHeader(): Record<string, string> {
  if (!WC_KEY || !WC_SECRET) return {}
  const credentials = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
  return { Authorization: `Basic ${credentials}` }
}

async function wcFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${WC_API}${path}`, {
    headers: authHeader(),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`WC API error ${res.status}: ${path}`)
  return res.json()
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(options: {
  categorySlug?: string
  perPage?: number
} = {}): Promise<WCProduct[]> {
  const params = new URLSearchParams({
    per_page: String(options.perPage ?? 25),
    status: 'publish',
  })
  if (options.categorySlug) params.set('category', options.categorySlug)
  return wcFetch<WCProduct[]>(`/products?${params}`)
}

export async function getProduct(slug: string): Promise<WCProduct | null> {
  const products = await wcFetch<WCProduct[]>(`/products?slug=${slug}`)
  return products[0] ?? null
}

// ── Variations ───────────────────────────────────────────────────────────────

export async function getVariations(productId: number): Promise<WCVariation[]> {
  return wcFetch<WCVariation[]>(`/products/${productId}/variations?per_page=100`)
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<WCCategory[]> {
  const cats = await wcFetch<WCCategory[]>('/products/categories?per_page=100&hide_empty=true')
  return cats.filter(c => c.slug !== 'uncategorized')
}

// ── Cart URL helpers ──────────────────────────────────────────────────────────

export function addToCartUrl(
  product: WCProduct,
  options: {
    variationId?: number
    attributes?: Record<string, string>
    quantity?: number
  } = {}
): string {
  const base = WP_URL
  const params = new URLSearchParams({ 'add-to-cart': String(product.id) })
  if (options.variationId) params.set('variation_id', String(options.variationId))
  if (options.quantity)    params.set('quantity', String(options.quantity))
  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      params.set(`attribute_${name.toLowerCase().replace(/\s+/g, '-')}`, value)
    }
  }
  return `${base}/?${params}`
}
