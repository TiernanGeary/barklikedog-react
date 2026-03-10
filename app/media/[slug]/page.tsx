import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { getMediaItem } from '@/lib/sanity'
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

  const img = item.featuredImage?.asset?.url
  const audioUrl = item.audioFile?.asset?.url

  return (
    <div className="page-content">
      <div className="single-media">
        {/* Left: media content */}
        <div className="single-media-content">
          {item.mediaType === 'audio' && audioUrl ? (
            <>
              {img && (
                <Image
                  src={img}
                  alt={item.featuredImage?.alt || item.title}
                  width={600}
                  height={600}
                  style={{ width: '100%', height: 'auto', marginBottom: '0' }}
                  priority
                />
              )}
              <AudioPlayer src={audioUrl} />
            </>
          ) : item.mediaType === 'video' && item.videoUrl ? (
            <div className="media-video-embed">
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(item.videoUrl)
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      title={item.title}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )
                }
                return <video src={item.videoUrl} controls style={{ width: '100%' }} />
              })()}
            </div>
          ) : img ? (
            <Image
              src={img}
              alt={item.featuredImage?.alt || item.title}
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

          <h1 className="single-media-title">{item.title}</h1>

          <div className="single-media-type">{item.mediaType}</div>

          {item.mediaType !== 'audio' && item.description && (
            <div className="single-media-description">
              <PortableText value={item.description} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const item = await getMediaItem(slug).catch(() => null)
  return { title: item?.title ?? 'Media' }
}
