import Link from 'next/link'
import Image from 'next/image'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })
}

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccess({ searchParams }: Props) {
  const { session_id } = await searchParams
  let lineItems: Stripe.LineItem[] = []

  if (session_id) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['line_items.data.price.product'],
      })
      lineItems = session.line_items?.data ?? []
    } catch {
      // If session retrieval fails, just show the basic confirmation
    }
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Order Confirmed</h1>
      <p>Thank you for your purchase.</p>

      {lineItems.length > 0 && (
        <div className="cart-items">
          {lineItems.map((item) => {
            const product = item.price?.product as Stripe.Product | undefined
            const image = product?.images?.[0]
            return (
              <div key={item.id} className="cart-item">
                {image && (
                  <div className="cart-item-image">
                    <Image
                      src={image}
                      alt={item.description || ''}
                      width={80}
                      height={80}
                      style={{ width: 80, height: 80, objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.description}</div>
                  <div className="cart-item-price">Qty: {item.quantity}</div>
                </div>
                <div className="cart-item-total">
                  ${((item.amount_total ?? 0) / 100).toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link href="/shop" className="back-link" style={{ marginTop: 24, display: 'inline-block' }}>
        ← Continue Shopping
      </Link>
    </div>
  )
}
