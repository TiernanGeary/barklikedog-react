'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function SiteLayout({ children, comingSoon }: {
  children: React.ReactNode
  comingSoon: boolean
}) {
  // ISR can expose Vercel's internal /index pathname for the homepage.
  // The route tree remains canonical, so derive the shell from its segments.
  const segments = useSelectedLayoutSegments()
  const pathname = `/${segments.join('/')}`
  const isHome = segments.length === 0
  const isStudio = segments[0] === 'studio'

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
