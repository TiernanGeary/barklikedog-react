import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'
const AZURACAST_URL = process.env.AZURACAST_URL || 'http://87.99.129.139'
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY || ''
const AZURACAST_STATION_ID = process.env.AZURACAST_STATION_ID || '1'

const SKIP_VOTE_DOC_ID = 'radioSkipVote'

const mutateUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`
const queryUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
const mutateHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SANITY_API_TOKEN}`,
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'skip-salt-2026').digest('hex').slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const ipHash = hashIp(ip)
    const { songTitle } = await request.json()

    if (!songTitle) {
      return NextResponse.json({ error: 'Missing songTitle' }, { status: 400 })
    }

    // Fetch current skip vote doc
    const docRes = await fetch(
      `${queryUrl}?query=${encodeURIComponent(`*[_type == "radioSkipVote" && _id == "${SKIP_VOTE_DOC_ID}"][0]`)}`,
      { headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` }, cache: 'no-store' },
    )
    const docData = await docRes.json()
    const doc = docData.result

    // If song changed, reset votes for new song
    const isSameSong = doc?.songTitle === songTitle

    if (isSameSong && doc?.voterHashes?.includes(ipHash)) {
      return NextResponse.json({ error: 'Already voted to skip this song' }, { status: 409 })
    }

    // Fetch skip threshold from settings
    const settingsRes = await fetch(
      `${queryUrl}?query=${encodeURIComponent(`*[_type == "radioSettings"][0] { skipVoteThreshold }`)}`,
      { headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` }, cache: 'no-store' },
    )
    const settingsData = await settingsRes.json()
    const threshold = settingsData.result?.skipVoteThreshold ?? 3

    if (threshold === 0) {
      return NextResponse.json({ error: 'Skip voting is disabled' }, { status: 403 })
    }

    // Create or update the skip vote doc
    const newCount = isSameSong ? (doc?.voteCount || 0) + 1 : 1
    const newHashes = isSameSong ? [...(doc?.voterHashes || []), ipHash] : [ipHash]

    await fetch(mutateUrl, {
      method: 'POST',
      headers: mutateHeaders,
      cache: 'no-store',
      body: JSON.stringify({
        mutations: [{
          createOrReplace: {
            _id: SKIP_VOTE_DOC_ID,
            _type: 'radioSkipVote',
            songTitle,
            voteCount: newCount,
            voterHashes: newHashes,
          },
        }],
      }),
    })

    // If votes meet threshold, skip the song on AzuraCast and reset
    if (newCount >= threshold) {
      // Skip on AzuraCast
      if (AZURACAST_API_KEY) {
        await fetch(
          `${AZURACAST_URL}/api/station/${AZURACAST_STATION_ID}/backend/skip`,
          {
            method: 'POST',
            headers: { 'X-API-Key': AZURACAST_API_KEY },
          },
        ).catch(() => {})
      }

      // Reset vote doc
      await fetch(mutateUrl, {
        method: 'POST',
        headers: mutateHeaders,
        cache: 'no-store',
        body: JSON.stringify({
          mutations: [{
            createOrReplace: {
              _id: SKIP_VOTE_DOC_ID,
              _type: 'radioSkipVote',
              songTitle: '',
              voteCount: 0,
              voterHashes: [],
            },
          }],
        }),
      })

      return NextResponse.json({ success: true, skipped: true, votes: newCount, threshold })
    }

    return NextResponse.json({ success: true, skipped: false, votes: newCount, threshold })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
