import { getMediaItems } from '@/lib/wordpress'
import MediaGrid from '@/components/MediaGrid'

export default async function MediaPage() {
  const items = await getMediaItems().catch(() => [])

  return (
    <div className="page-content">
      <MediaGrid items={items} />
    </div>
  )
}
