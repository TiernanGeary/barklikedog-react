import Link from 'next/link'
import type { WCCategory } from '@/lib/types'

interface Props {
  categories: WCCategory[]
  activeSlug?: string
}

export default function ShopFilterBar({ categories, activeSlug }: Props) {
  return (
    <div className="shop-filter-bar">
      <Link
        href="/shop"
        className={`shop-filter-btn${!activeSlug ? ' is-active' : ''}`}
      >
        All
      </Link>
      {categories.map(cat => (
        <Link
          key={cat.id}
          href={`/shop?category=${cat.slug}`}
          className={`shop-filter-btn${activeSlug === cat.slug ? ' is-active' : ''}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
