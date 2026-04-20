'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { useCart } from './CartProvider'

const LOGO_COLORS = [
  { color: '#ffffff', weight: 4 },
  { color: '#000000', weight: 4 },
  { color: '#A8C8F5', weight: 1 },
  { color: '#B2E4C3', weight: 1 },
  { color: '#FAF0A8', weight: 1 },
  { color: '#F7A8D8', weight: 1 },
  { color: '#F5A8A8', weight: 1 },
  { color: '#518EE4', weight: 1 },
  { color: '#83D29E', weight: 1 },
  { color: '#F6DE69', weight: 1 },
  { color: '#EF43AD', weight: 1 },
  { color: '#ED4D4D', weight: 1 },
]

function pickWeighted(): string {
  const total = LOGO_COLORS.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const c of LOGO_COLORS) {
    r -= c.weight
    if (r <= 0) return c.color
  }
  return LOGO_COLORS[0].color
}

const NAV_ITEMS = [
  { title: 'Home', href: '/' },
  { title: 'Shop', href: '/shop' },
  { title: 'Posts', href: '/posts' },
  { title: 'About', href: '/about' },
]

const STROKE = 3
const DASH = 8
const HALF = STROKE / 2

/** Compute a dash-gap pattern so the edge starts and ends with a full dash. */
function fitDashes(length: number) {
  // n dashes + (n-1) gaps = length → n = round((length + gap) / (dash + gap))
  const n = Math.max(2, Math.round((length + DASH) / (DASH + DASH)))
  const gap = (length - n * DASH) / (n - 1)
  return `${DASH} ${Math.max(gap, 1)}`
}

function DashedBorder() {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const hDash = fitDashes(size.w)
  const vDash = fitDashes(size.h)

  return (
    <svg ref={ref} className="header-border" aria-hidden="true">
      <defs>
        <linearGradient id="rb" x1="0" y1="0" x2={size.w} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#518EE4" />
          <stop offset="25%" stopColor="#83D29E" />
          <stop offset="50%" stopColor="#F6DE69" />
          <stop offset="75%" stopColor="#EF43AD" />
          <stop offset="100%" stopColor="#ED4D4D" />
        </linearGradient>
      </defs>
      {size.w > 0 && (
        <>
          {/* top */}
          <line x1={0} y1={HALF} x2={size.w} y2={HALF}
            stroke="url(#rb)" strokeWidth={STROKE} strokeDasharray={hDash} strokeLinecap="butt" />
          {/* bottom */}
          <line x1={0} y1={size.h - HALF} x2={size.w} y2={size.h - HALF}
            stroke="url(#rb)" strokeWidth={STROKE} strokeDasharray={hDash} strokeLinecap="butt" />
          {/* left */}
          <line x1={HALF} y1={0} x2={HALF} y2={size.h}
            stroke="url(#rb)" strokeWidth={STROKE} strokeDasharray={vDash} strokeLinecap="butt" />
          {/* right */}
          <line x1={size.w - HALF} y1={0} x2={size.w - HALF} y2={size.h}
            stroke="url(#rb)" strokeWidth={STROKE} strokeDasharray={vDash} strokeLinecap="butt" />
        </>
      )}
    </svg>
  )
}

