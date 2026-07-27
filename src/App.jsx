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
  const Rx = W * 0.46          // horizontale Spreizung (seitlich, Fächer)
  const Ry = W * 0.15          // vertikaler Radius (noch flacher -> hintere Karten rücken weiter nach unten, werden von vorderen verdeckt)
  const cardW = W * 0.36
  const cardH = W * 0.50
  const offY = Ry * 0.30       // Ring leicht nach unten -> Nachbarn wirken leicht höher

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

      {/* ---------- FROSTED-GLASS HEADER (oben, eckig, volle Breite, sticky) ---------- */}
      <header className="glass-header">
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

      <main className="stage">
        <div className="hero-head">
          <h1 className="hero-pokemon">Pokemon</h1>
          <div className="hero-news">News</div>
        </div>
        <p className="subtitle">
          Alle News, Games &amp; Events – gleich groß, im Rondell. Ziehen oder scrollen
          zum Drehen, tippe eine Karte für Details.
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
              Rx={Rx} Ry={Ry} offY={offY} cardW={cardW} cardH={cardH} hovered={hovered} setHovered={setHovered} />
          ))}
          <div className="ring-core" />
        </div>

        <div className="flex items-center gap-3">
          <button className="ctl" onClick={() => nudge(-1)} aria-label="Zurück">‹</button>
          <span className="hint">{active + 1} / {n} · {categoryOf(cards[active]?.title || '')}</span>
          <button className="ctl" onClick={() => nudge(1)} aria-label="Weiter">›</button>
        </div>
      </main>
    </>
  )
}

function CardItem({ card, index, step, rot, Rx, Ry, offY, cardW, cardH, hovered, setHovered }) {
  const isHover = hovered === index
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
      className={`ring-card ${isHover ? 'is-hover' : ''}`}
      style={{ width: cardW, height: cardH, transform: tf, opacity: op, zIndex: z, cursor: 'pointer' }}
      onHoverStart={() => setHovered(index)}
      onHoverEnd={() => setHovered((h) => (h === index ? null : h))}
      onClick={() => setHovered((h) => (h === index ? null : index))}
      draggable={false}>
      <img className="img" src={card.img} alt={card.title} loading="lazy" draggable={false} />
      <div className="scrim" />
      <div className="label"><span className="tag">{categoryOf(card.title)}</span><div>{card.title}</div></div>
    </motion.a>
  )
}
