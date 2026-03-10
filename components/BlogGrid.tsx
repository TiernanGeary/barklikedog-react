import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/lib/types'

interface Props {
  posts: Post[]
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
      <FeaturedPost post={featured} />
      {rest.map(post => (
        <RegularPost key={post._id} post={post} />
      ))}
    </div>
  )
}

function FeaturedPost({ post }: { post: Post }) {
  const img = post.featuredImage?.asset?.url

  return (
    <article className="post-item post-item--featured">
      <Link href={`/posts/${post.slug.current}`} className="post-item-link">
        {img && (
          <div className="post-item-image">
            <Image
              src={img}
              alt={post.featuredImage?.alt || post.title}
              width={800}
              height={340}
              style={{ width: '100%', height: '340px', objectFit: 'cover' }}
              priority
            />
          </div>
        )}
        <div className="post-item-content">
          <span className="post-item-label">Latest</span>
          <h2 className="post-item-title">{post.title}</h2>
          <div className="post-item-meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </div>
          {post.excerpt && (
            <div className="post-item-excerpt">
              <p>{post.excerpt}</p>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

function RegularPost({ post }: { post: Post }) {
  const img = post.featuredImage?.asset?.url

  return (
    <article className="post-item">
      <Link href={`/posts/${post.slug.current}`} className="post-item-link">
        {img && (
          <div className="post-item-image">
            <Image
              src={img}
              alt={post.featuredImage?.alt || post.title}
              width={400}
              height={180}
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
          </div>
        )}
        <h2 className="post-item-title">{post.title}</h2>
        <div className="post-item-meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </div>
        {post.excerpt && (
          <div className="post-item-excerpt">
            <p>{post.excerpt}</p>
          </div>
        )}
      </Link>
    </article>
  )
}
