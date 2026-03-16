'use client'

import { useRef, useState, useEffect } from 'react'

const VIDEO_STREAM = 'https://stream.barklike.dog:8443/stream/stream.m3u8'
const VIDEO_BASE = 'https://stream.barklike.dog:8443/videos'
const FALLBACK_VIDEOS = [
  { src: `${VIDEO_BASE}/djloop.mp4`, loops: 10 },
  { src: `${VIDEO_BASE}/gate-video.mp4`, loops: 10 },
]

interface Props {
  className?: string
  style?: React.CSSProperties
}

export default function VideoStream({ className, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [useStream, setUseStream] = useState(true)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoFade, setVideoFade] = useState(true)
  const loopCount = useRef(0)

  // HLS stream setup
  useEffect(() => {
    if (!useStream || !videoRef.current) return
    const video = videoRef.current

    // Native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_STREAM
      video.play().catch(() => {})
      return
    }

    // Use hls.js for other browsers
    let hls: any = null
    import('hls.js').then((Hls) => {
      const HlsClass = Hls.default
      if (!HlsClass.isSupported()) {
        setUseStream(false)
        return
      }
      hls = new HlsClass()
      hlsRef.current = hls
      hls.loadSource(VIDEO_STREAM)
      hls.attachMedia(video)
      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
      hls.on(HlsClass.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          setUseStream(false)
        }
      })
    }).catch(() => setUseStream(false))

    return () => {
      if (hls) { hls.destroy(); hlsRef.current = null }
    }
  }, [useStream])

  const videoProps = {
    ref: videoRef,
    autoPlay: true,
    muted: true,
    playsInline: true,
    disablePictureInPicture: true,
    controlsList: 'nodownload nofullscreen noremoteplayback' as const,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }

  if (useStream) {
    return (
      <video
        {...videoProps}
        className={className}
        style={{ pointerEvents: 'none', ...style }}
      />
    )
  }

  return (
    <video
      {...videoProps}
      className={className}
      onCanPlay={() => setVideoFade(true)}
      onTimeUpdate={() => {
        const v = videoRef.current
        const current = FALLBACK_VIDEOS[videoIndex]
        if (!v || !v.duration) return
        const remaining = v.duration - v.currentTime
        if (remaining <= 0.6 && loopCount.current >= (current.loops || 1) - 1 && videoFade) {
          setVideoFade(false)
        }
      }}
      onEnded={() => {
        const current = FALLBACK_VIDEOS[videoIndex]
        loopCount.current++
        if (loopCount.current < (current.loops || 1)) {
          const v = videoRef.current
          if (v) { v.currentTime = 0; v.play() }
        } else {
          loopCount.current = 0
          setTimeout(() => {
            setVideoIndex((i) => (i + 1) % FALLBACK_VIDEOS.length)
          }, 100)
        }
      }}
      src={FALLBACK_VIDEOS[videoIndex].src}
      style={{ pointerEvents: 'none', opacity: videoFade ? 1 : 0, transition: 'opacity 0.5s ease', ...style }}
    />
  )
}
