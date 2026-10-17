'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const PHOTOS = ['hoodie2', 'knitsweat', 'magg', 'watamelon-2']
const SLIDE_DURATION = 2800

export default function LandingSlideshow() {
  const [active, setActive] = useState(0)
  const slideshowRef = useRef<HTMLAnchorElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setInterval> | undefined

    function syncPlayback() {
      clearInterval(timer)
      if (reducedMotion.matches || document.hidden || paused) return
      timer = setInterval(() => {
        setActive(current => {
          const next = (current + 1) % PHOTOS.length
          const image = slideshowRef.current?.querySelectorAll('img')[next]
          return image?.complete && image.naturalWidth > 0 ? next : current
        })
      }, SLIDE_DURATION)
    }

    syncPlayback()
    reducedMotion.addEventListener('change', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    return () => {
      clearInterval(timer)
      reducedMotion.removeEventListener('change', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
    }
  }, [paused])

  return (
    <Link
      draggable={false}
      ref={slideshowRef}
      href="/shop"
      className="landing-slideshow"
      aria-label="Explore the rlyrlynice shop"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {PHOTOS.map((photo, index) => (
        <img draggable={false}
          key={photo}
          src={`/landing/${photo}-1200.webp`}
          srcSet={`/landing/${photo}-640.webp 640w, /landing/${photo}-1200.webp 1200w`}
          sizes="(max-width: 768px) 63vw, min(23.4vw, 36svh)"
          width={1200}
          height={1600}
          alt=""
          aria-hidden="true"
          className={`landing-photo${index === active ? ' is-active' : ''}`}
          fetchPriority={index === 0 ? 'high' : 'low'}
          loading="eager"
        />
      ))}
    </Link>
  )
}
