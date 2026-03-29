'use client'

import { useRef, useEffect, useState } from 'react'

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

type Mode = 'grid' | 'morse' | 'spiral' | 'bands' | 'scatter' | 'edge' | 'golden' | 'spectrum'
const MODES: Mode[] = ['grid', 'morse', 'spiral', 'bands', 'scatter', 'edge', 'golden', 'spectrum']

interface Rect { x: number; y: number; w: number; h: number; circle?: boolean; color?: string }

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

// ── MODE E: Scatter / Data Points ───────────────────────────────────────────
function buildScatter(vw: number, vh: number): Rect[] {
  const gridN = 8
  const steps = [1, 2, 3, 4, 5, 6, 7, 8]
  const cellW = (vw * (1 - PAD * 2)) / gridN
  const cellH = (vh * (1 - PAD * 2)) / gridN
  const maxRadius = Math.min(cellW, cellH) * 0.45
  const u = maxRadius / steps[steps.length - 1]
  const ox = vw * PAD
  const oy = vh * PAD

  const rects: Rect[] = []
  let idx = 0
  for (let row = 0; row < gridN; row++) {
    for (let rawCol = 0; rawCol < gridN; rawCol++) {
      const col = row % 2 === 0 ? rawCol : gridN - 1 - rawCol // snake path
      const step = steps[Math.min(idx, steps.length - 1)]
      const r = step * u
      const cx = ox + col * cellW + cellW / 2
      const cy = oy + row * cellH + cellH / 2
      rects.push({ x: cx - r, y: cy - r, w: r * 2, h: r * 2, circle: true })
      idx = (idx + 1) % steps.length
    }
  }
  rects.sort((a, b) => a.w * a.h - b.w * b.h)
  return rects
}

// ── MODE F: Edge Progression ────────────────────────────────────────────────
function buildEdge(vw: number, vh: number): Rect[] {
  const edges = ['bottom', 'left', 'top', 'right'] as const
  const edge = pick([...edges])
  const steps = [1, 2, 4, 8, 16]
  const isHoriz = edge === 'bottom' || edge === 'top'

  // Total perpendicular span: sum of steps + gaps (gap after i = steps[i])
  let perpSpan = 0
  for (let i = 0; i < steps.length; i++) {
    perpSpan += steps[i]
    if (i < steps.length - 1) perpSpan += steps[i]
  }
  const availPerp = isHoriz ? vh * (1 - PAD * 2) : vw * (1 - PAD * 2)
  const u = availPerp / perpSpan

  const edgeLen = isHoriz ? vw * (1 - PAD * 2) : vh * (1 - PAD * 2)
  const thickness = (edgeLen * 0.6) / steps.length
  const gapParallel = (edgeLen - thickness * steps.length) / (steps.length - 1)

  const rects: Rect[] = []
  let perpPos = isHoriz ? vh * PAD : vw * PAD
  if (edge === 'bottom') perpPos = vh * (1 - PAD)
  if (edge === 'right') perpPos = vw * (1 - PAD)

  let parallelPos = isHoriz ? vw * PAD : vh * PAD

  for (let i = 0; i < steps.length; i++) {
    const perpSize = steps[i] * u
    let x: number, y: number, w: number, h: number

    if (edge === 'bottom') {
      x = parallelPos; y = perpPos - perpSize; w = thickness; h = perpSize
    } else if (edge === 'top') {
      x = parallelPos; y = perpPos; w = thickness; h = perpSize
    } else if (edge === 'left') {
      x = perpPos; y = parallelPos; w = perpSize; h = thickness
    } else {
      x = perpPos - perpSize; y = parallelPos; w = perpSize; h = thickness
    }

    rects.push({ x, y, w, h })
    parallelPos += thickness + gapParallel
  }

  rects.sort((a, b) => a.w * a.h - b.w * b.h)
  return rects
}

// ── MODE G: Golden Section Rectangles ───────────────────────────────────────
function buildGolden(vw: number, vh: number): Rect[] {
  const PHI = 1.618
  const n = 6
  const widths: number[] = [1]
  for (let i = 1; i < n; i++) widths.push(widths[i - 1] * PHI)

  // Total span: sum of widths + gaps (gap after i = widths[i] * 0.5)
  let totalSpan = 0
  for (let i = 0; i < n; i++) {
    totalSpan += widths[i]
    if (i < n - 1) totalSpan += widths[i] * 0.5
  }

  const usableW = vw * (1 - PAD * 2)
  const u = usableW / totalSpan
  const barH = vh * 0.22
  const cy = (vh - barH) / 2

  const rects: Rect[] = []
  let x = vw * PAD
  for (let i = 0; i < n; i++) {
    const w = widths[i] * u
    rects.push({ x, y: cy, w, h: barH })
    x += w
    if (i < n - 1) x += widths[i] * u * 0.5
  }

  rects.sort((a, b) => a.w * a.h - b.w * b.h)
  return rects
}

