import Link from 'next/link'
import Image from 'next/image'
import type { WPPost } from '@/lib/types'
import { getFeaturedImage } from '@/lib/wordpress'

interface Props {
  posts: WPPost[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogGrid({ posts }: Props) {
  if (!posts.length) return <p>No posts found.</p>

  const [featured, ...rest] = posts

  return (
    <div className="posts-list">
      {/* Featured (first/latest) post */}
      <FeaturedPost post={featured} />

      {/* Remaining posts in 2-col grid */}
      {rest.map(post => (
        <RegularPost key={post.id} post={post} />
      ))}
    </div>
  )
}

function FeaturedPost({ post }: { post: WPPost }) {
  const img = getFeaturedImage(post)

  return (
    <article className="post-item post-item--featured">
      <Link href={`/posts/${post.slug}`} className="post-item-link">
        {img && (
          <div className="post-item-image">
            <Image
              src={img.src}
              alt={img.alt || post.title.rendered}
              width={800}
              height={340}
              style={{ width: '100%', height: '340px', objectFit: 'cover' }}
              priority
            />
          </div>
        )}
        <div className="post-item-content">
          <span className="post-item-label">Latest</span>
          <h2
            className="post-item-title"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <div className="post-item-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>
          <div
            className="post-item-excerpt"
            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
          />
        </div>
      </Link>
    </article>
  )
}

function RegularPost({ post }: { post: WPPost }) {
  const img = getFeaturedImage(post)

  return (
    <article className="post-item">
      <Link href={`/posts/${post.slug}`} className="post-item-link">
        {img && (
          <div className="post-item-image">
            <Image
              src={img.src}
              alt={img.alt || post.title.rendered}
              width={400}
              height={180}
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
          </div>
        )}
        <h2
          className="post-item-title"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        <div className="post-item-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
        <div
          className="post-item-excerpt"
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />
      </Link>
    </article>
  )
}
