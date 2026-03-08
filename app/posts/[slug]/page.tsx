import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPost, getComments, getFeaturedImage, getCategories, getTags } from '@/lib/wordpress'
import Comments from '@/components/Comments'

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

  const [comments, img] = await Promise.all([
    getComments(post.id).catch(() => []),
    Promise.resolve(getFeaturedImage(post)),
  ])

  const categories = getCategories(post)
  const tags       = getTags(post)

  return (
    <div className="page-content">
      <article className="single-post">
        <Link href="/posts" className="back-link">← Posts</Link>

        <header className="single-post-header">
          <h1
            className="single-post-title"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <div className="single-post-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {categories.length > 0 && (
              <span className="single-post-categories">
                {categories.map(c => c.name).join(', ')}
              </span>
            )}
          </div>
        </header>

        {img && (
          <div className="single-post-image">
            <Image
              src={img.src}
              alt={img.alt || post.title.rendered}
              width={1200}
              height={600}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </div>
        )}

        <div
          className="single-post-content"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />

        {tags.length > 0 && (
          <div className="single-post-tags">
            {tags.map(tag => (
              <span key={tag.id} className="post-tag">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <Comments comments={comments} postId={post.id} />
      </article>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug).catch(() => null)
  return { title: post ? post.title.rendered.replace(/<[^>]+>/g, '') : 'Post' }
}
