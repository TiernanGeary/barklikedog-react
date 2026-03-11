import Link from 'next/link'

export default function CheckoutCancel() {
  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1>Order Cancelled</h1>
      <p style={{ marginTop: '16px' }}>Your checkout was cancelled. No charge was made.</p>
      <Link href="/shop" style={{ display: 'inline-block', marginTop: '24px' }}>
        ← Back to Shop
      </Link>
    </div>
  )
}
