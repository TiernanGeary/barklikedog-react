import { NextResponse } from 'next/server'

const AZURA_URL = process.env.AZURACAST_URL || 'https://radio.barklike.dog'
const AZURA_KEY = process.env.AZURACAST_API_KEY || ''
const STATION_ID = process.env.AZURACAST_STATION_ID || '1'

export async function POST() {
  if (!AZURA_KEY) {
    return NextResponse.json({ error: 'AzuraCast not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${AZURA_URL}/api/station/${STATION_ID}/backend/skip`, {
      method: 'POST',
      headers: { 'X-API-Key': AZURA_KEY },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to skip' }, { status: 500 })
  }
}
