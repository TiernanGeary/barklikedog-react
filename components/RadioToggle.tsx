'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const STREAM_URL = 'https://radio.barklike.dog/listen/bark_like_dog_radio/radio.mp3'

export default function RadioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [color, setColor] = useState('#333')
  const intentionalPause = useRef(false)

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

  // Stop playback when navigating away from home
  useEffect(() => {
    function stop() {
      if (audioRef.current) {
        audioRef.current.onpause = null
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      setPlaying(false)
    }
    window.addEventListener('radio-stop', stop)
    return () => {
      stop()
      window.removeEventListener('radio-stop', stop)
    }
  }, [])

  // Beat detection via Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const beatRafRef = useRef(0)

  useEffect(() => {
    if (!playing || !audioRef.current) {
      cancelAnimationFrame(beatRafRef.current)
      return
    }

    const audio = audioRef.current
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current

    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audio)
        analyserRef.current = ctx.createAnalyser()
        analyserRef.current.fftSize = 256
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(ctx.destination)
      } catch {
        return
      }
    }

    const analyser = analyserRef.current!
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let rollingAvg = 0
    let lastBeat = 0

    function detect() {
      if (!playing) return
      analyser.getByteFrequencyData(dataArray)

      // Bass energy: average of first 8 bins (~0-150Hz)
      let bass = 0
      for (let i = 0; i < 8; i++) bass += dataArray[i]
      bass /= 8

      rollingAvg = rollingAvg * 0.9 + bass * 0.1
      const now = performance.now()

      if (bass > rollingAvg * 1.4 && bass > 80 && now - lastBeat > 300) {
        lastBeat = now
        window.dispatchEvent(new CustomEvent('beat'))
      }

      beatRafRef.current = requestAnimationFrame(detect)
    }
    beatRafRef.current = requestAnimationFrame(detect)

    return () => cancelAnimationFrame(beatRafRef.current)
  }, [playing])

  function skipSong() {
    fetch('/api/radio/skip-song', { method: 'POST' }).catch(() => {})
    // Reconnect the stream after a short delay so the listener hears the new song
    if (audioRef.current && playing) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = ''
          audioRef.current.src = STREAM_URL
          audioRef.current.play().catch(() => {})
        }
      }, 1500)
    }
  }

  // Register Media Session handlers (AirPods, lock screen controls, etc.)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!playing) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Bark Like Dog Radio',
      artist: 'barklike.dog',
    })

    navigator.mediaSession.setActionHandler('nexttrack', skipSong)
    navigator.mediaSession.setActionHandler('pause', () => {
      intentionalPause.current = true
      if (audioRef.current) audioRef.current.pause()
      setPlaying(false)
    })
    navigator.mediaSession.setActionHandler('play', () => {
      intentionalPause.current = false
      if (!audioRef.current) {
        audioRef.current = new Audio(STREAM_URL)
        audioRef.current.crossOrigin = 'anonymous'
        audioRef.current.volume = volume
      }
      audioRef.current.src = STREAM_URL
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    })

    return () => {
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('play', null)
    }
  }, [playing, volume])

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(STREAM_URL)
      audioRef.current.crossOrigin = 'anonymous'
      audioRef.current.volume = volume
    }
    if (playing) {
      intentionalPause.current = true
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      setPlaying(false)
    } else {
      intentionalPause.current = false
      audioRef.current.src = STREAM_URL
      audioRef.current.play().catch(() => {})
      // Auto-resume only if paused by an interruption (not user action)
      audioRef.current.onpause = () => {
        if (intentionalPause.current) return
        if (audioRef.current && !audioRef.current.ended) {
          setTimeout(() => {
            if (audioRef.current && !intentionalPause.current) {
              audioRef.current.play().catch(() => {})
            }
          }, 500)
        }
      }
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
