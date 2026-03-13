'use client'

import { useEffect, useRef, useState } from 'react'
import type { RadioTrack } from '@/lib/types'

const STREAM_URL = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || ''
const NOW_PLAYING_URL = process.env.NEXT_PUBLIC_RADIO_NOW_PLAYING_URL || ''
const POLL_INTERVAL = 10_000

interface Props {
  tracks: RadioTrack[]
}

export default function RadioPlayer({ tracks }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<string>('')

  // Poll the now-playing endpoint from Liquidsoap
  useEffect(() => {
    if (!NOW_PLAYING_URL) return

    async function poll() {
      try {
        const res = await fetch(NOW_PLAYING_URL, { cache: 'no-store' })
        const data = await res.json()
        if (data.title) setNowPlaying(data.title)
      } catch {
        // stream may be down
      }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleVolume(val: number) {
    setVolume(val)
    if (audioRef.current) audioRef.current.volume = val
    if (val > 0 && muted) setMuted(false)
  }

  function toggleMute() {
    if (audioRef.current) audioRef.current.muted = !muted
    setMuted(!muted)
  }

  return (
    <div className="radio-page">
      <style>{styles}</style>

      {/* Video background */}
      <div className="radio-video-wrap">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          style={{ pointerEvents: 'none' }}
        >
          <source src="/djloop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Audio stream */}
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

      {/* Overlay UI */}
      <div className="radio-overlay">
        {/* Now playing */}
        <div className="radio-now-playing">
          <span className="radio-live-dot" />
          <span className="radio-live-label">LIVE</span>
          {nowPlaying && (
            <span className="radio-now-title">{nowPlaying}</span>
          )}
        </div>

        {/* Controls */}
        <div className="radio-controls">
          <button
            className="radio-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="radio-icon-pause" />
            ) : (
              <span className="radio-icon-play" />
            )}
          </button>

          <div className="radio-volume">
            <button
              className="radio-vol-btn"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <span className="audio-icon-muted" />
              ) : (
                <span className="audio-icon-vol" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="radio-vol-slider"
            />
          </div>
        </div>

        {/* Track list from Sanity */}
        {tracks.length > 0 && (
          <div className="radio-tracklist">
            <div className="radio-tracklist-header">QUEUE</div>
            <ul>
              {tracks.map((track, i) => (
                <li
                  key={i}
                  className={
                    nowPlaying === (track.label || track.title)
                      ? 'radio-track radio-track-active'
                      : 'radio-track'
                  }
                >
                  <span className="radio-track-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="radio-track-title">{track.label || track.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = `
/* Hide sidebar and footer on radio page */
#sidebar,
#footer {
  display: none !important;
}

#main-content {
  margin-left: 0 !important;
  width: 100% !important;
}

.radio-page {
  position: fixed;
  inset: 0;
  z-index: 99999;
  font-family: 'Courier New', Courier, monospace;
  color: #ffffff;
  background: #000000;
  overflow: hidden;
}

.radio-video-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  opacity: 0.85;
}

.radio-overlay {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 30px;
}

/* Now playing bar */
.radio-now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.radio-live-dot {
  width: 8px;
  height: 8px;
  background: #ff3700;
  border-radius: 50%;
  animation: radio-pulse 1.5s ease-in-out infinite;
}

@keyframes radio-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.radio-live-label {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.15em;
  color: #ff3700;
}

.radio-now-title {
  font-size: 13px;
  opacity: 0.9;
}

/* Controls */
.radio-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.radio-play-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: border-color 0.2s;
  padding: 0;
}

.radio-play-btn:hover {
  border-color: rgba(255, 255, 255, 0.7);
  background: none;
}

.radio-icon-play {
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 14px;
  border-color: transparent transparent transparent #ffffff;
  margin-left: 3px;
}

.radio-icon-pause {
  display: flex;
  gap: 4px;
}

.radio-icon-pause::before,
.radio-icon-pause::after {
  content: '';
  display: block;
  width: 4px;
  height: 16px;
  background: #ffffff;
}

/* Volume */
.radio-volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-vol-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.radio-vol-btn:hover {
  background: none;
}

.radio-vol-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 80px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  cursor: pointer;
  border: none;
}

.radio-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
}

.radio-vol-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  background: #ffffff;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

/* Track list */
.radio-tracklist {
  max-height: 40vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 400px;
}

.radio-tracklist-header {
  font-size: 10px;
  letter-spacing: 0.15em;
  opacity: 0.5;
  margin-bottom: 12px;
}

.radio-tracklist ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.radio-track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.radio-track:hover {
  opacity: 1;
}

.radio-track-active {
  opacity: 1;
  font-weight: bold;
}

.radio-track-active .radio-track-num {
  color: #ff3700;
}

.radio-track-num {
  font-size: 10px;
  opacity: 0.5;
  min-width: 20px;
}

.radio-track-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 768px) {
  .radio-overlay {
    padding: 20px;
  }

  .radio-tracklist {
    max-width: 100%;
  }
}
`
