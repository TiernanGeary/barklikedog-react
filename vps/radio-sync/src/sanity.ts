import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2026-03-10',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

export interface QueueTrack {
  _key: string
  title: string
  audioUrl: string
  status: string
}

export interface RadioQueue {
  _id: string
  loopPlaylist: boolean
  tracks: QueueTrack[]
}

const QUEUE_QUERY = `*[_type == "radioQueue"][0] {
  _id,
  loopPlaylist,
  tracks[] {
    _key,
    "title": trackRef->title,
    "audioUrl": trackRef->audioFile.asset->url,
    "status": trackRef->status
  }
}`

export async function fetchQueue(): Promise<RadioQueue | null> {
  return sanityClient.fetch(QUEUE_QUERY)
}

let lastTrackKeys = ''
let lastLoop: boolean | null = null

function checkQueue(
  queue: RadioQueue,
  onTracksChanged: (queue: RadioQueue) => void,
  onSettingsChanged: (queue: RadioQueue) => void,
) {
  const keys = (queue.tracks ?? []).map((t) => t._key).join(',')
  const loop = queue.loopPlaylist ?? true

  const tracksChanged = keys !== lastTrackKeys
  const loopChanged = lastLoop !== null && loop !== lastLoop

  lastTrackKeys = keys
  lastLoop = loop

  if (tracksChanged) {
    console.log('[sanity] Track list changed, triggering full sync')
    onTracksChanged(queue)
  } else if (loopChanged) {
    console.log(`[sanity] Loop setting changed to ${loop}, updating playlist`)
    onSettingsChanged(queue)
  }
}

export function listenToQueue(
  onTracksChanged: (queue: RadioQueue) => void,
  onSettingsChanged: (queue: RadioQueue) => void,
) {
  // Real-time listener
  const subscription = sanityClient
    .listen('*[_type == "radioQueue"]')
    .subscribe(() => {
      fetchQueue().then((queue) => {
        if (queue) checkQueue(queue, onTracksChanged, onSettingsChanged)
      })
    })

  // Poll every 60s as safety net in case the listener drops
  const pollInterval = setInterval(() => {
    fetchQueue().then((queue) => {
      if (queue) checkQueue(queue, onTracksChanged, onSettingsChanged)
    }).catch((err) => {
      console.error('[sanity] Poll error:', err)
    })
  }, 60_000)

  return { subscription, pollInterval }
}
