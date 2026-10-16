import LandingSlideshow from '@/components/LandingSlideshow'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="landing-page">
      <h1 className="visually-hidden">rlyrlynice</h1>
      <LandingSlideshow />
      <Link href="/shop" className="landing-shop-link" draggable={false}>shop</Link>
    </div>
  )
}
