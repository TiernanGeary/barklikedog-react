'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  if (pathname === '/' || pathname.startsWith('/studio')) return null

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('https://formspree.io/f/mkjwwojj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer id="footer">
      <div className="footer-main">
        <div className="footer-col footer-col-newsletter">
          <h4>Newsletter</h4>
          <p>Sign up to receive updates and exclusive access to our projects</p>
          {status === 'success' ? (
            <p className="footer-success">Thank you for subscribing!</p>
          ) : (
            <>
              <form className="footer-subscribe" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? '...' : 'SUBSCRIBE'}
                </button>
              </form>
              {status === 'error' && <p className="footer-error">Something went wrong. Try again.</p>}
              <p className="footer-legal-text">
                By sharing your email and subscribing, you agree to receive email notifications.
              </p>
            </>
          )}
        </div>

        <div className="footer-col">
          <h4>Info</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/shipping-and-returns">Shipping &amp; Returns</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link href="/terms-and-conditions">Terms and Conditions</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Social</h4>
          <ul>
            <li><a href="https://instagram.com/rlyrlynice" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Bark Like Dog</span>
      </div>
    </footer>
  )
}
