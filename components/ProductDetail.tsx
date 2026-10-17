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
  const [selectedVariant, setSelectedVariant] = useState<string>(
    product.productType === 'variable' && product.variants?.length
      ? (product.variants.find(v => !v.soldOut)?._key ?? product.variants[0]._key)
      : ''
  )
  const [added, setAdded] = useState(false)
  const [lastAddedName, setLastAddedName] = useState<string | null>(null)
  const { addItem, count } = useCart()
  const router = useRouter()

  const matchedVariant = useMemo(() => {
    if (!selectedVariant || !product.variants) return null
    return product.variants.find(v => v._key === selectedVariant) ?? null
  }, [selectedVariant, product.variants])

  const displayPrice = matchedVariant?.price ?? product.salePrice ?? product.price

  const images = product.images || []
  const currentImage = images[selectedImage]?.asset?.url

  const priceId = product.productType === 'variable'
    ? matchedVariant?.stripePriceId
    : product.stripePriceId

  const handleAddToCart = useCallback(() => {
    if (!priceId || product.soldOut || matchedVariant?.soldOut) return
    const itemName = product.name + (matchedVariant ? ` — ${matchedVariant.option}` : '')
    addItem({
      productId: product._id,
      variantId: matchedVariant?._key,
      priceId,
      name: itemName,
      price: displayPrice,
      image: images[0]?.asset?.url,
      variant: matchedVariant?.option,
    })
    setAdded(true)
    setLastAddedName(itemName)
    setTimeout(() => setAdded(false), 1200)
  }, [priceId, addItem, product._id, product.name, product.soldOut, matchedVariant, displayPrice, images])

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
          <div className="product-image-main">
            {currentImage && (
              <Image draggable={false}
                src={currentImage}
                alt={images[selectedImage]?.alt || product.name}
                width={600}
                height={800}
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="product-thumbnails">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-thumbnail${selectedImage === i ? ' product-thumbnail--active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <Image draggable={false}
                    src={img.asset?.url}
                    alt={img.alt || product.name}
                    width={100}
                    height={100}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
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
                  <div className="variant-buttons">
                    {product.variants!
                      .filter(v => v.name === name)
                      .map(v => (
                        <button
                          key={v._key}
                          type="button"
                          className={`variant-btn${selectedVariant === v._key ? ' variant-btn--active' : ''}${v.soldOut ? ' variant-btn--sold-out' : ''}`}
                          onClick={() => !v.soldOut && setSelectedVariant(v._key)}
                          disabled={v.soldOut}
                        >
                          {v.option}{v.soldOut ? ' ✕' : ''}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!priceId && product.productType === 'variable' && (
            <p>This option is currently unavailable.</p>
          )}
          {priceId && (
            <div style={{ position: 'relative' }}>
              <button
                className="buy-button"
                onClick={handleAddToCart}
                disabled={product.soldOut || matchedVariant?.soldOut || (product.productType === 'variable' && !selectedVariant)}
              >
                {product.soldOut || matchedVariant?.soldOut ? 'Sold Out' : added ? 'Added ✓' : 'Add to Cart'}
              </button>
              {lastAddedName !== null && (
                <div className="cart-toast">
                  <span className="cart-toast-text">
                    {lastAddedName} added
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
