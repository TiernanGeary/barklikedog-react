'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

export default function ProductDetail({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const matchedVariant = useMemo(() => {
    if (!selectedVariant || !product.variants) return null
    return product.variants.find(v => v.option === selectedVariant) ?? null
  }, [selectedVariant, product.variants])

  const displayPrice = matchedVariant?.price ?? product.salePrice ?? product.price

  const images = product.images || []
  const currentImage = images[selectedImage]?.asset?.url

  const priceId = matchedVariant?.stripePriceId ?? product.stripePriceId

  const handleBuy = useCallback(async () => {
    if (!priceId) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }, [priceId])

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
            <button
              className="buy-button"
              onClick={handleBuy}
              disabled={loading || (product.productType === 'variable' && !selectedVariant)}
            >
              {loading ? 'Redirecting...' : 'Buy Now'}
            </button>
          )}

          {product.shortDescription && (
            <div className="product-description">
              <p>{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="entry-content" style={{ marginTop: '30px' }}>
              <PortableText value={product.description} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
