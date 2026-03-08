import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getMediaItem, getFeaturedImage } from '@/lib/wordpress'
import AudioPlayer from '@/components/AudioPlayer'

interface Props {
  params: Promise<{ slug: string }>
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export default async function MediaItemPage({ params }: Props) {
  const { slug } = await params
  const item = await getMediaItem(slug).catch(() => null)
  if (!item) notFound()

  const img = getFeaturedImage(item)
  const mediaType = item.nv_media_type || 'photo'

  return (
    <div className="page-content">
      <div className="single-media">
        {/* Left: media content */}
        <div className="single-media-content">
          {mediaType === 'audio' && item.nv_audio_url ? (
            <>
              {img && (
                <Image
                  src={img.src}
                  alt={img.alt || item.title.rendered}
                  width={600}
                  height={600}
                  style={{ width: '100%', height: 'auto', marginBottom: '0' }}
                  priority
                />
              )}
              <AudioPlayer
                src={item.nv_audio_url}
                description={item.content.rendered}
              />
            </>
          ) : mediaType === 'video' && item.nv_video_url ? (
            <div className="media-video-embed">
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(item.nv_video_url)
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      title={item.title.rendered}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )
                }
                return <video src={item.nv_video_url} controls style={{ width: '100%' }} />
              })()}
            </div>
          ) : img ? (
            <Image
              src={img.src}
              alt={img.alt || item.title.rendered}
              width={800}
              height={800}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          ) : null}
        </div>

        {/* Right: info */}
        <div className="single-media-info">
          <Link href="/media" className="back-link">← Media</Link>

          <h1
            className="single-media-title"
            dangerouslySetInnerHTML={{ __html: item.title.rendered }}
          />

          <div className="single-media-type">{mediaType}</div>

          {/* Description shown separately for non-audio (audio renders it in the player) */}
          {mediaType !== 'audio' && item.content.rendered && (
            <div
              className="single-media-description"
              dangerouslySetInnerHTML={{ __html: item.content.rendered }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const item = await getMediaItem(slug).catch(() => null)
  return { title: item ? item.title.rendered.replace(/<[^>]+>/g, '') : 'Media' }
}
