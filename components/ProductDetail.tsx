'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WCProduct, WCVariation } from '@/lib/types'
import { addToCartUrl } from '@/lib/woocommerce'

interface Props {
  product: WCProduct
  variations: WCVariation[]
}

export default function ProductDetail({ product, variations }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})

  // For variable products, find the matched variation
  const matchedVariation = useMemo<WCVariation | null>(() => {
    if (product.type !== 'variable' || !variations.length) return null
    const attrCount = product.attributes.length
    const allSelected = Object.keys(selectedAttrs).length === attrCount
    if (!allSelected) return null

    return variations.find(v =>
      v.attributes.every(a => selectedAttrs[a.name] === a.option)
    ) ?? null
  }, [selectedAttrs, variations, product])

  const displayPrice = matchedVariation
    ? matchedVariation.price_html
    : product.price_html

  const cartUrl = useMemo(() => {
    if (product.type === 'variable') {
      if (!matchedVariation) return null
      return addToCartUrl(product, {
        variationId: matchedVariation.id,
        attributes: selectedAttrs,
      })
    }
    return addToCartUrl(product)
  }, [product, matchedVariation, selectedAttrs])

  return (
    <div className="single-product">
      <div className="product">
        {/* Images */}
        <div className="product-images">
          {product.images[selectedImage] && (
            <Image
              src={product.images[selectedImage].src}
              alt={product.images[selectedImage].alt || product.name}
              width={800}
              height={800}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          )}
          {product.images.length > 1 && (
            <div className="product-gallery">
              {product.images.slice(1).map((img, i) => (
                <Image
                  key={i}
                  src={img.src}
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

          <div
            className="price"
            dangerouslySetInnerHTML={{ __html: displayPrice }}
          />

          {product.product_year && (
            <div className="product-meta-item">
              <span className="product-meta-label">Year: </span>
              {product.product_year}
            </div>
          )}

          {/* Variations */}
          {product.type === 'variable' && product.attributes.length > 0 && (
            <div className="variations">
              {product.attributes.map(attr => (
                <div key={attr.id} className="variation-row">
                  <label htmlFor={`attr-${attr.id}`}>{attr.name}</label>
                  <select
                    id={`attr-${attr.id}`}
                    value={selectedAttrs[attr.name] ?? ''}
                    onChange={e =>
                      setSelectedAttrs(prev => ({
                        ...prev,
                        [attr.name]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select {attr.name}</option>
                    {attr.options.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {product.short_description && (
            <div
              className="product-description"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {cartUrl ? (
            <a href={cartUrl} className="button add_to_cart_button">
              Add to Cart
            </a>
          ) : product.type === 'variable' ? (
            <button className="button add_to_cart_button" disabled>
              Select options
            </button>
          ) : null}

          {product.description && (
            <div
              className="entry-content"
              style={{ marginTop: '30px' }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
