import Link from 'next/link'
import Image from 'next/image'
import type { WCProduct } from '@/lib/types'

interface Props {
  product: WCProduct
}

export default function ProductCard({ product }: Props) {
  const image = product.images[0]

  return (
    <div className="product">
      {image && (
        <div className="product-image-wrapper">
          <Link href={`/shop/${product.slug}`}>
            <Image
              src={image.src}
              alt={image.alt || product.name}
              width={500}
              height={500}
              style={{ width: '100%', height: 'auto' }}
            />
          </Link>
        </div>
      )}
      <div className="product-title">
        <Link href={`/shop/${product.slug}`}>{product.name}</Link>
      </div>
      <div
        className="price"
        dangerouslySetInnerHTML={{ __html: product.price_html }}
      />
    </div>
  )
}
