import Link from 'next/link'

export default function CheckoutSuccess() {
  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1>Order Confirmed</h1>
      <p style={{ marginTop: '16px' }}>Thank you for your purchase.</p>
      <Link href="/shop" style={{ display: 'inline-block', marginTop: '24px' }}>
        ← Back to Shop
      </Link>
    </div>
  )
}
