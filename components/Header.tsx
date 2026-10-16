'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'

const NAV_ITEMS = [
  { title: 'Home', href: '/' },
  { title: 'Shop', href: '/shop' },
  { title: 'About', href: '/about' },
]

export default function Header({ pathname, comingSoon = false, hidden = false }: {
  pathname: string
  comingSoon?: boolean
  hidden?: boolean
}) {
  const { count } = useCart()
  const isHome = pathname === '/'

  function isActive(href: string): boolean {
    if (href === '/') return isHome
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header id="site-header" hidden={hidden}>
        <Link
          draggable={false}
          href={isHome ? '/shop' : '/'}
          className="header-logo"
          aria-label={isHome ? 'rlyrlynice — enter shop' : 'rlyrlynice home'}
        >
          <img draggable={false} src="/rlyrlynicelogo.svg" alt="rlyrlynice" width={1932} height={437} />
        </Link>
      </header>
      <nav id="site-nav" aria-label="Main navigation" hidden={hidden || isHome || comingSoon}>
        <ul>
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive(item.href) ? 'current' : ''}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/cart"
          className={`nav-cart${isActive('/cart') ? ' current' : ''}`}
          aria-current={isActive('/cart') ? 'page' : undefined}
        >
          Cart{count > 0 ? ` (${count})` : ''}
        </Link>
      </nav>
    </>
  )
}
