import Link from 'next/link'
import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
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
          key={cat._id}
          href={`/shop?category=${cat.slug.current}`}
          className={`shop-filter-btn${activeSlug === cat.slug.current ? ' is-active' : ''}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
