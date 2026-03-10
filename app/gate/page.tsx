'use client'

export default function GatePage() {
  return (
    <div className="gate-page">
      <style>{styles}</style>

      {/* Video background */}
      <div className="gate-video-wrap">
        <video autoPlay loop muted playsInline>
          <source src="/gate-video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="gate-footer">
        <span>Bark Like Dog</span>
      </div>
    </div>
  )
}

const styles = `
/* Hide the root layout sidebar and footer */
#sidebar,
#footer {
  display: none !important;
}

.gate-page {
  position: fixed;
  inset: 0;
  z-index: 99999;
  font-family: 'Courier New', Courier, monospace;
  color: #333333;
  background: #ffffff;
  overflow: hidden;
}

.gate-video-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gate-video-wrap video {
  width: 100%;
  height: auto;
  display: block;
}

@keyframes gate-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.gate-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
}

.gate-footer span {
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.3);
}
`
