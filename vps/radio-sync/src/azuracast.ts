import { EventSource } from 'eventsource'

const BASE_URL = process.env.AZURACAST_URL!
const API_KEY = process.env.AZURACAST_API_KEY!
const STATION_ID = process.env.AZURACAST_STATION_ID!

const headers: Record<string, string> = {
  'X-API-Key': API_KEY,
}

const jsonHeaders: Record<string, string> = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
}

export interface NowPlayingEvent {
  now_playing: {
    song: {
      title: string
      artist: string
      path: string
    }
    elapsed: number
    duration: number
  }
}

async function apiCall(url: string, opts?: RequestInit): Promise<Response> {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AzuraCast API ${res.status}: ${url} — ${text}`)
  }
  return res
}

export async function getNowPlaying(): Promise<NowPlayingEvent> {
  const res = await apiCall(`${BASE_URL}/api/nowplaying/${STATION_ID}`, { headers })
  return res.json()
}

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
      const payload = data?.pub?.data?.np
      if (payload) {
        onUpdate(payload as NowPlayingEvent)
      }
    } catch {
      // Non-JSON keepalive — ignore
    }
  }

  es.onerror = () => {
    console.error('[azuracast] SSE error, will auto-reconnect')
  }

  return es
}

// Base64 JSON upload — the method that works with this AzuraCast instance
export async function uploadMedia(
  fileBuffer: Buffer,
  filename: string,
): Promise<{ id: number; path: string }> {
  const base64 = fileBuffer.toString('base64')

  const res = await apiCall(`${BASE_URL}/api/station/${STATION_ID}/files`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      path: `sync/${filename}`,
      file: base64,
    }),
  })

  const data = await res.json()
  return { id: data.id, path: data.path || `sync/${filename}` }
}

export async function ensurePlaylist(): Promise<number> {
  const res = await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/playlists`,
    { headers },
  )
  const playlists = await res.json()
  const existing = playlists.find((p: any) => p.name === 'Sanity Queue')

  if (existing) return existing.id

  const createRes = await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/playlists`,
    {
      method: 'POST',
      headers: jsonHeaders,
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
  await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/playlist/${playlistId}/order`,
    {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({
        order: mediaIds.map((id, i) => ({ id, weight: i + 1 })),
      }),
    },
  )
}

export async function assignFileToPlaylist(fileId: number, playlistId: number) {
  await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/file/${fileId}`,
    {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ playlists: [playlistId] }),
    },
  )
}

export async function setPlaylistSequential(playlistId: number) {
  await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/playlist/${playlistId}`,
    {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ order: 'sequential' }),
    },
  )
}

export async function emptyPlaylist(playlistId: number) {
  await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/playlist/${playlistId}/empty`,
    {
      method: 'DELETE',
      headers,
    },
  )
}

export async function findMediaByPath(
  path: string,
): Promise<{ id: number; path: string } | null> {
  const res = await apiCall(
    `${BASE_URL}/api/station/${STATION_ID}/files/list?currentDirectory=sync&searchPhrase=${encodeURIComponent(path)}`,
    { headers },
  )
  const files = await res.json()
  const match = files.find((f: any) => f.media?.id != null)
  if (match) return { id: match.media.id, path: match.path }
  return null
}
