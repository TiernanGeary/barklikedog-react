import { NextRequest, NextResponse } from 'next/server'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'

// Rate limit: max 10 messages per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60_000

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'Slow down — try again in a minute' }, { status: 429 })
    }

    const { nickname, message } = await request.json()

    if (!nickname || !message) {
      return NextResponse.json({ error: 'Missing nickname or message' }, { status: 400 })
    }

    if (nickname.length > 20 || nickname.split(/\s+/).length > 2) {
      return NextResponse.json({ error: 'Nickname: max 2 words, 20 chars' }, { status: 400 })
    }

    if (message.length > 280 || message.split(/\s+/).length > 50) {
      return NextResponse.json({ error: 'Message: max 50 words' }, { status: 400 })
    }

    const res = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SANITY_API_TOKEN}`,
        },
        cache: 'no-store',
        body: JSON.stringify({
          mutations: [{
            create: {
              _type: 'radioChatMessage',
              nickname,
              message,
            },
          }],
        }),
      },
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
