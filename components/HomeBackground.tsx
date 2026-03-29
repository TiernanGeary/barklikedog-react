'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import MogensenBackground from './MogensenBackground'
import RadioToggle from './RadioToggle'

export default function HomeBackground() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const wasHome = useRef(isHome)
  const [visible, setVisible] = useState(isHome)
  const [mounted, setMounted] = useState(isHome)

  // Synchronously set bg-fading during render — before paint — so content is hidden immediately
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
        <MogensenBackground />
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
