import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'Niche Vault',
  description: 'Art and collectibles.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <PageTransition>
          <div id="main-content">
            {children}
          </div>
        </PageTransition>
        <footer id="footer">
          <p>© {new Date().getFullYear()} Niche Vault</p>
        </footer>
      </body>
    </html>
  )
}
