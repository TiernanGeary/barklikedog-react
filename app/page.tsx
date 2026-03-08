import { getPage } from '@/lib/wordpress'

export default async function HomePage() {
  const page = await getPage('home').catch(() => null)

  return (
    <div className="page-content">
      <div className="front-page-content">
        {page ? (
          <div
            className="entry-content"
            dangerouslySetInnerHTML={{ __html: page.content.rendered }}
          />
        ) : (
          <p>Welcome to Niche Vault.</p>
        )}
      </div>
    </div>
  )
}
