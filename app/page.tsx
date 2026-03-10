import { getPage } from '@/lib/sanity'
import { PortableText } from 'next-sanity'

export default async function HomePage() {
  const page = await getPage('home').catch(() => null)

  return (
    <div className="page-content">
      <div className="front-page-content">
        {page?.body ? (
          <div className="entry-content">
            <PortableText value={page.body} />
          </div>
        ) : (
          <p>Welcome to Bark Like Dog.</p>
        )}
      </div>
    </div>
  )
}
