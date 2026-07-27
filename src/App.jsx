import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, animate, useTransform } from 'framer-motion'
import { cards } from './data.js'
import Starfield from './Starfield.jsx'

const DEG = Math.PI / 180

function categoryOf(title) {
  const t = title.toLowerCase()
  if (t.includes('karten') || t.includes('tcg') || t.includes('sammelkarten')) return 'TCG'
  if (t.includes('go')) return 'Pokémon GO'
  if (t.includes('tv') || t.includes('pokétoon')) return 'TV'
  if (t.includes('pokopia') || t.includes('champ') || t.includes('sleep') || t.includes('spiel')) return 'Games'
  return 'News'
}

/** misst eine Element-Größe (px), reagiert auf Resize -> mobile-first */
function useSize(ref) {
  const [size, setSize] = useState({ w: 320, h: 320 })
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export default function App() {
  const n = cards.length
  const wrapRef = useRef(null)
  const { w: W } = useSize(wrapRef)
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(null)
  const [headerHidden, setHeaderHidden] = useState(false)

  // Auto-Hide-Header: runter scrollen/wheel -> einrollen, hoch -> ausrollen
  useEffect(() => {
    let lastY = window.scrollY
    let wheelLock = false
    const hide = () => setHeaderHidden(true)
    const show = () => setHeaderHidden(false)
    // scroll (echter Content-Overflow)
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY && y > 80) hide()
      else if (y < lastY) show()
      lastY = y
    }
    // wheel/touch: funktioniert AUCH bei nicht-scrollbarer One-Pager-Seite
    const onWheel = (e) => {
      if (wheelLock) return
      wheelLock = true
      setTimeout(() => (wheelLock = false), 120)
      if (e.deltaY > 4) hide()
      else if (e.deltaY < -4) show()
    }
    const onTouch = (e) => {
      const y = e.touches[0]?.clientY ?? lastY
      if (y < lastY - 6) hide()
      else if (y > lastY + 6) show()
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])

  const step = 360 / n
  const target = useRef(0)
  const rot = useSpring(0, { stiffness: 90, damping: 18, mass: 0.7 })
  const [drag, setDrag] = useState({ on: false, x0: 0, r0: 0 })

  // aktive Karte = jene am nächsten zur Front (Winkel 0)
  useEffect(() => {
    const unsub = rot.on('change', (v) => {
      let best = 0, bestDiff = 999
      for (let i = 0; i < n; i++) {
        const a = ((i * step + v) % 360 + 540) % 360 - 180
        const d = Math.abs(a)
        if (d < bestDiff) { bestDiff = d; best = i }
      }
      setActive(best)
    })
    return unsub
  }, [n, rot, step])

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ on: true, x0: e.clientX, r0: target.current })
  }
  const onPointerMove = (e) => {
    if (!drag.on) return
    target.current = drag.r0 + (e.clientX - drag.x0) * 0.55
    rot.set(target.current)
  }
  const endDrag = () => {
    if (!drag.on) return
    setDrag((d) => ({ ...d, on: false }))
    const snapped = Math.round(target.current / step) * step
    target.current = snapped
    animate(rot, snapped, { type: 'spring', stiffness: 120, damping: 20 })
  }
  const onWheel = (e) => { target.current += e.deltaY * 0.18; rot.set(target.current) }
  const nudge = (dir) => {
    // dir=+1 (Weiter) -> Ring dreht so, dass die NÄCHSTE Karte nach vorn kommt (minus!)
    target.current = Math.round(target.current / step) * step - dir * step
    animate(rot, target.current, { type: 'spring', stiffness: 120, damping: 20 })
  }

  // Rondell-Geometrie als flacher SEITEN-FÄCHER (Ellipse mit Rx >> Ry):
  // Karten bleiben seitlich gefächert, aber vertikal gestaucht -> platzsparend,
  // kein Kreis/Draufsicht. Hintere Karten durch steile Tiefenkurve hinter Front verdeckt.
  // Ring-Größe: misst .ring-wrap-Breite (mobile-first: auf Handy = native Breite),
  // aber gedeckelt auf 680px -> auf Desktop deutlich größere Karten.
  const Wc = Math.min(W, 680)
  const Rx = Wc * 0.46         // horizontale Spreizung (seitlich, Fächer)
  const Ry = Wc * 0.11         // vertikaler Radius (flach -> hintere Karten rücken nach unten, verdeckt)
  const cardW = Wc * 0.32
  const cardH = Wc * 0.46
  const offY = -Ry * 0.62      // Ring weit nach OBEN -> Front-Karte endet sicher über dem Footer-Hinweis

  return (
    <>
      {/* Bunter Holo-Hintergrund */}
      <div className="hero-img" aria-hidden="true" />
      <div className="hero-dim" aria-hidden="true" />
      <div className="holo-bg" aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <span className="blob b4" /><span className="blob b5" /><span className="blob b6" /><span className="blob b7" />
      </div>
      <div className="holo-sheen" aria-hidden="true" />
      <div className="holo-grain" aria-hidden="true" />
      <Starfield />

      {/* ---------- FROSTED-GLASS HEADER (oben, eckig, volle Breite, sticky, auto-hide) ---------- */}
      <header className={`glass-header${headerHidden ? ' is-hidden' : ''}`}>
        <div className="gh-glow" aria-hidden="true" />
        <a className="gh-brand" href="https://www.pokemon.com/de" target="_blank" rel="noreferrer">
          <span className="gh-dot" />Pokémon<span className="gh-brand-dim">.de</span>
        </a>
        <nav className="gh-nav" aria-label="Hauptnavigation">
          <a href="https://www.pokemon.com/de/pokedex/" target="_blank" rel="noreferrer">Pokédex</a>
          <a href="https://www.pokemon.com/de/news" target="_blank" rel="noreferrer">News</a>
          <a href="https://www.pokemon.com/de/video" target="_blank" rel="noreferrer">TV</a>
          <a href="https://www.pokemon.com/de/pokemon-tcg" target="_blank" rel="noreferrer">Sammelkarten</a>
          <a href="https://www.pokemon.com/de/pokemon-go" target="_blank" rel="noreferrer">Pokémon GO</a>
          <a href="https://www.pokemon.com/de/spiele" target="_blank" rel="noreferrer">Spiele</a>
        </nav>
      </header>
      {/* schmale Klick-Leiste: bleibt stehen wenn Header eingefahren, rollt ihn aus */}
      <button
        className={`header-edge${headerHidden ? ' is-visible' : ''}`}
        aria-label="Header einblenden"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHeaderHidden(false) }}
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setHeaderHidden(false) }}
        tabIndex={headerHidden ? 0 : -1}
      >
        <span className="header-edge-nub" aria-hidden="true" />
      </button>

      <main className="stage">
        <div className="stage-inner">
          <div className="hero-head">
            <h1 className="hero-pokemon">PoKeMoN</h1>
            <div className="hero-news">News</div>
          </div>
          <p className="subtitle">
            Alle News, Games &amp; Events
          </p>

          <div
            ref={wrapRef}
            className="ring-wrap"
            style={{ height: cardH * 0.7 + Ry * 2 + offY }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            onWheel={onWheel}
          >
            {cards.map((c, i) => (
              <CardItem key={c.href} card={c} index={i} step={step} rot={rot}
                Rx={Rx} Ry={Ry} offY={offY} cardW={cardW} cardH={cardH} hovered={hovered} setHovered={setHovered}
                active={active} setActive={setActive} />
            ))}
            <div className="ring-core" />
        </div>

        <div className="ring-footer">
          <p className="ring-hint">Ziehen oder scrollen zum Drehen · tippe eine Karte für Details</p>

          <div className="flex items-center gap-3">
            <button className="ctl" onClick={() => nudge(-1)} aria-label="Zurück">‹</button>
            <span className="hint">{active + 1} / {n} · {categoryOf(cards[active]?.title || '')}</span>
            <button className="ctl" onClick={() => nudge(1)} aria-label="Weiter">›</button>
          </div>
        </div>
        </div>{/* /.stage-inner */}

        {/* TODO: temporärer Spacer zum Testen des Header-Auto-Hide — später durch echte untere Elemente ersetzen */}
        <div className="scroll-spacer" aria-hidden="true" />
      </main>
    </>
  )
}

