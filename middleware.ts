import { NextRequest, NextResponse } from 'next/server'

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://wp.example.com'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never gate the gate page itself, static assets, or API routes
  if (
    pathname === '/gate' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // If user already has the access cookie, let them through
  if (req.cookies.get('nv_site_access')) {
    return NextResponse.next()
  }

  // Check WordPress coming soon status (cache for 60s at edge)
  try {
    const res = await fetch(`${WP_URL}/wp-json/nv/v1/gate`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.coming_soon) {
        // Redirect to gate page
        const gateUrl = req.nextUrl.clone()
        gateUrl.pathname = '/gate'
        gateUrl.searchParams.set('from', pathname)
        return NextResponse.rewrite(gateUrl)
      }
    }
  } catch {
    // If WP is unreachable, let traffic through rather than blocking everyone
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
