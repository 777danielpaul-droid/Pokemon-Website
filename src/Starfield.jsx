import { useMemo } from 'react'

// Irregulärer Sternenhimmel: zufällige Position/Größe/Farbe/Twinkle-Takt.
// Nur transform+opacity animiert -> GPU, kein Layout-Shift.
const COLORS = ['#ffffff', '#eafcff', '#7FD4E8', '#c4b5fd', '#f0abfc']
const rand = (a, b) => a + Math.random() * (b - a)

export default function Starfield({ count = 80 }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, () => {
      const size = rand(1, 3.6)
      return {
        left: rand(0, 100),
        top: rand(0, 100),
        size,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        dur: rand(1.1, 3.4),          // Twinkle-Tempo (unregelmäßig)
        delay: rand(0, 4),            // versetzter Start
        glow: rand(4, 12),           // Glühradius
        peak: rand(0.75, 1),         // maximale Helligkeit
      }
    })
  }, [count])

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.color,
            boxShadow: `0 0 ${s.glow}px ${s.color}`,
            ['--dur']: `${s.dur}s`,
            ['--delay']: `${s.delay}s`,
            ['--peak']: s.peak,
          }}
        />
      ))}
    </div>
  )
}
