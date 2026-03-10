import { notFound } from 'next/navigation'
import { PortableText } from 'next-sanity'
import { getPage } from '@/lib/sanity'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug).catch(() => null)
  if (!page) notFound()

  return (
    <div className="page-content">
      <h1 className="page-title">{page.title}</h1>
      {page.body && (
        <div className="entry-content">
          <PortableText value={page.body} />
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug).catch(() => null)
  return { title: page?.title ?? 'Page' }
}
