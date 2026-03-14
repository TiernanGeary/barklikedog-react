import { NextResponse } from 'next/server'

const AZURACAST_URL = process.env.AZURACAST_URL || 'http://87.99.129.139'
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY || ''
const AZURACAST_STATION_ID = process.env.AZURACAST_STATION_ID || '1'

export async function POST() {
  if (!AZURACAST_API_KEY) {
    return NextResponse.json({ error: 'AzuraCast not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${AZURACAST_URL}/api/station/${AZURACAST_STATION_ID}/backend/skip`,
      {
        method: 'POST',
        headers: { 'X-API-Key': AZURACAST_API_KEY },
      },
    )

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Skip failed' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to skip' }, { status: 500 })
  }
}
