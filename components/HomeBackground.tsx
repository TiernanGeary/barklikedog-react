'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import MogensenBackground from './MogensenBackground'
import RadioToggle from './RadioToggle'

const BG_VIDEOS = [
  '/bg-videos/SnapInsta.to_AQM1N2CygC9yBqVLgB7rsUa_QbI2QgUOb1VZqOTRgHPlpaCsnPyd6VJFTmogDEQ82j7umXzFLhjeJQp3rsXJyKKF7KZZYkH3yF79DP8.mp4',
  '/bg-videos/SnapInsta.to_AQMd0AXBV93LRXTPLx_2FHuJbxdEN71T33S3pnIKf-TCnK6B621jE8RMtWvD4Pv5UOY4OtsXBqP3EfnY2h122xY_oPYr7glkx6OH0TA.mp4',
  '/bg-videos/SnapInsta.to_AQMg4vZJFVM1NaFT6PJ-aLMasoB3j_TKFp2s3AEEOifu4BGQ2u76ohcara9XqrbutIaicXhC4DGq_baKHPQ0rARh9dnlIIUB-kU7hZE.mp4',
  '/bg-videos/SnapInsta.to_AQNDOh-ncjCU5Rau6W1bivWqNGdtDYfmyezuhWlOh8yGhN3Wp_y7AFjx64c2pLVDuw8nQ4yW6WLpGvgol8gua8tD.mp4',
  '/bg-videos/SnapInsta.to_AQNrhld75nFqxmAXgxLde0QpkkVCc3FTjF3Ze62C6LKdRnnNn3TgZ2hMbGeca8z0HtoUCV3HRrzmbboJChY3aKWGOChp0KlP_FgBUTA.mp4',
  '/bg-videos/SnapInsta.to_AQPcn5rtgV6cIyHa21mRW0NnoBTy1IskWpW5PFEBT35ZJZy0lRXgLKoisLfcdshGi6h9xDFsOnMI1DJie3KcJ-cFiJn-zJHfY7lT-Dc.mp4',
]

// ~20% chance of video, 80% generative
function pickMode(): { type: 'generative' } | { type: 'video'; src: string } {
  if (Math.random() < 0.2) {
    return { type: 'video', src: BG_VIDEOS[Math.floor(Math.random() * BG_VIDEOS.length)] }
  }
  return { type: 'generative' }
}

export default function HomeBackground() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const wasHome = useRef(isHome)
  const [visible, setVisible] = useState(isHome)
  const [mounted, setMounted] = useState(isHome)
  const [bgMode, setBgMode] = useState(() => pickMode())

  // Listen for regenerate event (logo click)
  useEffect(() => {
    function onRegenerate() { setBgMode(pickMode()) }
    window.addEventListener('regenerate-background', onRegenerate)
    return () => window.removeEventListener('regenerate-background', onRegenerate)
  }, [])

  if (typeof document !== 'undefined') {
    if (!isHome && wasHome.current) {
      document.body.classList.add('bg-fading')
    }
  }

  useEffect(() => {
    if (isHome) {
      setMounted(true)
      document.body.classList.remove('bg-fading')
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      if (wasHome.current) {
        window.dispatchEvent(new CustomEvent('radio-stop'))
      }
    }
    wasHome.current = isHome
  }, [isHome])

  function handleTransitionEnd() {
    if (!visible) {
      setMounted(false)
      document.body.classList.remove('bg-fading')
    }
  }

  if (!mounted) return null

  return (
    <>
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {bgMode.type === 'generative' ? (
          <MogensenBackground />
        ) : (
          <video
            key={bgMode.src}
            src={bgMode.src}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          position: 'fixed',
          bottom: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <RadioToggle />
      </div>
    </>
  )
}
