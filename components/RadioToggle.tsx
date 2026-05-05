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
  const [beatCount, setBeatCount] = useState(0)
  const [bassLevel, setBassLevel] = useState(0)
  const [bpm, setBpm] = useState(0)
  const bpmTimesRef = useRef<number[]>([])

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
  const connectedAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!playing || !audioRef.current) {
      cancelAnimationFrame(beatRafRef.current)
      return
    }

    const audio = audioRef.current

    // Create AudioContext on first use
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.connect(audioCtxRef.current.destination)
    }
    const ctx = audioCtxRef.current

    // Resume if suspended (happens after user gesture requirement)
    if (ctx.state === 'suspended') ctx.resume()

    // Only create a new source if the audio element changed
    if (connectedAudioRef.current !== audio) {
      try {
        if (sourceRef.current) sourceRef.current.disconnect()
        sourceRef.current = ctx.createMediaElementSource(audio)
        sourceRef.current.connect(analyserRef.current!)
        connectedAudioRef.current = audio
      } catch {
        return
      }
    }

    const analyser = analyserRef.current!
    analyser.fftSize = 2048
    const bufferLength = analyser.frequencyBinCount
    const spectrum = new Uint8Array(bufferLength)
    const prevSpectrum = new Float32Array(bufferLength)
    const HISTORY_SIZE = 43
    const THRESHOLD_MULT = 1.5
    const MIN_INTERVAL = 250
    const BASS_BINS = 10
    const fluxHistory: number[] = new Array(HISTORY_SIZE).fill(0)
    let lastBeat = 0

    let frameCount = 0
    function detect() {
      if (!playing) return
      analyser.getByteFrequencyData(spectrum)

      // Rectified spectral flux: sum of positive differences in bass range
      let flux = 0
      for (let i = 1; i <= BASS_BINS; i++) {
        const diff = spectrum[i] - prevSpectrum[i]
        if (diff > 0) flux += diff
      }
      prevSpectrum.set(spectrum)

      // Adaptive threshold via median of recent flux
      fluxHistory.push(flux)
      fluxHistory.shift()
      const sorted = [...fluxHistory].sort((a, b) => a - b)
      const median = sorted[Math.floor(HISTORY_SIZE / 2)]
      const threshold = median * THRESHOLD_MULT + 1

      const now = performance.now()

      frameCount++
      if (frameCount % 10 === 0) {
        setBassLevel(Math.round(flux))
      }

      if (flux > threshold && now - lastBeat > MIN_INTERVAL) {
        lastBeat = now
        setBeatCount(c => c + 1)
        window.dispatchEvent(new CustomEvent('beat'))

        // Calculate BPM from recent beats
        bpmTimesRef.current.push(now)
        if (bpmTimesRef.current.length > 12) bpmTimesRef.current.shift()
        if (bpmTimesRef.current.length >= 4) {
          const times = bpmTimesRef.current
          const avgInterval = (times[times.length - 1] - times[0]) / (times.length - 1)
          setBpm(Math.round(60000 / avgInterval))
        }
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
      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.volume = volume
      audioRef.current = audio
    }
    if (playing) {
      intentionalPause.current = true
      audioRef.current.pause()
      audioRef.current.src = ''
      setPlaying(false)
    } else {
      intentionalPause.current = false
      audioRef.current.src = STREAM_URL
      audioRef.current.play().catch(() => {})
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

      {/* DEBUG: Beat detection monitor (change false to true to enable) */}
      {false && playing && (
        <div style={{
          position: 'fixed',
          bottom: 70,
          right: 24,
          fontSize: 10,
          fontFamily: 'Courier New, monospace',
          color: '#333',
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 8px',
          zIndex: 999,
        }}>
          <div>flux: {bassLevel}</div>
          <div>beats: {beatCount}</div>
          <div>bpm: {bpm}</div>
        </div>
      )}
    </div>
  )
}
