import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAMES = 141        // Anzahl Frames im Sheet
const COLS = 12           // Spalten im Sprite-Sheet (12x12 Grid)
const FW = 1376           // Frame-Breite im Sheet (Original)
const FH = 768            // Frame-Höhe im Sheet (Original)
const SHEET = '/anim/sheet.jpg'

/**
 * Scroll-gesteuerte frame-to-frame Animation als HINTERGRUND einer Content-Sektion.
 *  - Desktop: Sektion ist ~300vh hoch, Canvas sticky (top:0, 100vh) -> bleibt während
 *    des Durchscrollens sichtbar; Scroll-Fortschritt treibt frameIndex (scrub).
 *  - Mobile: kein Pin/scrub (ruckelt auf Touch) -> Canvas läuft als autoplay-loop,
 *    Content-Layer scrollt normal drüber.
 * Karten-Szene oben bleibt unberührt: man scrollt an ihr vorbei, dann kommt diese Szene.
 */
export default function ScrollScene() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = SHEET
    imgRef.current = img

    const drawFrame = (idx) => {
      if (!loadedRef.current) return
      const i = Math.max(0, Math.min(FRAMES - 1, idx | 0))
      const col = i % COLS
      const row = (i / COLS) | 0
      const sx = col * FW
      const sy = row * FH
      // Canvas auf Gerätegröße skalieren (cover)
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      const scale = Math.max(cw / FW, ch / FH)
      const dw = FW * scale
      const dh = FH * scale
      const dx = (cw - dw) / 2
      const dy = (ch - dh) / 2
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(img, sx, sy, FW, FH, dx, dy, dw, dh)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawFrame(lastIdx.current)
    }

    const lastIdx = { current: 0 }
    img.onload = () => { loadedRef.current = true; resize() }

    let raf = null
    let loopStart = 0
    const MOBILE_FPS = 24
    const loop = (t) => {
      if (!loopStart) loopStart = t
      const f = ((t - loopStart) / 1000 * MOBILE_FPS) | 0
      drawFrame(f % FRAMES)
      raf = requestAnimationFrame(loop)
    }

    let st = null
    if (!isMobile) {
      // Desktop: scroll-scrub über Sektionshöhe
      st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          lastIdx.current = self.progress * (FRAMES - 1)
          drawFrame(lastIdx.current)
        }
      })
      // Initial zeichnen, sobald geladen
      const init = setInterval(() => {
        if (loadedRef.current) { drawFrame(0); clearInterval(init) }
      }, 60)
      window.addEventListener('resize', resize)
    } else {
      // Mobile: loop
      raf = requestAnimationFrame(loop)
    }

    return () => {
      if (st) st.kill()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section id="story" ref={sectionRef} className="story-section">
      <div className="story-bg" aria-hidden="true">
        <canvas ref={canvasRef} className="story-canvas" />
        <div className="story-bg-dim" />
      </div>

      {/* Content-Layer: später mit echten Elementen füllen (Platzhalter) */}
      <div className="story-content">
        <div className="story-block">
          <div className="story-card-placeholder">
            <span className="story-kicker">Neu</span>
            <h2 className="story-title">Szene 01 — hier kommt später Content hin</h2>
            <p className="story-text">Frame-to-frame Hintergrund läuft passend zum Scroll-Fortschritt. Dieser Block ist ein Platzhalter für echte Inhalte.</p>
          </div>
        </div>
        <div className="story-block">
          <div className="story-card-placeholder">
            <span className="story-kicker">Story</span>
            <h2 className="story-title">Szene 02 — weiterer Content-Block</h2>
            <p className="story-text">Blöcke stapeln sich untereinander, der Canvas bleibt als gepinnter Hintergrund sichtbar.</p>
          </div>
        </div>
        <div className="story-block">
          <div className="story-card-placeholder">
            <span className="story-kicker">Mehr</span>
            <h2 className="story-title">Szene 03 — noch ein Block</h2>
            <p className="story-text">Später nach Belieben erweiterbar — einfach weitere <code>.story-block</code> hinzufügen.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
