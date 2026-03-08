import { getProducts, getCategories } from '@/lib/woocommerce'
import ProductGrid from '@/components/ProductGrid'
import ShopFilterBar from '@/components/ShopFilterBar'

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const { category } = await searchParams

  const [products, categories] = await Promise.all([
    getProducts({ categorySlug: category }).catch(() => []),
    getCategories().catch(() => []),
  ])

  return (
    <div className="page-content">
      <ShopFilterBar categories={categories} activeSlug={category} />
      <ProductGrid products={products} />
    </div>
  )
}
