import { getPosts } from '@/lib/sanity'
import BlogGrid from '@/components/BlogGrid'

export default async function PostsPage() {
  const posts = await getPosts().catch(() => [])

  return (
    <div className="page-content">
      <BlogGrid posts={posts} />
    </div>
  )
}
