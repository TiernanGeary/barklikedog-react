import Link from 'next/link'
import Image from 'next/image'
import type { MediaItem } from '@/lib/types'

interface Props {
  items: MediaItem[]
}

export default function MediaGrid({ items }: Props) {
  if (!items.length) return <p>No media found.</p>

  return (
    <div className="media-grid">
      {items.map(item => {
        const img = item.featuredImage?.asset?.url

        return (
          <div
            key={item._id}
            className={`media-item${item.featured ? ' media-item-featured' : ''}`}
          >
            <Link href={`/media/${item.slug.current}`}>
              <div className="media-image-wrapper">
                {img ? (
                  <Image
                    src={img}
                    alt={item.featuredImage?.alt || item.title}
                    width={400}
                    height={400}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="media-placeholder" />
                )}
              </div>
              <div className="media-item-title">{item.title}</div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
