import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { CartProvider } from '@/components/CartProvider'
import Footer from '@/components/Footer'
import HomeBackground from '@/components/HomeBackground'
import PageTransition from '@/components/PageTransition'
import { SanityLive } from '@/sanity/lib/live'
import { isComingSoon } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'Bark Like Dog',
  description: 'Art and collectibles.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const comingSoon = await isComingSoon()

  return (
    <html lang="en">
      <body>
        <CartProvider>
        <HomeBackground />
        <Header comingSoon={comingSoon} />
        <PageTransition>
          <div id="main-content">
            {children}
          </div>
        </PageTransition>
        {!comingSoon && <Footer />}
        <SanityLive />
        </CartProvider>
      </body>
    </html>
  )
}
