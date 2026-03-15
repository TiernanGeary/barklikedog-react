'use client'

import { useRef, useState, useEffect } from 'react'
import type { RadioTrack } from '@/lib/types'
import RadioUpload from './RadioUpload'
import RadioChat from './RadioChat'
import VideoStream from './VideoStream'

const STREAM_URL = process.env.NEXT_PUBLIC_RADIO_STREAM_URL || ''

interface ChatMessage {
  _id: string
  nickname: string
  message: string
  _createdAt: string
}

interface Props {
  tracks: RadioTrack[]
  uploadsEnabled: boolean
  azuracastBaseUrl: string
  chatMessages: ChatMessage[]
  skipVoteThreshold: number
  skipVoteCount: number
  skipVoteSong: string
}

export default function RadioPlayer({ tracks, uploadsEnabled, azuracastBaseUrl, chatMessages, skipVoteThreshold, skipVoteCount, skipVoteSong }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [nowPlayingTitle, setNowPlayingTitle] = useState('')
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)
  const [skipVoting, setSkipVoting] = useState(false)
  const [hasVotedSkip, setHasVotedSkip] = useState(false)
  const [localSkipCount, setLocalSkipCount] = useState(skipVoteCount)

  // Sync skip vote count from server props
  useEffect(() => {
    setLocalSkipCount(skipVoteCount)
  }, [skipVoteCount])

  // Reset vote state when song changes
  useEffect(() => {
    if (nowPlayingTitle && skipVoteSong !== nowPlayingTitle) {
      setHasVotedSkip(false)
      setLocalSkipCount(0)
    }
  }, [nowPlayingTitle, skipVoteSong])

  async function handleSkipVote() {
    if (skipVoting || hasVotedSkip || !nowPlayingTitle || skipVoteThreshold === 0) return
    setSkipVoting(true)
    setLocalSkipCount((c) => c + 1)
    setHasVotedSkip(true)
    try {
      const res = await fetch('/api/radio/skip-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songTitle: nowPlayingTitle }),
      })
      const data = await res.json()
      if (res.ok) {
        setLocalSkipCount(data.votes)
      } else if (res.status === 409) {
        setHasVotedSkip(true)
      } else {
        // Revert optimistic
        setLocalSkipCount((c) => Math.max(0, c - 1))
        setHasVotedSkip(false)
      }
    } catch {
      setLocalSkipCount((c) => Math.max(0, c - 1))
      setHasVotedSkip(false)
    } finally {
      setSkipVoting(false)
    }
  }

  // Normalize for fuzzy matching: lowercase, strip punctuation/hashes, collapse whitespace
  function normalize(s: string): string {
    return s
      .toLowerCase()
      .replace(/-[a-f0-9]{20,}$/i, '') // strip trailing file hash
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Match a song title from AzuraCast to a track index in the queue
  function matchTrack(songTitle: string): number {
    if (!songTitle) return -1
    const norm = normalize(songTitle)
    // Try exact match first
    let idx = tracks.findIndex((t) => t.title === songTitle)
    if (idx >= 0) return idx
    // Try substring match
    idx = tracks.findIndex((t) => t.title && (t.title.includes(songTitle) || songTitle.includes(t.title)))
    if (idx >= 0) return idx
    // Fuzzy: normalized substring match
    idx = tracks.findIndex((t) => {
      if (!t.title) return false
      const nt = normalize(t.title)
      return nt.includes(norm) || norm.includes(nt)
    })
    if (idx >= 0) return idx
    // Fuzzy: check if significant words overlap
    const normWords = norm.split(' ').filter((w) => w.length > 2)
    idx = tracks.findIndex((t) => {
      if (!t.title) return false
      const nt = normalize(t.title)
      const matchCount = normWords.filter((w) => nt.includes(w)).length
      return matchCount >= Math.max(1, normWords.length * 0.5)
    })
    return idx
  }

  function updateNowPlaying(songTitle: string) {
    setNowPlayingTitle(songTitle)
    const idx = matchTrack(songTitle)
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
  }

  // Fetch initial now-playing from REST API, then subscribe to SSE for updates
  useEffect(() => {
    if (!azuracastBaseUrl) return

    // Initial fetch so we don't wait for the next track change
    fetch(`${azuracastBaseUrl}/api/nowplaying/1`)
      .then((res) => res.json())
      .then((data) => {
        const title = data?.now_playing?.song?.title
        if (title) updateNowPlaying(title)
      })
      .catch(() => {})

    // SSE for live updates on track change
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
          if (songTitle) updateNowPlaying(songTitle)
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

  // Queue display: upcoming tracks first (current at top), then played tracks at bottom
  const upcomingTracks = currentTrackIndex >= 0
    ? tracks.slice(currentTrackIndex)
    : tracks
  const playedTracks = currentTrackIndex > 0
    ? tracks.slice(0, currentTrackIndex)
    : []

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
        <VideoStream style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
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
          {skipVoteThreshold > 0 && nowPlaying && (
            <button
              className={`radio-skip-btn${hasVotedSkip ? ' radio-skip-voted' : ''}`}
              onClick={handleSkipVote}
              disabled={skipVoting || hasVotedSkip}
              title={hasVotedSkip ? 'Already voted' : `Vote to skip (${localSkipCount}/${skipVoteThreshold})`}
            >
              SKIP {localSkipCount}/{skipVoteThreshold}
            </button>
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

        <div className="radio-bottom">
        <div className="radio-left">
        {tracks.length > 0 && (
          <div className="radio-tracklist">
            <div className="radio-tracklist-header">QUEUE</div>
            <ul>
              {upcomingTracks.map((track, i) => {
                const isCurrentTrack = i === 0 && currentTrackIndex >= 0
                const key = track._key || `up-${i}`
                const isExpanded = expandedTrack === key
                return (
                  <li key={key} className={isCurrentTrack ? 'radio-track-wrap radio-track-active' : 'radio-track-wrap'}>
                    <div
                      className="radio-track"
                      onClick={() => track.audioUrl && setExpandedTrack(isExpanded ? null : key)}
                      style={{ cursor: track.audioUrl ? 'pointer' : 'default' }}
                    >
                      {isCurrentTrack && <span className="radio-track-num">▶</span>}
                      <span className="radio-track-title">{track.label || track.title}</span>
                      {track.duration != null && track.duration > 0 && (
                        <span className="radio-track-duration">
                          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {isExpanded && track.audioUrl && (
                      <audio controls src={track.audioUrl} className="radio-track-player" preload="metadata" />
                    )}
                  </li>
                )
              })}
              {playedTracks.map((track, i) => {
                const key = track._key || `played-${i}`
                const isExpanded = expandedTrack === key
                return (
                  <li key={key} className="radio-track-wrap radio-track-played">
                    <div
                      className="radio-track"
                      onClick={() => track.audioUrl && setExpandedTrack(isExpanded ? null : key)}
                      style={{ cursor: track.audioUrl ? 'pointer' : 'default' }}
                    >
                      <span className="radio-track-title">{track.label || track.title}</span>
                      {track.duration != null && track.duration > 0 && (
                        <span className="radio-track-duration">
                          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {isExpanded && track.audioUrl && (
                      <audio controls src={track.audioUrl} className="radio-track-player" preload="metadata" />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {uploadsEnabled && <RadioUpload />}
        </div>

        <RadioChat messages={chatMessages} />
        </div>
      </div>
    </div>
  )
}

const styles = `
.radio-page {
  padding: 20px 30px;
  box-sizing: border-box;
}

.radio-video-wrap {
  max-width: 100%;
  margin-bottom: 12px;
  height: 35vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  pointer-events: none;
  -webkit-user-select: none;
  user-select: none;
}

.radio-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.radio-controls-area {
  color: #333333;
}

.radio-now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
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

.radio-skip-btn {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  border: 1px solid #e0e0e0;
  background: transparent;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: auto;
  flex-shrink: 0;
}

.radio-skip-btn:hover:not(:disabled) {
  border-color: #ff3700;
  color: #ff3700;
}

.radio-skip-btn:disabled {
  cursor: default;
}

.radio-skip-btn.radio-skip-voted {
  opacity: 0.4;
  border-color: #ccc;
}

.radio-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
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

.radio-bottom {
  display: flex;
  gap: 20px;
  align-items: stretch;
  max-height: 340px;
}

.radio-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.radio-tracklist {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  padding: 12px 20px;
  min-height: 0;
}

.radio-tracklist-header {
  font-size: 10px;
  letter-spacing: 0.15em;
  opacity: 0.5;
  margin-bottom: 8px;
}

.radio-tracklist ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.radio-track-wrap {
  opacity: 0.6;
  transition: opacity 0.15s;
}

.radio-track-wrap:hover {
  opacity: 1;
}

.radio-track-wrap.radio-track-active {
  opacity: 1;
  font-weight: bold;
}

.radio-track-wrap.radio-track-played {
  opacity: 0.3 !important;
}

.radio-track-wrap.radio-track-played:hover {
  opacity: 0.5 !important;
}

.radio-track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
}

.radio-track-active .radio-track-num {
  color: #ff3700;
}

.radio-track-player {
  width: 100%;
  height: 28px;
  margin: 4px 0 6px;
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

.radio-chat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .radio-page {
    padding: 15px;
  }

  .radio-video-wrap {
    height: 30vh;
  }

  .radio-bottom {
    flex-direction: column;
    max-height: none;
  }

  .radio-left {
    flex: none;
  }

  .radio-tracklist {
    max-height: 250px;
  }

  .radio-chat {
    flex: none;
    height: 300px;
    width: 100%;
  }
}

.radio-chat-header {
  font-size: 10px;
  letter-spacing: 0.15em;
  padding: 12px 20px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
}

.radio-chat-header > span:first-child {
  opacity: 0.5;
}

.radio-chat-header-form {
  display: flex;
  flex: 1;
  min-width: 0;
}

.radio-chat-header-input {
  flex: 1;
  font-size: 10px;
  padding: 2px 0;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  outline: none;
  font-family: inherit;
  color: #333;
  min-width: 0;
  background: transparent;
}

.radio-chat-header-input:focus {
  border-bottom-color: #333;
}

.radio-chat-input-disabled {
  font-size: 10px;
  opacity: 0.3;
  padding: 6px 0;
}

.radio-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.radio-chat-empty {
  font-size: 11px;
  opacity: 0.3;
  padding: 20px 0;
  text-align: center;
}

.radio-chat-msg {
  font-size: 11px;
  padding: 3px 0;
  line-height: 1.4;
  cursor: pointer;
  border-radius: 2px;
}

.radio-chat-msg:hover {
  background: rgba(0,0,0,0.03);
}

.radio-chat-reply-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 20px;
  font-size: 10px;
  opacity: 0.7;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.radio-chat-reply-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.radio-chat-reply-close {
  cursor: pointer;
  opacity: 0.5;
  flex-shrink: 0;
}

.radio-chat-reply-close:hover {
  opacity: 1;
}

.radio-chat-author {
  font-weight: bold;
  margin-right: 6px;
}

.radio-chat-text {
  word-break: break-word;
}

.radio-chat-form {
  display: flex;
  gap: 0;
  margin-top: auto;
  padding: 0 20px 10px;
}

.radio-chat-name-tag {
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-chat-name-tag:hover {
  opacity: 0.7;
}

.radio-chat-input {
  flex: 1;
  font-size: 11px;
  padding: 6px 0 6px 8px;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  outline: none;
  font-family: inherit;
  color: #333;
  min-width: 0;
}

.radio-chat-input:focus {
  border-bottom-color: #333;
}

.radio-chat-input:disabled {
  opacity: 0.4;
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
