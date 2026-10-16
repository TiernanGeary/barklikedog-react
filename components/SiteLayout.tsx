'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function SiteLayout({ children, comingSoon }: {
  children: React.ReactNode
  comingSoon: boolean
}) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isStudio = pathname.startsWith('/studio')

  // Keep the page shell mounted in one fixed DOM order during navigation.
  return (
    <div className="site-layout">
      <Header pathname={pathname} comingSoon={comingSoon} hidden={isStudio} />
      <div id="main" className={isHome ? 'main-home' : undefined}>
        <main id="main-content">{children}</main>
      </div>
      <Footer hidden={isHome || isStudio || comingSoon} />
    </div>
  )
}
