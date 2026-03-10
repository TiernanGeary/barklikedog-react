import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const image = product.images?.[0]?.asset?.url

  return (
    <div className="product">
      {image && (
        <div className="product-image-wrapper">
          <Link href={`/shop/${product.slug.current}`}>
            <Image
              src={image}
              alt={product.images[0]?.alt || product.name}
              width={500}
              height={500}
              style={{ width: '100%', height: 'auto' }}
            />
          </Link>
        </div>
      )}
      <div className="product-title">
        <Link href={`/shop/${product.slug.current}`}>{product.name}</Link>
      </div>
      <div className="price">
        {product.salePrice ? (
          <>
            <del>${product.price.toFixed(2)}</del>{' '}
            <ins>${product.salePrice.toFixed(2)}</ins>
          </>
        ) : (
          <span>${product.price.toFixed(2)}</span>
        )}
      </div>
    </div>
  )
}
