import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'
const RADIO_ADMIN_KEY = process.env.RADIO_ADMIN_KEY || ''

const QUEUE_DOC_ID = 'd3fffc49-a0c0-42bc-8dc4-c93e113746cf'

const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
  'audio/x-wav', 'audio/flac', 'audio/aac', 'audio/webm',
]

const mutateUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`
const mutateHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SANITY_API_TOKEN}`,
}

// This endpoint only creates the media document and queues it.
// The file itself is uploaded directly to Sanity from the client via the upload proxy on the VPS.
export async function POST(request: NextRequest) {
  try {
    const { title, assetId, mimeType, duration, source } = await request.json()

    if (!title || !assetId) {
      return NextResponse.json(
        { error: 'Missing required fields: title and assetId' },
        { status: 400 },
      )
    }

    if (mimeType && !ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type.' },
        { status: 400 },
      )
    }

    // Check admin status
    const cookieStore = await cookies()
    const isAdmin = RADIO_ADMIN_KEY && cookieStore.get('radio-admin')?.value === RADIO_ADMIN_KEY

    // Enforce 5-minute limit for non-admin uploads
    if (duration && duration > 300 && !isAdmin) {
      return NextResponse.json(
        { error: 'Track exceeds 5 minute limit' },
        { status: 400 },
      )
    }

    // Fetch radioSettings
    const settingsRes = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent('*[_type == "radioSettings"][0]{ moderationEnabled }')}`,
      {
        headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` },
        cache: 'no-store',
      },
    )
    const settingsData = await settingsRes.json()
    const settings = settingsData.result

    const status = settings?.moderationEnabled ? 'pending' : 'approved'
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Create media document (explicit ID ensures it's published, not a draft)
    const mediaDocId = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    const createRes = await fetch(mutateUrl, {
      method: 'POST',
      headers: mutateHeaders,
      cache: 'no-store',
      body: JSON.stringify({
        mutations: [{
          createIfNotExists: {
            _id: mediaDocId,
            _type: 'media',
            title,
            slug: { _type: 'slug', current: slug },
            mediaType: 'audio',
            audioFile: { _type: 'file', asset: { _type: 'reference', _ref: assetId } },
            uploadedBy: 'listener',
            ...(source && { source }),
            ...(duration && { duration }),
            status,
            publishedAt: new Date().toISOString(),
          },
        }],
      }),
    })

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}))
      console.error('Media create failed:', JSON.stringify(errData))
      return NextResponse.json({ error: 'Failed to create media document' }, { status: 500 })
    }

    // If approved, append to radioQueue with single atomic mutation
    if (status === 'approved') {
      const key = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      const trackItem = {
        _key: key,
        _type: 'queuedTrack',
        trackRef: { _type: 'reference', _ref: mediaDocId },
      }

      const appendRes = await fetch(mutateUrl, {
        method: 'POST',
        headers: mutateHeaders,
        cache: 'no-store',
        body: JSON.stringify({
          mutations: [{
            patch: {
              id: QUEUE_DOC_ID,
              setIfMissing: { tracks: [] },
              insert: { after: 'tracks[-1]', items: [trackItem] },
            },
          }],
        }),
      })

      if (!appendRes.ok) {
        const errData = await appendRes.json().catch(() => ({}))
        console.error('Queue append failed:', JSON.stringify(errData))
        return NextResponse.json({ error: 'Track created but failed to add to queue' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, status, title })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
