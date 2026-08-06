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
    <div className="page-content" style={{ paddingTop: '60px' }}>
      <h1>Order Confirmed</h1>
      <p style={{ marginTop: '12px' }}>Thank you for your purchase.</p>

      {lineItems.length > 0 && (
        <div className="order-summary">
          {lineItems.map((item) => {
            const product = item.price?.product as Stripe.Product | undefined
            const image = product?.images?.[0]
            return (
              <div key={item.id} className="order-item">
                {image && (
                  <div className="order-item-image">
                    <Image
                      src={image}
                      alt={item.description || ''}
                      width={80}
                      height={80}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {(item.quantity ?? 1) > 1 && (
                      <span className="order-item-qty">{item.quantity}</span>
                    )}
                  </div>
                )}
                <div className="order-item-details">
                  <span className="order-item-name">{item.description}</span>
                  <span className="order-item-price">
                    ${((item.amount_total ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link href="/shop" style={{ display: 'inline-block', marginTop: '32px' }}>
        ← Back to Shop
      </Link>
    </div>
  )
}
