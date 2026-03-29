'use client'

import { useRef, useState } from 'react'

const VIDEOS = [
  { src: '/djloop.mp4', loops: 10 },
  { src: '/gate-video.mp4', loops: 10 },
]

interface Props {
  className?: string
  style?: React.CSSProperties
}

export default function VideoStream({ className, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const loopCount = useRef(0)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoFade, setVideoFade] = useState(true)

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      disablePictureInPicture
      controlsList={'nodownload nofullscreen noremoteplayback' as any}
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      src={VIDEOS[videoIndex].src}
      onCanPlay={() => setVideoFade(true)}
      onTimeUpdate={() => {
        const v = videoRef.current
        const current = VIDEOS[videoIndex]
        if (!v || !v.duration) return
        const remaining = v.duration - v.currentTime
        if (remaining <= 0.6 && loopCount.current >= (current.loops || 1) - 1 && videoFade) {
          setVideoFade(false)
        }
      }}
      onEnded={() => {
        const current = VIDEOS[videoIndex]
        loopCount.current++
        if (loopCount.current < (current.loops || 1)) {
          const v = videoRef.current
          if (v) { v.currentTime = 0; v.play() }
        } else {
          loopCount.current = 0
          setTimeout(() => {
            setVideoIndex((i) => (i + 1) % VIDEOS.length)
          }, 100)
        }
      }}
      style={{ pointerEvents: 'none', opacity: videoFade ? 1 : 0, transition: 'opacity 0.5s ease', ...style }}
    />
  )
}
