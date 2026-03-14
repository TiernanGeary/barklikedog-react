import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-10',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Simple in-memory rate limiter: IP -> array of timestamps
const uploadTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = uploadTimestamps.get(ip) || []
  // Prune timestamps outside the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  uploadTimestamps.set(ip, recent)

  if (recent.length >= RATE_LIMIT_MAX) {
    return true
  }
  recent.push(now)
  uploadTimestamps.set(ip, recent)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 uploads per hour.' },
        { status: 429 },
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: file and title' },
        { status: 400 },
      )
    }

    // Validate mime type — only common audio formats
    const ALLOWED_TYPES = [
      'audio/mpeg',       // .mp3
      'audio/mp4',        // .m4a
      'audio/ogg',        // .ogg
      'audio/wav',        // .wav
      'audio/x-wav',      // .wav (alt)
      'audio/flac',       // .flac
      'audio/aac',        // .aac
      'audio/webm',       // .webm
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: MP3, M4A, OGG, WAV, FLAC, AAC, WebM.' },
        { status: 400 },
      )
    }

    // Fetch radioSettings for maxUploadSizeMB
    const settings = await client.fetch<{
      moderationEnabled?: boolean
      maxUploadSizeMB?: number
    } | null>('*[_type == "radioSettings"][0]{ moderationEnabled, maxUploadSizeMB }')

    const maxUploadSizeMB = settings?.maxUploadSizeMB ?? 50
    const maxBytes = maxUploadSizeMB * 1024 * 1024

    // Validate file size
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxUploadSizeMB}MB.` },
        { status: 400 },
      )
    }

    // Upload file to Sanity
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await client.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    // Create media document
    const status = settings?.moderationEnabled ? 'pending' : 'approved'
    const mediaDoc = await client.create({
      _type: 'media',
      title,
      slug: {
        _type: 'slug',
        current: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      },
      mediaType: 'audio',
      audioFile: {
        _type: 'file',
        asset: { _type: 'reference', _ref: asset._id },
      },
      uploadedBy: 'listener',
      status,
      publishedAt: new Date().toISOString(),
    })

    // If approved, append to radioQueue
    if (status === 'approved') {
      const queue = await client.fetch<{ _id: string } | null>(
        '*[_type == "radioQueue"][0]{ _id }',
      )
      if (queue) {
        await client
          .patch(queue._id)
          .setIfMissing({ tracks: [] })
          .append('tracks', [
            {
              _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
              _type: 'queuedTrack',
              trackRef: { _type: 'reference', _ref: mediaDoc._id },
            },
          ])
          .commit()
      }
    }

    return NextResponse.json({
      success: true,
      status: mediaDoc.status,
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
