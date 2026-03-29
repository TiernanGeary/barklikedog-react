import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const SANITY_QUERY_URL = `https://${PROJECT_ID}.api.sanity.io/v2026-03-10/data/query/${DATASET}`

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never gate static assets, studio, or API routes
  if (
    pathname.startsWith('/studio') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // If user has the access cookie, let them through
  if (req.cookies.get('nv_site_access')) {
    return NextResponse.next()
  }

  // Home page is always accessible
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Check Sanity for coming soon status
  try {
    const query = encodeURIComponent('*[_type == "siteSettings" && _id == "siteSettings"][0].comingSoon')
    const res = await fetch(`${SANITY_QUERY_URL}?query=${query}`, {
      next: { revalidate: 30 },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.result === true) {
        // Redirect non-home pages to home in coming soon mode
        const homeUrl = req.nextUrl.clone()
        homeUrl.pathname = '/'
        return NextResponse.redirect(homeUrl)
      }
    }
  } catch {
    // If Sanity is unreachable, let traffic through
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
