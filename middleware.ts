import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never gate the gate page itself, studio, static assets, or API routes
  if (
    pathname === '/gate' ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Coming soon mode: set COMING_SOON=true in Vercel env vars to activate
  const comingSoon = process.env.COMING_SOON === 'true'
  if (!comingSoon) {
    return NextResponse.next()
  }

  // If user has the access cookie, let them through
  if (req.cookies.get('nv_site_access')) {
    return NextResponse.next()
  }

  // Show gate page
  const gateUrl = req.nextUrl.clone()
  gateUrl.pathname = '/gate'
  return NextResponse.rewrite(gateUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
