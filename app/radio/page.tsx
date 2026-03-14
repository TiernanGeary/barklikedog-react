import { sanityFetch } from '@/sanity/lib/live'
import RadioPlayer from '@/components/RadioPlayer'

export const metadata = {
  title: 'Radio',
}

const RADIO_QUEUE_QUERY = `*[_type == "radioQueue"][0] {
  loopPlaylist,
  tracks[] {
    _key,
    label,
    "title": trackRef->title,
    "audioUrl": trackRef->audioFile.asset->url,
    "coverArt": trackRef->featuredImage.asset->url,
    "status": trackRef->status,
    "duration": trackRef->duration
  }
}`

const RADIO_SETTINGS_QUERY = `*[_type == "radioSettings"][0] {
  uploadsEnabled,
  skipVoteThreshold
}`

const RADIO_CHAT_QUERY = `*[_type == "radioChatMessage"] | order(_createdAt desc) [0..199] {
  _id, nickname, message, _createdAt
} | order(_createdAt asc)`

const SKIP_VOTE_QUERY = `*[_type == "radioSkipVote" && _id == "radioSkipVote"][0] {
  songTitle, voteCount
}`

export default async function RadioPage() {
  const [{ data: queue }, { data: settings }, { data: chatMessages }, { data: skipVote }] = await Promise.all([
    sanityFetch({ query: RADIO_QUEUE_QUERY }),
    sanityFetch({ query: RADIO_SETTINGS_QUERY }),
    sanityFetch({ query: RADIO_CHAT_QUERY }),
    sanityFetch({ query: SKIP_VOTE_QUERY }),
  ])

  return (
    <RadioPlayer
      tracks={queue?.tracks ?? []}
      uploadsEnabled={settings?.uploadsEnabled ?? true}
      azuracastBaseUrl={process.env.NEXT_PUBLIC_AZURACAST_SSE_URL || 'https://radio.barklike.dog'}
      chatMessages={chatMessages ?? []}
      skipVoteThreshold={settings?.skipVoteThreshold ?? 3}
      skipVoteCount={skipVote?.voteCount ?? 0}
      skipVoteSong={skipVote?.songTitle ?? ''}
    />
  )
}
