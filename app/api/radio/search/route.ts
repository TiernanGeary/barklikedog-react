import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || '0') * 3600) +
         (parseInt(m[2] || '0') * 60) +
         (parseInt(m[3] || '0'))
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  try {
    // Search for music videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('videoCategoryId', '10')
    searchUrl.searchParams.set('maxResults', '5')
    searchUrl.searchParams.set('q', q)
    searchUrl.searchParams.set('key', GOOGLE_API_KEY)

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) {
      return NextResponse.json({ error: 'YouTube search failed' }, { status: 502 })
    }

    const searchData = await searchRes.json()
    const items = searchData.items || []
    if (items.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Get durations
    const videoIds = items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',')
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'contentDetails')
    detailsUrl.searchParams.set('id', videoIds)
    detailsUrl.searchParams.set('key', GOOGLE_API_KEY)

    const detailsRes = await fetch(detailsUrl.toString())
    const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] }

    const durationMap = new Map<string, string>()
    for (const v of detailsData.items || []) {
      durationMap.set(v.id, v.contentDetails.duration)
    }

    const results = items.map((item: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }) => {
      const videoId = item.id.videoId
      const iso = durationMap.get(videoId) || 'PT0S'
      const durationSeconds = parseDuration(iso)
      return {
        videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        durationSeconds,
        durationText: formatDuration(durationSeconds),
      }
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