export default function Header({ comingSoon = false }: { comingSoon?: boolean }) {
  const pathname = usePathname()
  const logoColor = useRef(pickWeighted())
  const { count } = useCart()

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header id="site-header">
        <DashedBorder />
        <Link
          href="/"
          className="header-logo"
          aria-label="rlynice home"
          onClick={e => {
            if (pathname === '/') {
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('regenerate-background'))
            }
          }}
        >
          <svg viewBox="0 0 1186.05 344.44" xmlns="http://www.w3.org/2000/svg" style={{ height: 35, width: 'auto', display: 'block' }}>
            <g fill={logoColor.current}>
              <path d="M51.96,75.82v36.95h.77c2.56-6.16,6.03-11.86,10.39-17.13,4.36-5.26,9.36-9.75,15.01-13.47,5.64-3.72,11.67-6.6,18.09-8.66,6.41-2.05,13.08-3.08,20.01-3.08,3.59,0,7.56.64,11.93,1.92v50.8c-2.57-.51-5.65-.96-9.24-1.35-3.6-.38-7.06-.58-10.39-.58-10.01,0-18.47,1.67-25.4,5-6.93,3.34-12.51,7.89-16.74,13.66-4.23,5.77-7.25,12.51-9.04,20.2-1.8,7.7-2.69,16.04-2.69,25.02v89.67H0V75.82h51.96Z"/>
              <path d="M205.89,0v274.78h-54.65V0h54.65Z"/>
              <path d="M322.5,334.05c-10.52,6.93-25.15,10.39-43.87,10.39-5.65,0-11.23-.19-16.74-.58-5.52-.38-11.1-.84-16.74-1.35v-45.03c5.13.51,10.39,1.02,15.78,1.54,5.39.51,10.78.64,16.16.38,7.18-.77,12.51-3.6,15.97-8.47,3.46-4.88,5.2-10.26,5.2-16.16,0-4.36-.77-8.47-2.31-12.32l-69.66-186.65h58.11l45.03,136.24h.77l43.49-136.24h56.57l-83.13,223.6c-5.91,16.16-14.11,27.71-24.63,34.64Z"/>
              <path d="M500.69,75.82v27.71h1.15c6.93-11.55,15.91-19.95,26.94-25.21,11.03-5.26,22.32-7.89,33.87-7.89,14.62,0,26.62,1.99,35.98,5.97,9.36,3.98,16.74,9.5,22.13,16.55,5.39,7.06,9.17,15.65,11.35,25.79,2.18,10.14,3.27,21.36,3.27,33.67v122.38h-54.65v-112.38c0-16.42-2.57-28.67-7.7-36.75-5.14-8.08-14.24-12.12-27.33-12.12-14.88,0-25.66,4.43-32.33,13.28-6.67,8.85-10.01,23.42-10.01,43.68v104.29h-54.65V75.82h51.96Z"/>
              <path d="M678.48,45.03V0h54.65v45.03h-54.65ZM733.13,75.82v198.97h-54.65V75.82h54.65Z"/>
              <path d="M871.29,111.61c-8.73,0-16.04,1.99-21.94,5.97-5.91,3.98-10.72,9.11-14.43,15.39-3.72,6.29-6.35,13.22-7.89,20.78-1.54,7.57-2.31,15.08-2.31,22.51s.77,14.5,2.31,21.94c1.54,7.44,4.04,14.18,7.5,20.2,3.46,6.03,8.14,10.97,14.05,14.82,5.9,3.85,13.08,5.77,21.55,5.77,13.08,0,23.15-3.66,30.21-10.97,7.05-7.31,11.48-17.13,13.28-29.44h52.72c-3.6,26.43-13.85,46.57-30.79,60.42s-38.62,20.78-65.04,20.78c-14.88,0-28.55-2.5-40.99-7.5-12.45-5-23.03-11.99-31.75-20.97-8.73-8.98-15.53-19.69-20.4-32.13-4.88-12.44-7.31-26.1-7.31-40.99s2.24-29.69,6.74-42.91c4.49-13.21,11.09-24.63,19.82-34.25,8.72-9.62,19.37-17.13,31.94-22.51,12.57-5.39,26.94-8.08,43.1-8.08,11.8,0,23.15,1.54,34.06,4.62,10.9,3.08,20.65,7.76,29.25,14.05,8.59,6.29,15.59,14.11,20.97,23.48,5.39,9.37,8.47,20.46,9.24,33.29h-53.5c-3.6-22.83-17.07-34.25-40.41-34.25Z"/>
              <path d="M1055.63,227.06c8.21,7.96,20.01,11.93,35.41,11.93,11.03,0,20.52-2.75,28.48-8.27,7.95-5.51,12.83-11.35,14.62-17.51h48.11c-7.7,23.86-19.5,40.93-35.41,51.18-15.91,10.26-35.15,15.39-57.73,15.39-15.65,0-29.77-2.5-42.33-7.5-12.57-5-23.22-12.12-31.94-21.36-8.73-9.24-15.46-20.26-20.21-33.1-4.75-12.83-7.12-26.94-7.12-42.33s2.43-28.73,7.31-41.56c4.87-12.83,11.8-23.92,20.78-33.29,8.98-9.36,19.69-16.74,32.14-22.13,12.44-5.39,26.23-8.08,41.37-8.08,16.93,0,31.68,3.27,44.26,9.81,12.57,6.54,22.9,15.33,30.98,26.36,8.08,11.03,13.92,23.61,17.51,37.72,3.59,14.11,4.87,28.86,3.85,44.26h-143.55c.77,17.7,5.26,30.54,13.47,38.49ZM1117.4,122.38c-6.54-7.18-16.49-10.78-29.83-10.78-8.73,0-15.97,1.48-21.74,4.43-5.77,2.95-10.39,6.61-13.86,10.97-3.46,4.37-5.9,8.98-7.31,13.85-1.41,4.88-2.25,9.24-2.5,13.08h88.9c-2.57-13.85-7.12-24.37-13.66-31.56Z"/>
            </g>
          </svg>
        </Link>
      </header>
      {!comingSoon && (
        <nav id="site-nav">
          <ul>
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={isActive(item.href) ? 'current' : ''}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/cart" className={`nav-cart${isActive('/cart') ? ' current' : ''}`}>
            Cart{count > 0 ? ` (${count})` : ''}
          </Link>
        </nav>
      )}
    </>
  )
}
