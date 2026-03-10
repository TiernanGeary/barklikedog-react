'use client'

import { useState, useEffect } from 'react'

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://wp.example.com'

export default function GatePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [hash, setHash] = useState('')
  const [shake, setShake] = useState(false)

  // Fetch the password hash from WordPress
  useEffect(() => {
    fetch(`${WP_URL}/wp-json/nv/v1/gate`)
      .then(r => r.json())
      .then(data => setHash(data.password_hash))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)

    // Hash the entered password the same way WordPress does: md5(password + 'nv_salt')
    const inputHash = await md5(password + 'nv_salt')

    if (inputHash === hash) {
      // Set cookie and reload to pass middleware check
      document.cookie = `nv_site_access=${inputHash}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
      window.location.href = '/'
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="gate-page">
      <style>{styles}</style>

      {/* Video background */}
      <div className="gate-video-wrap">
        <video autoPlay loop muted playsInline>
          <source src="/gate-video.mp4" type="video/mp4" />
        </video>
        <div className="gate-video-fallback" />
      </div>

      {/* Noise overlay */}
      <div className="gate-noise" />

      {/* Content */}
      <div className="gate-content">
        <div className="gate-logo">
          <img src="/houndstooth.png" alt="Niche Vault" />
        </div>

        <form className="gate-form" onSubmit={handleSubmit}>
          <span className="gate-label">Enter password to continue</span>
          <div className={`gate-input-row ${shake ? 'shake' : ''} ${error ? 'has-error' : ''}`}>
            <input
              className="gate-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
              autoFocus
            />
            <button className="gate-submit" type="submit">Enter</button>
          </div>
          <span className={`gate-error ${error ? 'visible' : ''}`}>
            {error ? 'Wrong password' : '\u00A0'}
          </span>
        </form>
      </div>

      <div className="gate-footer">
        <span>Niche Vault</span>
      </div>
    </div>
  )
}

// Simple MD5 implementation for client-side hashing
async function md5(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer).catch(() => null)

  // crypto.subtle.digest doesn't support MD5 in all browsers, use fallback
  if (hashBuffer) {
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Fallback: pure JS MD5
  return md5Fallback(str)
}

function md5Fallback(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3]
    a = ff(a,b,c,d,k[0],7,-680876936);d = ff(d,a,b,c,k[1],12,-389564586);c = ff(c,d,a,b,k[2],17,606105819);b = ff(b,c,d,a,k[3],22,-1044525330)
    a = ff(a,b,c,d,k[4],7,-176418897);d = ff(d,a,b,c,k[5],12,1200080426);c = ff(c,d,a,b,k[6],17,-1473231341);b = ff(b,c,d,a,k[7],22,-45705983)
    a = ff(a,b,c,d,k[8],7,1770035416);d = ff(d,a,b,c,k[9],12,-1958414417);c = ff(c,d,a,b,k[10],17,-42063);b = ff(b,c,d,a,k[11],22,-1990404162)
    a = ff(a,b,c,d,k[12],7,1804603682);d = ff(d,a,b,c,k[13],12,-40341101);c = ff(c,d,a,b,k[14],17,-1502002290);b = ff(b,c,d,a,k[15],22,1236535329)
    a = gg(a,b,c,d,k[1],5,-165796510);d = gg(d,a,b,c,k[6],9,-1069501632);c = gg(c,d,a,b,k[11],14,643717713);b = gg(b,c,d,a,k[0],20,-373897302)
    a = gg(a,b,c,d,k[5],5,-701558691);d = gg(d,a,b,c,k[10],9,38016083);c = gg(c,d,a,b,k[15],14,-660478335);b = gg(b,c,d,a,k[4],20,-405537848)
    a = gg(a,b,c,d,k[9],5,568446438);d = gg(d,a,b,c,k[14],9,-1019803690);c = gg(c,d,a,b,k[3],14,-187363961);b = gg(b,c,d,a,k[8],20,1163531501)
    a = gg(a,b,c,d,k[13],5,-1444681467);d = gg(d,a,b,c,k[2],9,-51403784);c = gg(c,d,a,b,k[7],14,1735328473);b = gg(b,c,d,a,k[12],20,-1926607734)
    a = hh(a,b,c,d,k[5],4,-378558);d = hh(d,a,b,c,k[8],11,-2022574463);c = hh(c,d,a,b,k[11],16,1839030562);b = hh(b,c,d,a,k[14],23,-35309556)
    a = hh(a,b,c,d,k[1],4,-1530992060);d = hh(d,a,b,c,k[4],11,1272893353);c = hh(c,d,a,b,k[7],16,-155497632);b = hh(b,c,d,a,k[10],23,-1094730640)
    a = hh(a,b,c,d,k[13],4,681279174);d = hh(d,a,b,c,k[0],11,-358537222);c = hh(c,d,a,b,k[3],16,-722521979);b = hh(b,c,d,a,k[6],23,76029189)
    a = hh(a,b,c,d,k[9],4,-640364487);d = hh(d,a,b,c,k[12],11,-421815835);c = hh(c,d,a,b,k[15],16,530742520);b = hh(b,c,d,a,k[2],23,-995338651)
    a = ii(a,b,c,d,k[0],6,-198630844);d = ii(d,a,b,c,k[7],10,1126891415);c = ii(c,d,a,b,k[14],15,-1416354905);b = ii(b,c,d,a,k[5],21,-57434055)
    a = ii(a,b,c,d,k[12],6,1700485571);d = ii(d,a,b,c,k[3],10,-1894986606);c = ii(c,d,a,b,k[10],15,-1051523);b = ii(b,c,d,a,k[1],21,-2054922799)
    a = ii(a,b,c,d,k[8],6,1873313359);d = ii(d,a,b,c,k[15],10,-30611744);c = ii(c,d,a,b,k[6],15,-1560198380);b = ii(b,c,d,a,k[13],21,1309151649)
    a = ii(a,b,c,d,k[4],6,-145523070);d = ii(d,a,b,c,k[11],10,-1120210379);c = ii(c,d,a,b,k[2],15,718787259);b = ii(b,c,d,a,k[9],21,-343485551)
    x[0] = add32(a, x[0]);x[1] = add32(b, x[1]);x[2] = add32(c, x[2]);x[3] = add32(d, x[3])
  }
  function cmn(q: number,a: number,b: number,x: number,s: number,t: number) {
    a = add32(add32(a,q),add32(x,t))
    return add32((a << s) | (a >>> (32-s)), b)
  }
  function ff(a: number,b: number,c: number,d: number,x: number,s: number,t: number) { return cmn((b&c)|((~b)&d),a,b,x,s,t) }
  function gg(a: number,b: number,c: number,d: number,x: number,s: number,t: number) { return cmn((b&d)|(c&(~d)),a,b,x,s,t) }
  function hh(a: number,b: number,c: number,d: number,x: number,s: number,t: number) { return cmn(b^c^d,a,b,x,s,t) }
  function ii(a: number,b: number,c: number,d: number,x: number,s: number,t: number) { return cmn(c^(b|(~d)),a,b,x,s,t) }
  function md51(s: string) {
    const n = s.length
    let state = [1732584193,-271733879,-1732584194,271733878]
    let i: number
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)))
    }
    s = s.substring(i - 64)
    const tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3)
    tail[i >> 2] |= 0x80 << ((i % 4) << 3)
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0 }
    tail[14] = n * 8
    md5cycle(state, tail)
    return state
  }
  function md5blk(s: string) {
    const md5blks: number[] = []
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24)
    }
    return md5blks
  }
  const hex_chr = '0123456789abcdef'.split('')
  function rhex(n: number) {
    let s = ''
    for (let j = 0; j < 4; j++) s += hex_chr[(n >> (j*8+4)) & 0x0F] + hex_chr[(n >> (j*8)) & 0x0F]
    return s
  }
  function add32(a: number, b: number) { return (a + b) & 0xFFFFFFFF }
  const result = md51(string)
  return rhex(result[0]) + rhex(result[1]) + rhex(result[2]) + rhex(result[3])
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');

.gate-page {
  position: fixed;
  inset: 0;
  z-index: 99999;
  font-family: 'DM Mono', 'Courier New', monospace;
  color: #f5f5f0;
  background: #0a0a0a;
}

.gate-video-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.gate-video-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(0,0,0,0.3) 0%,
    rgba(0,0,0,0.05) 40%,
    rgba(0,0,0,0.05) 60%,
    rgba(0,0,0,0.6) 100%
  );
  z-index: 1;
}

.gate-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gate-video-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
  z-index: -1;
}

.gate-noise {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}

.gate-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
}

.gate-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 3rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

.gate-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.gate-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
}

.gate-label {
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(245, 245, 240, 0.5);
}

.gate-input-row {
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(245, 245, 240, 0.15);
  border-radius: 2px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.gate-input-row:focus-within {
  border-color: rgba(245, 245, 240, 0.5);
}

.gate-input-row.has-error {
  border-color: #e84040;
}

.gate-input {
  width: 240px;
  padding: 0.75rem 1rem;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: #f5f5f0;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  outline: none;
}

.gate-input::placeholder {
  color: rgba(245, 245, 240, 0.2);
}

.gate-submit {
  padding: 0.75rem 1.25rem;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: #f5f5f0;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.gate-submit:hover {
  background: #fff;
}

.gate-error {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: #e84040;
  min-height: 1.2em;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gate-error.visible {
  opacity: 1;
}

@keyframes gate-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.gate-input-row.shake {
  animation: gate-shake 0.4s ease;
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
  color: rgba(245, 245, 240, 0.25);
}

@media (max-width: 480px) {
  .gate-input { width: 180px; padding: 0.65rem 0.75rem; font-size: 0.8rem; }
  .gate-submit { padding: 0.65rem 1rem; }
}
`
