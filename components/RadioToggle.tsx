'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const STREAM_URL = 'http://radio.barklike.dog/listen/bark_like_dog_radio/radio.mp3'

export default function RadioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [color, setColor] = useState('#333')

  useEffect(() => {
    function read() {
      const c = getComputedStyle(document.documentElement).getPropertyValue('--panel-color').trim()
      if (c) setColor(c)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(STREAM_URL)
      audioRef.current.crossOrigin = 'anonymous'
      audioRef.current.volume = volume
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      setPlaying(false)
    } else {
      audioRef.current.src = STREAM_URL
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  const updateVolume = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    setVolume(Math.max(0, Math.min(1, ratio)))
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      updateVolume(x)
    }
    function onUp() { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [updateVolume])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Speaker button */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Mute radio' : 'Play radio'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85,
          transition: 'opacity 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
      >
        {playing ? (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill={color} />
            <path d="M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill={color} />
            <line x1="18" y1="9" x2="22" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="9" x2="18" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Horizontal volume bar */}
      <div
        ref={barRef}
        onMouseDown={e => { dragging.current = true; updateVolume(e.clientX) }}
        onTouchStart={e => { dragging.current = true; updateVolume(e.touches[0].clientX) }}
        style={{
          width: 80,
          height: 4,
          background: color,
          opacity: 0.2,
          cursor: 'ew-resize',
          position: 'relative',
          touchAction: 'none',
        }}
      >
        {/* Fill from left */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${volume * 100}%`,
            background: color,
            opacity: 1,
          }}
        />
        {/* Knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${volume * 100}%`,
            width: 10,
            height: 10,
            background: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  )
}
