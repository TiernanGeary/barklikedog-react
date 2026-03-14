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

export function listenToQueue(callback: (queue: RadioQueue) => void) {
  const subscription = sanityClient
    .listen('*[_type == "radioQueue"]')
    .subscribe(() => {
      fetchQueue().then((queue) => {
        if (!queue) return
        const newKeys = (queue.tracks ?? []).map((t) => t._key).join(',')
        if (newKeys !== lastTrackKeys) {
          lastTrackKeys = newKeys
          console.log('[sanity] Track list changed, triggering sync')
          callback(queue)
        }
      })
    })

  return subscription
}
