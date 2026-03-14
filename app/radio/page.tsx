import { sanityFetch } from '@/sanity/lib/live'
import RadioPlayer from '@/components/RadioPlayer'

export const metadata = {
  title: 'Radio',
}

const RADIO_QUEUE_QUERY = `*[_type == "radioQueue"][0] {
  loopPlaylist,
  currentTrackIndex,
  currentTrackStartedAt,
  tracks[] {
    label,
    "title": trackRef->title,
    "audioUrl": trackRef->audioFile.asset->url,
    "coverArt": trackRef->featuredImage.asset->url,
    "status": trackRef->status
  }
}`

export default async function RadioPage() {
  const { data: queue } = await sanityFetch({ query: RADIO_QUEUE_QUERY })

  return (
    <RadioPlayer
      tracks={queue?.tracks ?? []}
      currentTrackIndex={queue?.currentTrackIndex ?? 0}
    />
  )
}
