import {
  fetchQueue,
  listenToQueue,
  type RadioQueue,
} from './sanity.js'
import {
  ensurePlaylist,
  uploadMedia,
  findMediaByPath,
  assignFileToPlaylist,
  setPlaylistSequential,
  setPlaylistLoop,
  emptyPlaylist,
  clearUpcomingQueue,
  subscribeNowPlaying,
  type NowPlayingEvent,
} from './azuracast.js'

// Track which Sanity audio URLs we've already synced to AzuraCast
// audioUrl → { azuracastId, azuracastPath }
const syncedFiles = new Map<string, { id: number; path: string }>()

let currentTracks: RadioQueue['tracks'] = []

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url)
  return Buffer.from(await res.arrayBuffer())
}

function sanitizeFilename(title: string, url: string): string {
  const hash = url.split('/').pop()?.split('?')[0] || 'file'
  const clean = title.replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 50)
  return `${clean}-${hash}`
}

export async function syncQueueToAzuraCast(queue: RadioQueue) {
  console.log(`[sync] Queue changed — ${queue.tracks.length} tracks`)
  currentTracks = queue.tracks

  const playlistId = await ensurePlaylist()

  const approved = queue.tracks.filter((t) => t.status === 'approved')
  const mediaIds: number[] = []

  for (let i = 0; i < approved.length; i++) {
    const track = approved[i]
    if (!track.audioUrl) continue

    let azId: number

    const cached = syncedFiles.get(track.audioUrl)
    if (cached) {
      azId = cached.id
    } else {
      const filename = sanitizeFilename(track.title, track.audioUrl)
      const searchPath = `sync/${filename}`

      const existing = await findMediaByPath(filename)
      if (existing) {
        azId = existing.id
        syncedFiles.set(track.audioUrl, { id: azId, path: existing.path })
        console.log(`[sync] Found existing: "${track.title}" → AzuraCast ID ${azId}`)
      } else {
        console.log(`[sync] Downloading: ${track.title}`)
        const buffer = await downloadFile(track.audioUrl)
        const uploaded = await uploadMedia(buffer, filename)
        azId = uploaded.id
        syncedFiles.set(track.audioUrl, { id: azId, path: uploaded.path || searchPath })
        console.log(`[sync] Uploaded: ${track.title} → AzuraCast ID ${azId}`)
      }
    }

    if (!azId || azId <= 0) {
      console.warn(`[sync] Skipping track "${track.title}" — invalid AzuraCast media ID: ${azId}`)
      continue
    }
    mediaIds.push(azId)
  }

  if (mediaIds.length === 0) {
    console.log('[sync] No valid media IDs — skipping playlist update')
    return
  }

  // Clear playlist, then assign only current tracks in insertion order
  await emptyPlaylist(playlistId)
  for (const id of mediaIds) {
    await assignFileToPlaylist(id, playlistId)
  }
  await setPlaylistSequential(playlistId)
  await setPlaylistLoop(playlistId, queue.loopPlaylist ?? true)
  await clearUpcomingQueue()
  console.log(`[sync] Playlist updated: ${mediaIds.length} tracks (sequential, loop=${queue.loopPlaylist ?? true})`)
}

// Settings-only update — no playlist rebuild, no interruption to playback
export async function updatePlaylistSettings(queue: RadioQueue) {
  const playlistId = await ensurePlaylist()
  const loop = queue.loopPlaylist ?? true
  await setPlaylistLoop(playlistId, loop)
  console.log(`[sync] Playlist loop updated to ${loop} (no rebuild)`)
}

// Log-only SSE subscription — no Sanity writes
export function startNowPlayingSubscription() {
  subscribeNowPlaying((np) => {
    const song = np.now_playing.song
    console.log(`[sse] Now playing: "${song.title}" by ${song.artist}`)
  })
}
