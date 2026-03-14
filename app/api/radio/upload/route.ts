import { NextRequest, NextResponse } from 'next/server'

// Use Edge Runtime for larger body size support (no 4.5MB limit)
export const runtime = 'edge'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10'

// Simple in-memory rate limiter: IP -> array of timestamps
const uploadTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = uploadTimestamps.get(ip) || []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  uploadTimestamps.set(ip, recent)

  if (recent.length >= RATE_LIMIT_MAX) {
    return true
  }
  recent.push(now)
  uploadTimestamps.set(ip, recent)
  return false
}

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/webm',
]

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 uploads per hour.' },
        { status: 429 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: file and title' },
        { status: 400 },
      )
    }

    // Validate mime type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: MP3, M4A, OGG, WAV, FLAC, AAC, WebM.' },
        { status: 400 },
      )
    }

    // Fetch radioSettings for maxUploadSizeMB and moderationEnabled
    const settingsRes = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent('*[_type == "radioSettings"][0]{ moderationEnabled, maxUploadSizeMB }')}`,
      { headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` } },
    )
    const settingsData = await settingsRes.json()
    const settings = settingsData.result

    const maxUploadSizeMB = settings?.maxUploadSizeMB ?? 50
    const maxBytes = maxUploadSizeMB * 1024 * 1024

    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxUploadSizeMB}MB.` },
        { status: 400 },
      )
    }

    // Upload file to Sanity CDN
    const uploadRes = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/assets/files/${SANITY_DATASET}?filename=${encodeURIComponent(file.name)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          Authorization: `Bearer ${SANITY_API_TOKEN}`,
        },
        body: file,
      },
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Sanity upload failed:', err)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const uploadData = await uploadRes.json()
    const assetId = uploadData.document._id

    // Create media document
    const status = settings?.moderationEnabled ? 'pending' : 'approved'
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const mutations = [
      {
        create: {
          _type: 'media',
          title,
          slug: { _type: 'slug', current: slug },
          mediaType: 'audio',
          audioFile: {
            _type: 'file',
            asset: { _type: 'reference', _ref: assetId },
          },
          uploadedBy: 'listener',
          status,
          publishedAt: new Date().toISOString(),
        },
      },
    ]

    const mutateRes = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SANITY_API_TOKEN}`,
        },
        body: JSON.stringify({ mutations }),
      },
    )

    const mutateData = await mutateRes.json()
    const mediaDocId = mutateData.results?.[0]?.id

    // If approved, append to radioQueue
    if (status === 'approved' && mediaDocId) {
      const queueRes = await fetch(
        `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent('*[_type == "radioQueue"][0]{ _id }')}`,
        { headers: { Authorization: `Bearer ${SANITY_API_TOKEN}` } },
      )
      const queueData = await queueRes.json()
      const queueId = queueData.result?._id

      if (queueId) {
        const key = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        await fetch(
          `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SANITY_API_TOKEN}`,
            },
            body: JSON.stringify({
              mutations: [
                {
                  patch: {
                    id: queueId,
                    setIfMissing: { tracks: [] },
                    insert: {
                      after: 'tracks[-1]',
                      items: [
                        {
                          _key: key,
                          _type: 'queuedTrack',
                          trackRef: { _type: 'reference', _ref: mediaDocId },
                        },
                      ],
                    },
                  },
                },
              ],
            }),
          },
        )
      }
    }

    return NextResponse.json({
      success: true,
      status,
      title,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
