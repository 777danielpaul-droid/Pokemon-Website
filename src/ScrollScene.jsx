import { useEffect, useRef } from 'react'

const FRAMES = 141        // Anzahl Frames im Sheet
const COLS = 12           // Spalten im Sprite-Sheet (12x12 Grid)
const FW = 1376           // Frame-Breite im Sheet (Original)
const FH = 768            // Frame-Höhe im Sheet (Original)
const SHEET = '/anim/sheet.jpg'
const HOLD = 1 / 6        // Frame 0 hält für ~1 Screen (100vh von 600vh)

/**
 * Scroll-gesteuerte frame-to-frame Animation als eigene Section UNTER dem Hero.
 *  - Canvas ist position:fixed, vollflächig, z-index:1 (über den Hero-BG-Layern z:0,
 *    unter dem Header z:50). IntersectionObserver schaltet ihn NUR an, solange die
 *    #story-Sektion im Viewport ist -> Hero bleibt sauber, Animation überdeckt nichts.
 *  - Desktop: Sektion ist ~600vh hoch. Frame 0 sichtbar sobald man am Hero vorbei ist
 *    (erster Screen). Weiterscrollen -> Sequenz durch alle Frames (scroll-Listener).
 *  - Mobile: kein scrub (ruckelt auf Touch) -> Canvas läuft als autoplay-loop.
 */
export default function ScrollScene() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const loadedRef = useRef(false)
  const lastIdx = useRef(0)
  const rafPending = useRef(false)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = SHEET

    // CONTAIN: ganzer Frame sichtbar, letterbox statt Zoom (kein Abschneiden)
    const drawFrame = (idx) => {
      if (!loadedRef.current) return
      const i = Math.max(0, Math.min(FRAMES - 1, idx | 0))
      const col = i % COLS
      const row = (i / COLS) | 0
      const sx = col * FW
      const sy = row * FH
      // COVER: Frame füllt den ganzen Viewport (keine schwarzen Ränder),
      // leichter Zoom -> Rand minimal abgeschnitten (Himmel/Kies), Charaktere bleiben zentriert.
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      const scale = Math.max(cw / FW, ch / FH) * 1.02
      const dw = FW * scale
      const dh = FH * scale
      const dx = (cw - dw) / 2
      const dy = (ch - dh) / 2
      ctx.clearRect(0, 0, cw, ch)
      ctx.fillStyle = '#07070d'
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(img, sx, sy, FW, FH, dx, dy, dw, dh)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawFrame(lastIdx.current)
    }

    img.onload = () => { loadedRef.current = true; resize() }

    // Canvas sichtbar schalten: erst wenn Hero komplett weg ist (section.top <= 0),
    // sonst deckt die Animation den Hero nicht ab. Deterministisch via scroll-Listener.
    const updateActive = () => {
      const sec = sectionRef.current
      if (!sec) return
      const visible = sec.getBoundingClientRect().top <= 1
      canvas.classList.toggle('is-active', visible)
    }

    // Eigener scroll-Listener: progress aus Section-Rect
    const onScroll = () => {
      if (rafPending.current) return
      rafPending.current = true
      requestAnimationFrame(() => {
        rafPending.current = false
        updateActive()
        const sec = sectionRef.current
        if (!sec) return
        const rect = sec.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        const p = Math.max(0, Math.min(1, -rect.top / total))
        const fp = p <= HOLD ? 0 : (p - HOLD) / (1 - HOLD)
        lastIdx.current = fp * (FRAMES - 1)
        drawFrame(lastIdx.current)
      })
    }

    // IntersectionObserver nicht nötig -> raus
    window.addEventListener('scroll', onScroll, { passive: true })

    let raf = null
    let loopStart = 0
    const MOBILE_FPS = 24
    const loop = (t) => {
      if (!loopStart) loopStart = t
      const f = ((t - loopStart) / 1000 * MOBILE_FPS) | 0
      drawFrame(f % FRAMES)
      raf = requestAnimationFrame(loop)
    }

    if (!isMobile) {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', resize)
      const init = setInterval(() => {
        if (loadedRef.current) { drawFrame(0); updateActive(); onScroll(); clearInterval(init) }
      }, 60)
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="story" ref={sectionRef} className="story-section" aria-label="Animation">
      <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
      <div className="story-dim" aria-hidden="true" />
    </section>
  )
}
