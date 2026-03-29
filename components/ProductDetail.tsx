'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PortableText } from 'next-sanity'
import type { Product } from '@/lib/types'
import { useCart } from './CartProvider'

interface Props {
  product: Product
}

export default function ProductDetail({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [added, setAdded] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const { addItem, count } = useCart()
  const router = useRouter()

  const matchedVariant = useMemo(() => {
    if (!selectedVariant || !product.variants) return null
    return product.variants.find(v => v.option === selectedVariant) ?? null
  }, [selectedVariant, product.variants])

  const displayPrice = matchedVariant?.price ?? product.salePrice ?? product.price

  const images = product.images || []
  const currentImage = images[selectedImage]?.asset?.url

  const priceId = matchedVariant?.stripePriceId ?? product.stripePriceId

  const handleAddToCart = useCallback(() => {
    if (!priceId) return
    addItem({
      priceId,
      name: product.name + (matchedVariant ? ` — ${matchedVariant.option}` : ''),
      price: displayPrice,
      image: images[0]?.asset?.url,
      variant: matchedVariant?.option,
    })
    setAdded(true)
    setShowToast(true)
    setTimeout(() => setAdded(false), 1200)
  }, [priceId, addItem, product.name, matchedVariant, displayPrice, images])

  const variantNames = useMemo(() => {
    if (!product.variants?.length) return []
    const names = new Set(product.variants.map(v => v.name))
    return Array.from(names)
  }, [product.variants])

  return (
    <div className="single-product">
      <div className="product">
        {/* Images */}
        <div className="product-images">
          {currentImage && (
            <Image
              src={currentImage}
              alt={images[selectedImage]?.alt || product.name}
              width={800}
              height={800}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          )}
          {images.length > 1 && (
            <div className="product-gallery">
              {images.slice(1).map((img, i) => (
                <Image
                  key={i}
                  src={img.asset?.url}
                  alt={img.alt || product.name}
                  width={800}
                  height={800}
                  style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
                  onClick={() => setSelectedImage(i + 1)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="product-summary">
          <Link href="/shop" className="back-link">← Shop</Link>

          <h1 className="product-title">{product.name}</h1>

          <div className="price">
            {product.salePrice && !matchedVariant ? (
              <>
                <del>${product.price.toFixed(2)}</del>{' '}
                <ins>${product.salePrice.toFixed(2)}</ins>
              </>
            ) : (
              <span>${displayPrice.toFixed(2)}</span>
            )}
          </div>

          {product.shortDescription && (
            <div className="product-description">
              <p>{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="entry-content">
              <PortableText value={product.description} />
            </div>
          )}

          {product.year && (
            <div className="product-meta-item">
              <span className="product-meta-label">Year: </span>
              {product.year}
            </div>
          )}

          {/* Variants */}
          {product.productType === 'variable' && product.variants && variantNames.length > 0 && (
            <div className="variations">
              {variantNames.map(name => (
                <div key={name} className="variation-row">
                  <label>{name}</label>
                  <select
                    value={selectedVariant}
                    onChange={e => setSelectedVariant(e.target.value)}
                  >
                    <option value="">Select {name}</option>
                    {product.variants!
                      .filter(v => v.name === name)
                      .map(v => (
                        <option key={v.option} value={v.option}>
                          {v.option}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {priceId && (
            <div style={{ position: 'relative' }}>
              <button
                className="buy-button"
                onClick={handleAddToCart}
                disabled={product.productType === 'variable' && !selectedVariant}
              >
                {added ? 'Added ✓' : 'Add to Cart'}
              </button>
              {showToast && (
                <div className="cart-toast">
                  <span className="cart-toast-text">
                    {product.name}{matchedVariant ? ` — ${matchedVariant.option}` : ''} added
                  </span>
                  <button className="cart-toast-link" onClick={() => router.push('/cart')}>
                    View Cart ({count})  →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
