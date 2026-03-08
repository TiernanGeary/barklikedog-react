import { notFound } from 'next/navigation'
import { getProduct, getVariations } from '@/lib/woocommerce'
import ProductDetail from '@/components/ProductDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug).catch(() => null)
  if (!product) notFound()

  const variations = product.type === 'variable'
    ? await getVariations(product.id).catch(() => [])
    : []

  return (
    <div className="page-content">
      <ProductDetail product={product} variations={variations} />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug).catch(() => null)
  return { title: product?.name ?? 'Product' }
}
