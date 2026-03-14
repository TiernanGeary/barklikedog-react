'use client'

import { useRef, useState, useEffect } from 'react'
import type { RadioTrack } from '@/lib/types'
import RadioUpload from './RadioUpload'

const STREAM_URL = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || ''

interface Props {
  tracks: RadioTrack[]
  uploadsEnabled: boolean
  azuracastBaseUrl: string
}

export default function RadioPlayer({ tracks, uploadsEnabled, azuracastBaseUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)

  // Subscribe to AzuraCast SSE for now-playing
  useEffect(() => {
    if (!azuracastBaseUrl) return

    const sseUrl = `${azuracastBaseUrl}/api/live/nowplaying/sse?cf_connect=${encodeURIComponent(JSON.stringify({ subs: { 'station:1': { recover: true } } }))}`

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource(sseUrl)

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const np = data?.pub?.data?.np
          if (!np) return

          const songTitle = np.now_playing?.song?.title
          if (!songTitle) return

          // Match song title to queue track
          const idx = tracks.findIndex(
            (t) => t.title === songTitle || t.title?.includes(songTitle) || songTitle.includes(t.title),
          )

          if (idx >= 0) {
            setCurrentTrackIndex((prev) => {
              if (prev !== idx) {
                // Track changed — reload audio to reconnect to live edge
                const audio = document.querySelector('audio') as HTMLAudioElement | null
                if (audio && !audio.paused) {
                  audio.load()
                  audio.play().catch(() => {})
                }
              }
              return idx
            })
          }
        } catch {
          // Non-JSON keepalive — ignore
        }
      }

      es.onerror = () => {
        es?.close()
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [azuracastBaseUrl, tracks])

  const nowPlaying = currentTrackIndex >= 0
    ? tracks[currentTrackIndex]?.label || tracks[currentTrackIndex]?.title || ''
    : ''

  // Queue display: current track at top, only show from current onward
  const visibleTracks = currentTrackIndex >= 0
    ? tracks.slice(currentTrackIndex)
    : tracks

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

      {/* Video */}
      <div className="radio-video-wrap">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onCanPlay={(e) => (e.currentTarget.style.opacity = '1')}
          style={{ pointerEvents: 'none', opacity: 0, transition: 'opacity 0.5s ease' }}
        >
          <source src="/djloop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Audio stream */}
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

      {/* Controls below video */}
      <div className="radio-controls-area">
        <div className="radio-now-playing">
          <span className="radio-live-dot" />
          <span className="radio-live-label">LIVE</span>
          {nowPlaying && (
            <span className="radio-now-title">Currently Playing: {nowPlaying}</span>
          )}
        </div>

        <div className="radio-controls">
          <button
            className="radio-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Tune Out' : 'Tune In'}
          >
            {isPlaying ? 'TUNE OUT' : 'TUNE IN'}
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

        {visibleTracks.length > 0 && (
          <div className="radio-tracklist">
            <div className="radio-tracklist-header">
              {currentTrackIndex >= 0 ? 'NOW PLAYING' : 'QUEUE'}
            </div>
            <ul>
              {visibleTracks.map((track, i) => {
                const isCurrentTrack = i === 0 && currentTrackIndex >= 0
                return (
                  <li
                    key={track._key || i}
                    className={isCurrentTrack ? 'radio-track radio-track-active' : 'radio-track'}
                  >
                    <span className="radio-track-num">
                      {isCurrentTrack ? '▶' : String(i).padStart(2, '0')}
                    </span>
                    <span className="radio-track-title">{track.label || track.title}</span>
                    {track.duration != null && track.duration > 0 && (
                      <span className="radio-track-duration">
                        {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                      </span>
                    )}
                    {track.status === 'pending' && (
                      <span className="radio-track-pending">PENDING</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {uploadsEnabled && <RadioUpload />}
      </div>
    </div>
  )
}

const styles = `
.radio-page {
  padding: 40px 40px;
}

.radio-video-wrap {
  max-width: 100%;
  margin-bottom: 20px;
  aspect-ratio: 16 / 9;
  background: #ffffff;
}

.radio-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.radio-controls-area {
  color: #333333;
}

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
}

.radio-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.radio-play-btn {
  background-color: #0059e7;
  color: #ffffff;
  border: 0.5px solid transparent;
  cursor: pointer;
  padding: 6px 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.radio-play-btn:hover {
  background-color: #0059e7;
  color: #ffffff;
}

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
  background: #e0e0e0;
  outline: none;
  cursor: pointer;
  border: none;
}

.radio-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  background: #333333;
  border-radius: 50%;
  cursor: pointer;
}

.radio-vol-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  background: #333333;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.radio-tracklist {
  max-height: 40vh;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  padding: 16px 20px;
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
  flex: 1;
}

.radio-track-duration {
  font-size: 10px;
  opacity: 0.4;
  font-variant-numeric: tabular-nums;
}

.radio-track-pending {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #ff8c00;
  border: 1px solid #ff8c00;
  padding: 1px 6px;
}

@media (max-width: 768px) {
  .radio-page {
    padding: 20px 15px;
  }

  .radio-tracklist {
    max-width: 100%;
  }
}

.radio-upload {
  margin-top: 24px;
  max-width: 400px;
}

.radio-upload-toggle {
  background-color: #0059e7;
  color: #ffffff;
  border: 0.5px solid transparent;
  cursor: pointer;
  padding: 6px 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.radio-upload-toggle:hover {
  background-color: #0059e7;
  color: #ffffff;
}

.radio-upload-hint {
  font-size: 10px;
  opacity: 0.35;
  margin-bottom: 12px;
}

.radio-upload form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-upload-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.radio-upload-title {
  font-size: 12px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  outline: none;
  font-family: inherit;
  color: #333;
}

.radio-upload-title:focus {
  border-color: #333;
}

.radio-upload-file {
  font-size: 11px;
}

.radio-upload-btn {
  background-color: #0059e7;
  color: #ffffff;
  border: 0.5px solid transparent;
  cursor: pointer;
  padding: 6px 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.radio-upload-btn:hover:not(:disabled) {
  background-color: #0059e7;
  color: #ffffff;
}

.radio-upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-upload-success {
  font-size: 11px;
  color: #369843;
  margin-top: 8px;
}

.radio-upload-error {
  font-size: 11px;
  color: #cd2f2f;
  margin-top: 8px;
}
`
