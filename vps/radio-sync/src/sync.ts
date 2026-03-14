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
  removeFileFromPlaylist,
  getPlaylistMediaIds,
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
let isFirstSync = true
let loopEnabled = true
let lastPlayedSongTitle = ''

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url)
  return Buffer.from(await res.arrayBuffer())
}

function sanitizeFilename(title: string, url: string): string {
  const hash = url.split('/').pop()?.split('?')[0] || 'file'
  const clean = title.replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 50)
  return `${clean}-${hash}`
}

// Normalize for fuzzy matching (same logic as frontend)
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/-[a-f0-9]{20,}$/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Find the AzuraCast media ID for a song title by matching against synced files
function findMediaIdBySongTitle(songTitle: string): number | null {
  const norm = normalize(songTitle)

  for (const [, { id, path }] of syncedFiles) {
    const normPath = normalize(path)
    if (normPath.includes(norm) || norm.includes(normPath)) return id
  }

  // Try matching against current track titles
  for (const track of currentTracks) {
    if (!track.audioUrl || !track.title) continue
    const normTitle = normalize(track.title)
    const normWords = norm.split(' ').filter((w) => w.length > 2)
    const titleWords = normTitle.split(' ').filter((w) => w.length > 2)

    // Substring match
    if (normTitle.includes(norm) || norm.includes(normTitle)) {
      const cached = syncedFiles.get(track.audioUrl)
      if (cached) return cached.id
    }

    // Word overlap
    const matchCount = normWords.filter((w) => normTitle.includes(w)).length
    if (matchCount >= Math.max(1, normWords.length * 0.5) && matchCount >= Math.max(1, titleWords.length * 0.3)) {
      const cached = syncedFiles.get(track.audioUrl)
      if (cached) return cached.id
    }
  }

  return null
}

// Resolve all tracks to AzuraCast media IDs (upload if needed)
async function resolveMediaIds(tracks: RadioQueue['tracks']): Promise<number[]> {
  const approved = tracks.filter((t) => t.status === 'approved')
  const mediaIds: number[] = []

  for (const track of approved) {
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

  return mediaIds
}

export async function syncQueueToAzuraCast(queue: RadioQueue) {
  console.log(`[sync] Queue changed — ${queue.tracks.length} tracks`)
  currentTracks = queue.tracks
  loopEnabled = queue.loopPlaylist ?? true

  const playlistId = await ensurePlaylist()
  const desiredIds = await resolveMediaIds(queue.tracks)

  if (desiredIds.length === 0) {
    console.log('[sync] No valid media IDs — skipping playlist update')
    return
  }

  // Get current playlist state
  const currentIds = await getPlaylistMediaIds(playlistId)

  const currentSet = new Set(currentIds)
  const desiredSet = new Set(desiredIds)

  const toAdd = desiredIds.filter((id) => !currentSet.has(id))
  const toRemove = currentIds.filter((id) => !desiredSet.has(id))
  const orderChanged = currentIds.length > 0 &&
    JSON.stringify(currentIds.filter((id) => desiredSet.has(id))) !== JSON.stringify(desiredIds.filter((id) => currentSet.has(id)))

  // First sync or major reorder — full rebuild needed
  if (isFirstSync || orderChanged) {
    if (isFirstSync && toAdd.length === 0 && toRemove.length === 0 && !orderChanged) {
      // Playlist already matches, no rebuild needed
      console.log(`[sync] Playlist already in sync (${currentIds.length} tracks)`)
      isFirstSync = false
      await setPlaylistSequential(playlistId)
      await setPlaylistLoop(playlistId, loopEnabled)
      return
    }

    console.log(`[sync] Full rebuild: ${orderChanged ? 'order changed' : 'initial sync'}`)
    await emptyPlaylist(playlistId)
    for (const id of desiredIds) {
      await assignFileToPlaylist(id, playlistId)
    }
    await setPlaylistSequential(playlistId)
    await setPlaylistLoop(playlistId, loopEnabled)
    if (!isFirstSync) {
      // Only clear queue on rebuilds after initial sync
      await clearUpcomingQueue()
    }
    isFirstSync = false
    console.log(`[sync] Playlist rebuilt: ${desiredIds.length} tracks (sequential, loop=${loopEnabled})`)
    return
  }

  // Incremental update — add new tracks, remove deleted ones
  // This preserves AzuraCast's playback position
  let changed = false

  for (const id of toRemove) {
    await removeFileFromPlaylist(id)
    console.log(`[sync] Removed media ID ${id} from playlist`)
    changed = true
  }

  for (const id of toAdd) {
    await assignFileToPlaylist(id, playlistId)
    console.log(`[sync] Added media ID ${id} to playlist`)
    changed = true
  }

  if (changed) {
    await setPlaylistSequential(playlistId)
    await setPlaylistLoop(playlistId, loopEnabled)
    // Clear pre-generated queue so AzuraCast picks up the new tracks
    // instead of looping back to track 1 from its stale plan
    await clearUpcomingQueue()
    console.log(`[sync] Playlist updated incrementally: +${toAdd.length} -${toRemove.length} (${desiredIds.length} total)`)
  } else {
    console.log(`[sync] No changes needed (${desiredIds.length} tracks)`)
  }
}

// Settings-only update — no playlist rebuild, no interruption to playback
export async function updatePlaylistSettings(queue: RadioQueue) {
  const playlistId = await ensurePlaylist()
  const prevLoop = loopEnabled
  loopEnabled = queue.loopPlaylist ?? true
  await setPlaylistLoop(playlistId, loopEnabled)

  // If switching FROM no-loop TO loop, clear upcoming queue so AzuraCast
  // re-generates it with all remaining tracks (some may have been removed)
  if (loopEnabled && !prevLoop) {
    console.log(`[sync] Loop re-enabled — triggering full resync`)
    await syncQueueToAzuraCast(queue)
    return
  }

  console.log(`[sync] Playlist loop updated to ${loopEnabled} (no rebuild)`)
}

// SSE subscription — removes played tracks from AzuraCast when loop is off
export function startNowPlayingSubscription() {
  subscribeNowPlaying(async (np) => {
    const song = np.now_playing.song
    const currentTitle = song.title
    console.log(`[sse] Now playing: "${currentTitle}" by ${song.artist}`)

    // When loop is off and song changes, remove the previous song from the playlist
    if (!loopEnabled && lastPlayedSongTitle && lastPlayedSongTitle !== currentTitle) {
      const mediaId = findMediaIdBySongTitle(lastPlayedSongTitle)
      if (mediaId) {
        try {
          await removeFileFromPlaylist(mediaId)
          await clearUpcomingQueue()
          console.log(`[sse] No-loop: removed played track "${lastPlayedSongTitle}" (media ID ${mediaId}) from playlist`)
        } catch (err) {
          console.error(`[sse] Failed to remove played track:`, err)
        }
      } else {
        console.log(`[sse] No-loop: could not find media ID for "${lastPlayedSongTitle}" — skipping removal`)
      }
    }

    lastPlayedSongTitle = currentTitle
  })
}
