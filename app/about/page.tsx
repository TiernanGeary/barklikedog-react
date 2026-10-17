import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page-content">
      <p><strong>rlynice</strong> is a creative product design studio by Tiernan Geary</p>
      <p>
        We don’t usually accept returns, but if there’s a mistake with your order
        or a problem with your product, please{' '}
        <a href="mailto:hello@barklikedog.com" style={{ textDecoration: 'underline' }}>get in touch</a>. We’ll review your
        concerns and work with you on a fair solution.
      </p>
      <ul className="about-links">
        <li><Link href="/shipping-and-returns">Shipping &amp; Returns</Link></li>
        <li><Link href="/terms-and-conditions">Terms and Conditions</Link></li>
        <li><Link href="/privacy-policy">Privacy Policy</Link></li>
      </ul>
    </div>
  )
}
