import { getProducts, getProductCategories } from '@/lib/sanity'
import ProductGrid from '@/components/ProductGrid'
import ShopFilterBar from '@/components/ShopFilterBar'

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

  return (
    <div className="page-content">
      <ShopFilterBar categories={categories} activeSlug={category} />
      <ProductGrid products={filtered} />
    </div>
  )
}
