import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import SiteLayout from '@/components/SiteLayout'
import { SanityLive } from '@/sanity/lib/live'
import { isComingSoon } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'rlyrlynice',
  description: 'A creative product design studio by Tiernan Geary.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const comingSoon = await isComingSoon()

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteLayout comingSoon={comingSoon}>{children}</SiteLayout>
          <SanityLive refreshOnFocus={false} refreshOnReconnect={false} />
        </CartProvider>
      </body>
    </html>
  )
}
