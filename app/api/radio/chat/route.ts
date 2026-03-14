import { NextRequest, NextResponse } from 'next/server'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'

export async function POST(request: NextRequest) {
  try {
    const { nickname, message } = await request.json()

    if (!nickname || !message) {
      return NextResponse.json({ error: 'Missing nickname or message' }, { status: 400 })
    }

    if (nickname.length > 20 || message.length > 280) {
      return NextResponse.json({ error: 'Nickname max 20 chars, message max 280' }, { status: 400 })
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
