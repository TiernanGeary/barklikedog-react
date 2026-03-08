'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const PLAYER_COLORS = [
  '#ff3700', '#16b3e8', '#ead814', '#684c0b', '#369843', '#d90a8a', '#cd2f2f',
]

function formatTime(sec: number): string {
  if (isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function parseTimestamp(ts: string): number {
  const segs = ts.split(':').map(Number)
  if (segs.length === 3) return segs[0] * 3600 + segs[1] * 60 + segs[2]
  return segs[0] * 60 + segs[1]
}

interface Props {
  src: string
  description?: string  // raw HTML; timestamps become clickable
}

export default function AudioPlayer({ src, description }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]     = useState(false)
  const [muted, setMuted]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]   = useState(0)
  const [volume, setVolume]       = useState(1)
  const [bgColor] = useState(
    () => PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
  )

  const progress = duration ? (currentTime / duration) * 100 : 0

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play()
    else a.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.muted = !a.muted
    setMuted(a.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    const a = audioRef.current
    if (!a) return
    a.volume = val
    a.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    a.currentTime = pct * duration
  }, [duration])

  const seekTo = useCallback((secs: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = secs
    if (a.paused) a.play()
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onMeta  = () => setDuration(a.duration)
    const onTime  = () => setCurrentTime(a.currentTime)
    const onEnded = () => { setPlaying(false); setCurrentTime(0) }

    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnded)
    }
  }, [])

  // Process description HTML: convert timestamps to clickable spans
  const processedDescription = description?.replace(
    /(\d{1,2}(?::\d{2}){1,2})/g,
    (match) => {
      const secs = parseTimestamp(match)
      return `<a href="#" class="timestamp-link" data-seek="${secs}" onclick="return false;">${match}</a>`
    }
  )

  return (
    <>
      <div id="nv-audio-player" className="audio-player" style={{ background: bgColor }}>
        <audio ref={audioRef} id="nv-audio" src={src} preload="metadata" />

        {/* Play / Pause */}
        <button
          className="audio-player-btn"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={togglePlay}
        >
          {playing ? (
            <span className="audio-icon-pause" />
          ) : (
            <span className="audio-icon-play" />
          )}
        </button>

        {/* Current time */}
        <span className="audio-player-time">{formatTime(currentTime)}</span>

        {/* Progress bar */}
        <div
          className="audio-player-progress"
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="audio-player-progress-filled"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Duration */}
        <span className="audio-player-time">{formatTime(duration)}</span>

        {/* Volume */}
        <div className="audio-player-volume">
          <button
            className="audio-player-btn"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
          >
            <span className={muted ? 'audio-icon-muted' : 'audio-icon-vol'} />
          </button>
          <input
            type="range"
            className="audio-player-vol-slider"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
          />
        </div>
      </div>

      {description && (
        <div
          className="single-media-description"
          dangerouslySetInnerHTML={{ __html: processedDescription! }}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('timestamp-link')) {
              e.preventDefault()
              const secs = parseInt(target.dataset.seek ?? '0', 10)
              seekTo(secs)
            }
          }}
        />
      )}
    </>
  )
}
