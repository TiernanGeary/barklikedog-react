import { notFound } from 'next/navigation'
import { getPage } from '@/lib/wordpress'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug).catch(() => null)
  if (!page) notFound()

  return (
    <div className="page-content">
      <h1
        className="page-title"
        dangerouslySetInnerHTML={{ __html: page.title.rendered }}
      />
      <div
        className="entry-content"
        dangerouslySetInnerHTML={{ __html: page.content.rendered }}
      />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug).catch(() => null)
  return { title: page ? page.title.rendered.replace(/<[^>]+>/g, '') : 'Page' }
}
