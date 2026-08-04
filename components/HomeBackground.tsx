'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import MogensenBackground from './MogensenBackground'
import RadioToggle from './RadioToggle'

// Temporarily disabled: hides the live radio audio toggle on the front end.
// Set back to true (and re-enable the streaming server) to restore live music.
const LIVE_MUSIC_ENABLED = false

export default function HomeBackground() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const wasHome = useRef(isHome)
  const [visible, setVisible] = useState(isHome)
  const [mounted, setMounted] = useState(isHome)
  const [bgKey, setBgKey] = useState(0)

  useEffect(() => {
    function onRegenerate() { setBgKey(k => k + 1) }
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
        <MogensenBackground key={bgKey} />
      </div>
      {LIVE_MUSIC_ENABLED && (
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
      )}
    </>
  )
}
