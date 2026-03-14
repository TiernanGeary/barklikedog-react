import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'
const RADIO_ADMIN_KEY = process.env.RADIO_ADMIN_KEY || ''

const QUEUE_DOC_ID = 'd3fffc49-a0c0-42bc-8dc4-c93e113746cf'

export async function POST(request: NextRequest) {
  // Admin auth check
  const cookieStore = await cookies()
  if (!RADIO_ADMIN_KEY || cookieStore.get('radio-admin')?.value !== RADIO_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { trackKey } = await request.json()
  if (!trackKey) {
    return NextResponse.json({ error: 'Missing trackKey' }, { status: 400 })
  }

  try {
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
            patch: {
              id: QUEUE_DOC_ID,
              unset: [`tracks[_key=="${trackKey}"]`],
            },
          }],
        }),
      },
    )

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json({ error: errData.message || 'Remove failed' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 })
  }
}
