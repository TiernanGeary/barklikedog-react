import { EventSource } from 'eventsource'

const BASE_URL = process.env.AZURACAST_URL!
const API_KEY = process.env.AZURACAST_API_KEY!
const STATION_ID = process.env.AZURACAST_STATION_ID!

const headers = {
  'X-API-Key': API_KEY,
}

export interface NowPlayingSong {
  title: string
  artist: string
  path: string
}

export interface NowPlayingEvent {
  now_playing: {
    song: NowPlayingSong
    elapsed: number
    duration: number
  }
}

export async function getNowPlaying(): Promise<NowPlayingEvent> {
  const res = await fetch(`${BASE_URL}/api/nowplaying/${STATION_ID}`, { headers })
  return res.json()
}

// FIX 1: SSE-based now-playing subscription.
// AzuraCast pushes now-playing changes instantly via SSE instead of us
// polling every 15s. This eliminates latency and unnecessary API calls.
export function subscribeNowPlaying(
  onUpdate: (np: NowPlayingEvent) => void,
): EventSource {
  const sseUrl = `${BASE_URL}/api/live/nowplaying/sse?cf_connect=${encodeURIComponent(JSON.stringify({ subs: { [`station:${STATION_ID}`]: { recover: true } } }))}`

  console.log('[azuracast] Connecting to SSE...')
  const es = new EventSource(sseUrl)

  es.onopen = () => {
    console.log('[azuracast] SSE connected')
  }

  es.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string)
      // AzuraCast SSE wraps the payload in a `pub` object with `data` inside
      const payload = data?.pub?.data?.np
      if (payload) {
        onUpdate(payload as NowPlayingEvent)
      }
    } catch {
      // Non-JSON keepalive or malformed event — ignore
    }
  }

  es.onerror = () => {
    console.error('[azuracast] SSE error, will auto-reconnect')
    // EventSource auto-reconnects by default
  }

  return es
}

export async function getPlaylistFiles(playlistId: number): Promise<any[]> {
  const res = await fetch(
    `${BASE_URL}/api/station/${STATION_ID}/playlist/${playlistId}/files`,
    { headers },
  )
  return res.json()
}

export async function uploadMedia(
  fileBuffer: Buffer,
  filename: string,
): Promise<{ id: number; unique_id: string; path: string }> {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(fileBuffer)]), filename)
  form.append('path', `sync/${filename}`)

  const res = await fetch(`${BASE_URL}/api/station/${STATION_ID}/files`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: form,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function ensurePlaylist(): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/api/station/${STATION_ID}/playlists`,
    { headers },
  )
  const playlists = await res.json()
  const existing = playlists.find((p: any) => p.name === 'Sanity Queue')

  if (existing) return existing.id

  const createRes = await fetch(
    `${BASE_URL}/api/station/${STATION_ID}/playlists`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sanity Queue',
        type: 'default',
        source: 'songs',
        is_enabled: true,
        weight: 1,
      }),
    },
  )

  const created = await createRes.json()
  return created.id
}

export async function setPlaylistOrder(
  playlistId: number,
  mediaIds: number[],
) {
  await fetch(
    `${BASE_URL}/api/station/${STATION_ID}/playlist/${playlistId}/order`,
    {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: mediaIds.map((id, i) => ({ id, weight: i + 1 })),
      }),
    },
  )
}

export async function findMediaByPath(
  path: string,
): Promise<{ id: number; path: string } | null> {
  const res = await fetch(
    `${BASE_URL}/api/station/${STATION_ID}/files/list?searchPhrase=${encodeURIComponent(path)}`,
    { headers },
  )
  const files = await res.json()
  return files[0] || null
}
