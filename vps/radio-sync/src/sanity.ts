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

let lastFingerprint = ''

export function listenToQueue(callback: (queue: RadioQueue) => void) {
  const subscription = sanityClient
    .listen('*[_type == "radioQueue"]')
    .subscribe(() => {
      fetchQueue().then((queue) => {
        if (!queue) return
        const keys = (queue.tracks ?? []).map((t) => t._key).join(',')
        const fingerprint = `${keys}|loop=${queue.loopPlaylist}`
        if (fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint
          console.log('[sanity] Queue changed, triggering sync')
          callback(queue)
        }
      })
    })

  return subscription
}
