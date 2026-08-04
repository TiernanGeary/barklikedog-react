import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page-content">
      <p><strong>rlynice</strong> is a creative project design studio by Tiernan Geary</p>
      <ul className="about-links">
        <li><Link href="/shipping-and-returns">Shipping &amp; Returns</Link></li>
        <li><Link href="/terms-and-conditions">Terms and Conditions</Link></li>
        <li><Link href="/privacy-policy">Privacy Policy</Link></li>
      </ul>
    </div>
  )
}
