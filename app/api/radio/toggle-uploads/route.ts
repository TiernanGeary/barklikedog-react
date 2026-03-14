import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'
const RADIO_ADMIN_KEY = process.env.RADIO_ADMIN_KEY || ''

export async function POST(request: NextRequest) {
  // Admin auth check
  const cookieStore = await cookies()
  if (!RADIO_ADMIN_KEY || cookieStore.get('radio-admin')?.value !== RADIO_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { enabled } = await request.json()

  try {
    // Find radioSettings doc
    const queryRes = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent('*[_type == "radioSettings"][0]._id')}`,
      {
        headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` },
        cache: 'no-store',
      },
    )
    const queryData = await queryRes.json()
    const settingsId = queryData.result

    if (!settingsId) {
      return NextResponse.json({ error: 'Radio settings not found' }, { status: 404 })
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
            patch: {
              id: settingsId,
              set: { uploadsEnabled: enabled },
            },
          }],
        }),
      },
    )

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json({ error: errData.message || 'Toggle failed' }, { status: res.status })
    }

    return NextResponse.json({ success: true, uploadsEnabled: enabled })
  } catch {
    return NextResponse.json({ error: 'Failed to toggle uploads' }, { status: 500 })
  }
}
