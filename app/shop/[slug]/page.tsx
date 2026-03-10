import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/sanity'
import ProductDetail from '@/components/ProductDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug).catch(() => null)
  if (!product) notFound()

  return (
    <div className="page-content">
      <ProductDetail product={product} />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug).catch(() => null)
  return { title: product?.name ?? 'Product' }
}
