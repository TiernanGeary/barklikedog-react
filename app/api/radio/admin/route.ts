import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RADIO_ADMIN_KEY = process.env.RADIO_ADMIN_KEY || ''

export async function GET() {
  if (!RADIO_ADMIN_KEY) {
    return NextResponse.json({ isAdmin: false })
  }

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('radio-admin')?.value === RADIO_ADMIN_KEY

  return NextResponse.json({ isAdmin })
}

export async function POST(request: NextRequest) {
  const { key } = await request.json()

  if (!RADIO_ADMIN_KEY || key !== RADIO_ADMIN_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const response = NextResponse.json({ isAdmin: true })
  response.cookies.set('radio-admin', key, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return response
}