function CardItem({ card, index, step, rot, Rx, Ry, offY, cardW, cardH, hovered, setHovered, active, setActive }) {
  const isHover = hovered === index
  const isFront = active === index
  const tf = useTransform(rot, (r) => {
    const a = index * step + r
    const front = Math.cos(a * DEG)
    const depth = (front + 1) / 2
    // Scale weniger steil -> hintere Karten groesser/sichtbarer (naeher vorn),
    // Opacity bleibt steil -> bleiben gedimmt, nicht zu dominant. Hoehe (Ry) unveraendert.
    const s = (0.45 + 0.55 * Math.pow(depth, 1.7)) * (isHover ? 1.14 : 1)
    // ELLIPSE: x seitlich (Rx), y vertikal (Ry) -> Ring gestaucht,
    // hintere Karten rutschen weiter runter. a=0 -> unten-mittig (Front).
    const x = Rx * Math.sin(a * DEG)
    const y = Ry * Math.cos(a * DEG)
    return `translate(-50%,-50%) translate(${x}px, ${y + offY}px) scale(${s})`
  })
  const op = useTransform(rot, (r) => {
    const a = index * step + r
    const front = Math.cos(a * DEG)
    const depth = (front + 1) / 2
    return 0.06 + 0.94 * Math.pow(depth, 2.6)
  })
  const z = useTransform(rot, (r) => {
    const a = index * step + r
    return Math.round(100 + Math.cos(a * DEG) * 60)
  })
  return (
    <motion.a href={card.href} target="_blank" rel="noreferrer"
      className={`ring-card ${isHover ? 'is-hover' : ''}${isFront ? ' is-front' : ''}`}
      style={{ width: cardW, height: cardH, transform: tf, opacity: op, zIndex: z, cursor: 'pointer' }}
      onHoverStart={() => setHovered(index)}
      onHoverEnd={() => setHovered((h) => (h === index ? null : h))}
      onClick={(e) => { e.preventDefault(); setHovered(index); setActive(index) }}
      draggable={false}>
      <img className="img" src={card.img} alt={card.title} loading="lazy" draggable={false}
        style={{ objectPosition: card.objectPosition || 'center' }} />
      <div className="scrim" />
      <div className="label"><span className="tag">{categoryOf(card.title)}</span><div>{card.title}</div></div>
    </motion.a>
  )
}
