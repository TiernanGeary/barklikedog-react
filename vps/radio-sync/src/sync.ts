import {
  fetchQueue,
  listenToQueue,
  updateNowPlaying,
  type RadioQueue,
} from './sanity.js'
import {
  ensurePlaylist,
  uploadMedia,
  findMediaByPath,
  setPlaylistOrder,
  subscribeNowPlaying,
  type NowPlayingEvent,
} from './azuracast.js'

// Track which Sanity audio URLs we've already synced to AzuraCast
// audioUrl → { azuracastId, azuracastPath }
const syncedFiles = new Map<string, { id: number; path: string }>()

let currentQueueId: string | null = null
let currentTracks: RadioQueue['tracks'] = []
// FIX 3: Map AzuraCast file paths to track indices for instant matching.
// Previously used fragile title string matching which could fail on special
// characters, partial matches, or duplicate titles.
let pathToIndex = new Map<string, number>()

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
  currentQueueId = queue._id
  currentTracks = queue.tracks

  const playlistId = await ensurePlaylist()

  const approved = queue.tracks.filter((t) => t.status === 'approved')
  const mediaIds: number[] = []
  const newPathToIndex = new Map<string, number>()

  for (let i = 0; i < approved.length; i++) {
    const track = approved[i]
    if (!track.audioUrl) continue

    let azPath: string
    let azId: number

    const cached = syncedFiles.get(track.audioUrl)
    if (cached) {
      azId = cached.id
      azPath = cached.path
    } else {
      const filename = sanitizeFilename(track.title, track.audioUrl)
      const searchPath = `sync/${filename}`

      const existing = await findMediaByPath(searchPath)
      if (existing) {
        azId = existing.id
        azPath = existing.path
        syncedFiles.set(track.audioUrl, { id: azId, path: azPath })
      } else {
        console.log(`[sync] Downloading: ${track.title}`)
        const buffer = await downloadFile(track.audioUrl)
        const uploaded = await uploadMedia(buffer, filename)
        azId = uploaded.id
        azPath = uploaded.path || searchPath
        syncedFiles.set(track.audioUrl, { id: azId, path: azPath })
        console.log(`[sync] Uploaded: ${track.title} → AzuraCast ID ${azId}`)
      }
    }

    mediaIds.push(azId)
    // Build path → queue index map for now-playing matching
    newPathToIndex.set(azPath, i)
  }

  pathToIndex = newPathToIndex

  await setPlaylistOrder(playlistId, mediaIds)
  console.log(`[sync] Playlist updated: ${mediaIds.length} tracks`)
}

// FIX 1: SSE-driven now-playing instead of polling.
// Receives instant updates from AzuraCast when the track changes.
function handleNowPlayingUpdate(np: NowPlayingEvent) {
  if (!currentQueueId || currentTracks.length === 0) return

  const song = np.now_playing.song
  const songPath = song.path

  // FIX 3: Match by file path first (reliable), fall back to title
  let index = -1
  if (songPath) {
    // Try exact path match
    const found = pathToIndex.get(songPath)
    if (found !== undefined) {
      index = found
    }
  }

  // Fallback: match by title (for tracks not yet in the path map)
  if (index < 0) {
    index = currentTracks.findIndex(
      (t) => t.title === song.title || t.title?.includes(song.title),
    )
  }

  if (index >= 0) {
    console.log(`[sse] Now playing: "${currentTracks[index].title}" (index ${index})`)
    updateNowPlaying(currentQueueId, index, new Date().toISOString()).catch(
      (err) => console.error('[sse] Failed to update Sanity:', err),
    )
  } else {
    console.log(`[sse] Playing unknown track: "${song.title}" (path: ${songPath})`)
  }
}

export function startNowPlayingSubscription() {
  // Deduplicate: only write to Sanity when the track actually changes
  let lastIndex = -1

  subscribeNowPlaying((np) => {
    const song = np.now_playing.song
    const songPath = song.path

    let index = -1
    if (songPath) {
      const found = pathToIndex.get(songPath)
      if (found !== undefined) index = found
    }
    if (index < 0) {
      index = currentTracks.findIndex(
        (t) => t.title === song.title || t.title?.includes(song.title),
      )
    }

    if (index >= 0 && index !== lastIndex) {
      lastIndex = index
      handleNowPlayingUpdate(np)
    }
  })
}
