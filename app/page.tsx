import { getPage } from '@/lib/sanity'
import { PortableText } from 'next-sanity'

export default async function HomePage() {
  const page = await getPage('home').catch(() => null)

  return (
    <div className="page-content">
      {page?.body && (
        <div className="entry-content">
          <PortableText value={page.body} />
        </div>
      )}
    </div>
  )
}
