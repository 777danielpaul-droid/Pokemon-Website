import { useEffect, useRef, useState } from 'react'

// Port von SpiderZ booster-demo.html -> React. Öffnet 1 Mock-Karte (PSA 10).
// SpiderZ-Look: Lila #6d28d9, Cyan #22d3ee, Magenta #ff35d0, Lime #b6ff3b.
export default function BoosterModal({ onClose }) {
  const stageRef = useRef(null)
  const [phase, setPhase] = useState('closed') // closed -> opening -> revealed

  const open = () => {
    if (phase !== 'closed') return
    if (navigator.vibrate) navigator.vibrate(30)
    setPhase('opening')
    // Konfetti-Flakes
    const stage = stageRef.current
    const cols = ['#22d3ee', '#ff35d0', '#b6ff3b', '#6d28d9']
    for (let i = 0; i < 14; i++) {
      const f = document.createElement('div')
      f.className = 'flake'
      f.style.background = cols[i % cols.length]
      stage.appendChild(f)
      const ang = Math.random() * Math.PI * 2
      const dist = 80 + Math.random() * 120
      const dx = Math.cos(ang) * dist
      const dy = Math.sin(ang) * dist - 40
      f.animate(
        [
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540 - 270}deg)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' }
      )
      setTimeout(() => f.remove(), 1100)
    }
    setTimeout(() => setPhase('revealed'), 520)
  }

  // Auto-open beim Mount
  useEffect(() => { open() }, []) // eslint-disable-line

  // ESC schließt
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="booster-overlay" onClick={onClose}>
      <div
        className={`booster-stage ${phase === 'opening' ? 'opening' : ''} ${phase === 'revealed' ? 'revealed' : ''}`}
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Booster */}
        <div className="pack" aria-hidden="true">
          <div className="pack-body">
            <div className="pack-perf" />
            <div className="pack-top" />
            <div className="pack-foil" />
            <div className="pack-logo">
              <div className="big">POKEMON</div>
              <div className="sub">BOOSTER</div>
            </div>
          </div>
        </div>

        {/* Burst */}
        <div className="burst">
          <svg viewBox="0 0 200 200">
            <g fill="none" stroke="url(#g)" strokeWidth="3">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#ff35d0" />
                </linearGradient>
              </defs>
              <path d="M100 10 L100 60 M100 140 L100 190 M10 100 L60 100 M140 100 L190 100 M37 37 L73 73 M127 127 L163 163 M163 37 L127 73 M73 127 L37 163" />
            </g>
          </svg>
        </div>

        {/* Karten: 1 Mock (PSA 10) */}
        <div className="cards">
          <div className="card type-psa shimmer">
            <div className="icon">🏆</div>
            <div className="label">PSA 10</div>
            <div className="rarity">SAMMEL-ITEM</div>
          </div>
        </div>

        <div className="booster-hint">TIPPE ZUM SCHLIESSEN</div>
      </div>
      <button className="booster-reset" onClick={onClose}>✕ SCHLIESSEN</button>
    </div>
  )
}
