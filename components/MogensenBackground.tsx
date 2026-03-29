'use client'

import { useRef, useEffect } from 'react'

const DEFAULT_PALETTE = [
  // pastels
  '#A8C8F5', '#B2E4C3', '#FAF0A8', '#F7A8D8', '#F5A8A8',
  // brand (softer mid-tones)
  '#518EE4', '#83D29E', '#F6DE69', '#EF43AD', '#ED4D4D',
]

const DEFAULT_BGS = [
  '#ffffff',
  // pastels
  '#A8C8F5', '#B2E4C3', '#FAF0A8', '#F7A8D8', '#F5A8A8',
  // brand
  '#518EE4', '#83D29E', '#F6DE69', '#EF43AD', '#ED4D4D',
]
const PAD = 0.05 // 5% padding on each side

type Mode = 'grid' | 'morse' | 'spiral' | 'bands'
const MODES: Mode[] = ['grid', 'morse', 'spiral', 'bands']

interface Rect { x: number; y: number; w: number; h: number }

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }

// ── MODE A: Copperopolis Grid ───────────────────────────────────────────────
function buildGrid(vw: number, vh: number): Rect[] {
  const sizes = [8, 4, 2, 1]
  const n = sizes.length
  let span = 0
  for (let i = 0; i < n; i++) {
    span += sizes[i]
    if (i < n - 1) span += sizes[i + 1]
  }
  const usable = Math.min(vw * (1 - PAD * 2), vh * (1 - PAD * 2))
  const u = usable / span

  const offsets: number[] = []
  let pos = 0
  for (let i = 0; i < n; i++) {
    offsets.push(pos)
    pos += sizes[i] * u
    if (i < n - 1) pos += sizes[i + 1] * u
  }
  const grid = pos
  const ox = (vw - grid) / 2
  const oy = (vh - grid) / 2

  const panels: Rect[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const s = Math.min(sizes[r], sizes[c]) * u
      const cw = sizes[c] * u
      const ch = sizes[r] * u
      panels.push({
        x: ox + offsets[c] + (cw - s) / 2,
        y: oy + offsets[r] + (ch - s) / 2,
        w: s, h: s,
      })
    }
  }
  panels.sort((a, b) => a.w * a.h - b.w * b.h)
  return panels
}

// ── MODE B: Morse Code ──────────────────────────────────────────────────────
function buildMorse(vw: number, vh: number): Rect[] {
  const steps = [1, 2, 3, 4, 5, 6, 7]
  const horizontal = Math.random() < 0.5

  // Total span: sum of widths + gaps (gap after rect i = width of rect i = steps[i])
  // widths: 1+2+3+4+5+6+7 = 28, gaps between: 1+2+3+4+5+6 = 21, total = 49
  let span = 0
  for (let i = 0; i < steps.length; i++) {
    span += steps[i]
    if (i < steps.length - 1) span += steps[i]
  }

  const primary = horizontal ? vw : vh
  const secondary = horizontal ? vh : vw
  const usable = primary * (1 - PAD * 2)
  const u = usable / span
  const barThick = secondary * 0.18

  const rects: Rect[] = []
  let pos = primary * PAD
  for (let i = 0; i < steps.length; i++) {
    const size = steps[i] * u
    const center = secondary / 2 - barThick / 2
    if (horizontal) {
      rects.push({ x: pos, y: center, w: size, h: barThick })
    } else {
      rects.push({ x: center, y: pos, w: barThick, h: size })
    }
    pos += size
    if (i < steps.length - 1) pos += steps[i] * u
  }
  rects.sort((a, b) => a.w * a.h - b.w * b.h)
  return rects
}

// ── MODE C: Squared Spiral ──────────────────────────────────────────────────
function buildSpiral(vw: number, vh: number): Rect[] {
  // Determine how many steps we can fit, then scale
  // Place squares spiraling inward: bottom-right → left along bottom → up left → right along top → down right → ...
  // Directions: left, up, right, down (starting from bottom-right corner)
  const dirs = [
    { dx: -1, dy: 0 },  // left
    { dx: 0, dy: -1 },  // up
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: 1 },   // down
  ]

  // First pass: place in abstract units to find bounding box
  const maxSteps = 14
  const placements: { x: number; y: number; size: number }[] = []
  let cx = 0, cy = 0, dirIdx = 0

  for (let i = 1; i <= maxSteps; i++) {
    const size = i
    placements.push({ x: cx, y: cy, size })

    // Move to next position: advance by (current size + current size as gap) in current direction
    // Then the next square's anchor needs adjustment based on direction
    if (i < maxSteps) {
      const gap = size
      const nextSize = i + 1
      const d = dirs[dirIdx % 4]

      if (d.dx === -1) { // moving left
        cx = cx - gap - nextSize
      } else if (d.dx === 1) { // moving right
        cx = cx + size + gap
      }
      if (d.dy === -1) { // moving up
        cy = cy - gap - nextSize
      } else if (d.dy === 1) { // moving down
        cy = cy + size + gap
      }

      dirIdx++
    }
  }

  // Find bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of placements) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x + p.size)
    maxY = Math.max(maxY, p.y + p.size)
  }
  const bw = maxX - minX
  const bh = maxY - minY

  const usableW = vw * (1 - PAD * 2)
  const usableH = vh * (1 - PAD * 2)
  const u = Math.min(usableW / bw, usableH / bh)

  const ox = (vw - bw * u) / 2
  const oy = (vh - bh * u) / 2

  const rects: Rect[] = placements.map(p => ({
    x: ox + (p.x - minX) * u,
    y: oy + (p.y - minY) * u,
    w: p.size * u,
    h: p.size * u,
  }))

  // Already in order 1→14 (smallest first)
  return rects
}

