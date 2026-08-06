import { getProducts, getProductCategories } from '@/lib/sanity'
import ProductGrid from '@/components/ProductGrid'
import ShopFilterBar from '@/components/ShopFilterBar'
import FadeIn from '@/components/FadeIn'

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const { category } = await searchParams

  const [products, categories] = await Promise.all([
    getProducts().catch(() => []),
    getProductCategories().catch(() => []),
  ])

  const filtered = category
    ? products.filter(p => p.categories?.some(c => c.slug.current === category))
    : products

  const activeCategories = categories.filter(cat =>
    products.some(p => p.categories?.some(c => c.slug.current === cat.slug.current))
  )

  return (
    <div className="page-content">
      {activeCategories.length > 1 && (
        <ShopFilterBar categories={activeCategories} activeSlug={category} />
      )}
      <FadeIn key={category || 'all'}>
        <ProductGrid products={filtered} />
      </FadeIn>
    </div>
  )
}
