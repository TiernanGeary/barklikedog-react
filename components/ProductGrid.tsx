import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface Props {
  products: Product[]
}

export default function ProductGrid({ products }: Props) {
  if (!products.length) {
    return <p>No products found.</p>
  }

  return (
    <div className="products">
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
