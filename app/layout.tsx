import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { CartProvider } from '@/components/CartProvider'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
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
        <Header comingSoon={comingSoon} />
        <PageTransition>
          <main id="main-content">
            {children}
          </main>
        </PageTransition>
        {!comingSoon && <Footer />}
        <SanityLive />
        </CartProvider>
      </body>
    </html>
  )
}
