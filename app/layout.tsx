import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'Bark Like Dog',
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
          <p>© {new Date().getFullYear()} Bark Like Dog</p>
        </footer>
      </body>
    </html>
  )
}
