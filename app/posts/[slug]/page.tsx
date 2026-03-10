import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { getPost } from '@/lib/sanity'

interface Props {
  params: Promise<{ slug: string }>
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug).catch(() => null)
  if (!post) notFound()

  const img = post.featuredImage?.asset?.url

  return (
    <div className="page-content">
      <article className="single-post">
        <Link href="/posts" className="back-link">← Posts</Link>

        <header className="single-post-header">
          <h1 className="single-post-title">{post.title}</h1>
          <div className="single-post-meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.categories && post.categories.length > 0 && (
              <span className="single-post-categories">
                {post.categories.map(c => c.name).join(', ')}
              </span>
            )}
          </div>
        </header>

        {img && (
          <div className="single-post-image">
            <Image
              src={img}
              alt={post.featuredImage?.alt || post.title}
              width={1200}
              height={600}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </div>
        )}

        {post.body && (
          <div className="single-post-content">
            <PortableText value={post.body} />
          </div>
        )}
      </article>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug).catch(() => null)
  return { title: post?.title ?? 'Post' }
}
