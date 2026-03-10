'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_GROUPS = [
  {
    items: [
      { title: 'House', href: '/' },
      { title: 'Shop',  href: '/shop' },
    ],
  },
  {
    items: [
      { title: 'Posts', href: '/posts' },
      { title: 'Media', href: '/media' },
    ],
  },
  {
    items: [
      { title: 'About', href: '/about' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside id="sidebar">
      <div className="logo-container">
        <Link href="/">
          <Image
            src="/houndstooth.png"
            alt="Bark Like Dog"
            width={50}
            height={50}
            className="site-logo"
            priority
          />
        </Link>
      </div>

      {NAV_GROUPS.map((group, i) => (
        <nav key={i} className="nav-group">
          <ul>
            {group.items.map(item => (
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
        </nav>
      ))}
    </aside>
  )
}
