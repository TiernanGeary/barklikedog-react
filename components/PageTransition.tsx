'use client'

import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} id="main" className={pathname === '/' ? 'main-home' : undefined}>
      {children}
    </div>
  )
}