// ── MODE D: Horizontal Bands ────────────────────────────────────────────────
function buildBands(vw: number, vh: number): Rect[] {
  const heights = [1, 2, 4, 8] // bottom to top
  // Total: 1 + 1(gap) + 2 + 2(gap) + 4 + 4(gap) + 8 = 22
  let span = 0
  for (let i = 0; i < heights.length; i++) {
    span += heights[i]
    if (i < heights.length - 1) span += heights[i]
  }
  const usable = vh * (1 - PAD * 2)
  const u = usable / span
  const bandW = vw * (1 - PAD * 2)
  const ox = vw * PAD

  const rects: Rect[] = []
  // Stack from bottom: largest at top means we place 1u at bottom, 8u at top
  let y = vh * PAD + usable // start at the bottom of usable area
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i] * u
    y -= h
    rects.push({ x: ox, y, w: bandW, h })
    if (i < heights.length - 1) {
      y -= heights[i] * u // gap = current band height
    }
  }

  // Sort smallest area first
  rects.sort((a, b) => a.w * a.h - b.w * b.h)
  return rects
}

// ── Builder dispatch ────────────────────────────────────────────────────────
function buildPanels(mode: Mode, vw: number, vh: number): Rect[] {
  switch (mode) {
    case 'grid': return buildGrid(vw, vh)
    case 'morse': return buildMorse(vw, vh)
    case 'spiral': return buildSpiral(vw, vh)
    case 'bands': return buildBands(vw, vh)
  }
}

// ── Component ───────────────────────────────────────────────────────────────
interface Props {
  palette?: string[]
  backgrounds?: string[]
  mode?: Mode
}

export default function MogensenBackground({ palette = DEFAULT_PALETTE, backgrounds = DEFAULT_BGS, mode: forcedMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const modeRef = useRef<Mode>(forcedMode || pick(MODES))
  const pairRef = useRef<{ fg: string; bg: string } | null>(null)
  if (!pairRef.current) {
    const fg = pick(palette)
    let bg = pick(backgrounds)
    while (bg === fg && backgrounds.length > 1) bg = pick(backgrounds)
    pairRef.current = { fg, bg }
  }
  const colorRef = useRef(pairRef.current.fg)
  const bgRef = useRef(pairRef.current.bg)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let stopped = false
    const mode = modeRef.current
    const color = colorRef.current
    const bg = bgRef.current

    // Grain: regenerate noise each frame for a living, animated grain effect
    const grainSize = 128
    const grainCanvas = document.createElement('canvas')
    grainCanvas.width = grainSize
    grainCanvas.height = grainSize
    const grainCtx = grainCanvas.getContext('2d')!
    const grainData = grainCtx.createImageData(grainSize, grainSize)

    function applyGrain(w: number, h: number) {
      for (let i = 0; i < grainData.data.length; i += 4) {
        const v = Math.random() * 255
        grainData.data[i] = v
        grainData.data[i + 1] = v
        grainData.data[i + 2] = v
        grainData.data[i + 3] = 20
      }
      grainCtx.putImageData(grainData, 0, 0)
      const pattern = ctx!.createPattern(grainCanvas, 'repeat')
      if (pattern) {
        ctx!.fillStyle = pattern
        ctx!.fillRect(0, 0, w, h)
      }
    }

    function setup() {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas!.width = w
      canvas!.height = h
      return { w, h }
    }

    function drawAll(panels: Rect[], w: number, h: number) {
      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, w, h)
      ctx!.globalAlpha = 1
      ctx!.fillStyle = color
      for (const p of panels) {
        ctx!.fillRect(p.x, p.y, p.w, p.h)
      }
      applyGrain(w, h)
    }

    function animate(panels: Rect[], w: number, h: number) {
      const STAGGER = 120
      const FADE = 180
      const t0 = performance.now()

      function frame(now: number) {
        if (stopped) return
        ctx!.clearRect(0, 0, w, h)
        ctx!.fillStyle = bg
        ctx!.fillRect(0, 0, w, h)

        const elapsed = now - t0
        let done = true

        for (let i = 0; i < panels.length; i++) {
          const t = Math.min(1, Math.max(0, (elapsed - i * STAGGER) / FADE))
          if (t <= 0) { done = false; continue }
          if (t < 1) done = false
          ctx!.globalAlpha = 1 - (1 - t) * (1 - t) // ease-out
          ctx!.fillStyle = color
          ctx!.fillRect(panels[i].x, panels[i].y, panels[i].w, panels[i].h)
        }
        ctx!.globalAlpha = 1
        applyGrain(w, h)

        // Keep looping for animated grain even after panels are done
        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    // Initial draw + animate
    const { w, h } = setup()
    const panels = buildPanels(mode, w, h)
    animate(panels, w, h)

    // Resize: debounce 300ms, redraw final state
    let resizeTimer = 0
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (stopped) return
        cancelAnimationFrame(rafRef.current)
        const { w: nw, h: nh } = setup()
        const np = buildPanels(mode, nw, nh)
        // Restart a grain-only loop with the new panels
        function grainLoop() {
          if (stopped) return
          drawAll(np, nw, nh)
          rafRef.current = requestAnimationFrame(grainLoop)
        }
        rafRef.current = requestAnimationFrame(grainLoop)
      }, 300)
    }
    window.addEventListener('resize', onResize)

    return () => {
      stopped = true
      cancelAnimationFrame(rafRef.current)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [palette, backgrounds, forcedMode])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
