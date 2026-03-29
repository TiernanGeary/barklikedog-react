'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'

const SHIPPING_COST = { us: 8, intl: 20 }

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [region, setRegion] = useState<'us' | 'intl'>('us')

  const shipping = SHIPPING_COST[region]
  const orderTotal = total + shipping

  async function handleCheckout() {
    if (!items.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ priceId: i.priceId, quantity: i.quantity })),
          region,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout failed')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Cart</h1>

      {items.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link href="/shop" className="back-link" style={{ marginTop: 16, display: 'inline-block' }}>
            ← Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.priceId} className="cart-item">
                {item.image && (
                  <div className="cart-item-image">
                    <Image src={item.image} alt={item.name} width={80} height={80} style={{ width: 80, height: 80, objectFit: 'cover' }} />
                  </div>
                )}
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">${item.price.toFixed(2)}</div>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => updateQuantity(item.priceId, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.priceId, item.quantity + 1)}>+</button>
                </div>
                <div className="cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button className="cart-item-remove" onClick={() => removeItem(item.priceId)}>✕</button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-shipping-select">
                <label>Ship to:</label>
                <select value={region} onChange={e => setRegion(e.target.value as 'us' | 'intl')}>
                  <option value="us">United States — $8.00</option>
                  <option value="intl">International — $20.00</option>
                </select>
              </div>
              <div className="cart-summary-lines">
                <div className="cart-summary-line">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="cart-summary-line">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="cart-summary-line cart-summary-total">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="cart-actions">
              <button onClick={clearCart} className="cart-clear">Clear Cart</button>
              <button onClick={handleCheckout} disabled={loading} className="cart-checkout">
                {loading ? 'Redirecting...' : 'Checkout'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
