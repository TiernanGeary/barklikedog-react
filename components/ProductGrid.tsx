import type { WCProduct } from '@/lib/types'
import ProductCard from './ProductCard'

interface Props {
  products: WCProduct[]
}

export default function ProductGrid({ products }: Props) {
  if (!products.length) {
    return <p>No products found.</p>
  }

  return (
    <div className="products">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
