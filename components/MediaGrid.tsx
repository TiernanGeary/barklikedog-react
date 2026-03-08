import Link from 'next/link'
import Image from 'next/image'
import type { WPMediaItem } from '@/lib/types'
import { getFeaturedImage } from '@/lib/wordpress'

interface Props {
  items: WPMediaItem[]
}

export default function MediaGrid({ items }: Props) {
  if (!items.length) return <p>No media found.</p>

  // Sort: featured first (nv_media_featured === '1'), then by nv_media_order ASC, then date DESC
  const sorted = [...items].sort((a, b) => {
    const aFeat = a.nv_media_featured === '1' ? 1 : 0
    const bFeat = b.nv_media_featured === '1' ? 1 : 0
    if (bFeat !== aFeat) return bFeat - aFeat
    const aOrd = parseInt(a.nv_media_order || '999', 10)
    const bOrd = parseInt(b.nv_media_order || '999', 10)
    if (aOrd !== bOrd) return aOrd - bOrd
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <div className="media-grid">
      {sorted.map(item => {
        const img = getFeaturedImage(item)
        const isFeatured = item.nv_media_featured === '1'

        return (
          <div
            key={item.id}
            className={`media-item${isFeatured ? ' media-item-featured' : ''}`}
          >
            <Link href={`/media/${item.slug}`}>
              <div className="media-image-wrapper">
                {img ? (
                  <Image
                    src={img.src}
                    alt={img.alt || item.title.rendered}
                    width={400}
                    height={400}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="media-placeholder" />
                )}
              </div>
              <div
                className="media-item-title"
                dangerouslySetInnerHTML={{ __html: item.title.rendered }}
              />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