// ── MODE H: Spectrum / Morse Code Multi-Color ───────────────────────────────
function buildSpectrum(vw: number, vh: number, palette: string[]): Rect[] {
  const steps = [1, 2, 3, 4, 5]
  const horizontal = Math.random() < 0.5
  const colors = palette.slice(0, 5)

  let span = 0
  for (let i = 0; i < steps.length; i++) {
    span += steps[i]
    if (i < steps.length - 1) span += steps[i]
  }

  const primary = horizontal ? vw : vh
  const secondary = horizontal ? vh : vw
  const usable = primary * (1 - PAD * 2)
  const u = usable / span
  const barThick = secondary * 0.25

  const rects: Rect[] = []
  let pos = primary * PAD
  for (let i = 0; i < steps.length; i++) {
    const size = steps[i] * u
    const center = secondary / 2 - barThick / 2
    const c = colors[i % colors.length]
    if (horizontal) {
      rects.push({ x: pos, y: center, w: size, h: barThick, color: c })
    } else {
      rects.push({ x: center, y: pos, w: barThick, h: size, color: c })
    }
    pos += size
    if (i < steps.length - 1) pos += steps[i] * u
  }
  // Already smallest first
  return rects
}

// ── Builder dispatch ────────────────────────────────────────────────────────
function buildPanels(mode: Mode, vw: number, vh: number, palette?: string[]): Rect[] {
  switch (mode) {
    case 'grid': return buildGrid(vw, vh)
    case 'morse': return buildMorse(vw, vh)
    case 'spiral': return buildSpiral(vw, vh)
    case 'bands': return buildBands(vw, vh)
    case 'scatter': return buildScatter(vw, vh)
    case 'edge': return buildEdge(vw, vh)
    case 'golden': return buildGolden(vw, vh)
    case 'spectrum': return buildSpectrum(vw, vh, palette || DEFAULT_PALETTE)
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
  const [cycle, setCycle] = useState(0)

  // Regenerate every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCycle(c => c + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Pick fresh random values each cycle
    const mode = forcedMode || pick(MODES)
    const color = pick(palette)
    let bg = mode === 'spectrum' ? '#F9F7F4' : pick(backgrounds)
    while (bg === color && backgrounds.length > 1 && mode !== 'spectrum') bg = pick(backgrounds)

    let stopped = false

    // Expose colors as CSS custom properties for other components
    document.documentElement.style.setProperty('--panel-color', color)
    document.documentElement.style.setProperty('--bg-color', bg)

    // Grain: regenerate noise each frame for a living, animated grain effect
    const grainSize = 512
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
        grainData.data[i + 3] = 14
      }
      grainCtx.putImageData(grainData, 0, 0)
      const pattern = ctx!.createPattern(grainCanvas, 'repeat')
      if (pattern) {
        ctx!.fillStyle = pattern
        ctx!.fillRect(0, 0, w, h)
      }
    }

    function setup() {
      const w = window.visualViewport?.width ?? window.innerWidth
      const h = window.visualViewport?.height ?? window.innerHeight
      canvas!.width = w
      canvas!.height = h
      return { w, h }
    }

    function drawPanel(p: Rect) {
      ctx!.fillStyle = p.color || color
      if (p.circle) {
        const r = p.w / 2
        ctx!.beginPath()
        ctx!.arc(p.x + r, p.y + r, r, 0, Math.PI * 2)
        ctx!.fill()
      } else {
        ctx!.fillRect(p.x, p.y, p.w, p.h)
      }
    }

    function drawAll(panels: Rect[], w: number, h: number) {
      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, w, h)
      ctx!.globalAlpha = 1
      for (const p of panels) drawPanel(p)
      applyGrain(w, h)
    }

    function animate(panels: Rect[], w: number, h: number) {
      const STAGGER = 220
      const FADE = 400
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
          drawPanel(panels[i])
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
    const panels = buildPanels(mode, w, h, palette)
    animate(panels, w, h)

    // Resize: debounce 300ms, redraw final state
    let resizeTimer = 0
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (stopped) return
        cancelAnimationFrame(rafRef.current)
        const { w: nw, h: nh } = setup()
        const np = buildPanels(mode, nw, nh, palette)
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
  }, [palette, backgrounds, forcedMode, cycle])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
