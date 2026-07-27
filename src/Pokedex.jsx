import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API = 'https://pokeapi.co/api/v2'
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const PAGE = 20

// Typ-Farben (PokeAPI "types" -> CSS-Farbe)
const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#f0b6bc'
}
const typeColor = (t) => TYPE_COLORS[t] || '#888'

// Stat-Farbe je nach Wert
const statColor = (v) => (v >= 100 ? '#4ade80' : v >= 60 ? '#facc15' : '#f87171')

export default function Pokedex() {
  const [list, setList] = useState(null)        // alle Namen {name,url}
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState([])  // gefilterte Liste (für Grid)
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState(null)    // aktuell geöffnetes Pokemon
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [typeFilter, setTypeFilter] = useState(null)
  const [randomBusy, setRandomBusy] = useState(false)
  const cacheRef = useRef(new Map())             // Name -> Detail (gecachet)
  const debounceRef = useRef(null)

  // --- 1. Liste laden (1x) ---
  useEffect(() => {
    let alive = true
    fetch(`${API}/pokemon?limit=1300`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setList(d.results); setFiltered(d.results) } })
      .catch(() => { if (alive) setList([]) })
    return () => { alive = false }
  }, [])

  // --- 2. Suche + Typ-Filter (debounced) ---
  const applyFilter = useCallback((q, tf) => {
    if (!list) return
    const ql = q.trim().toLowerCase()
    let res = list
    if (tf) {
      // Typ-Filter braucht Details -> nur über Cache
      res = res.filter((p) => {
        const c = cacheRef.current.get(p.name)
        return c && c.types.some((t) => t.type.name === tf)
      })
    }
    if (ql) res = res.filter((p) => p.name.includes(ql))
    setFiltered(res)
    setPage(0)
  }, [list])

  const onSearch = (e) => {
    const v = e.target.value
    setQuery(v)
    setNotFound(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => applyFilter(v, typeFilter), 180)
  }

  const toggleType = (t) => {
    const nt = typeFilter === t ? null : t
    setTypeFilter(nt)
    applyFilter(query, nt)
  }

  // --- 3. Detail laden (mit Cache) ---
  const loadDetail = useCallback(async (name) => {
    const key = name.toLowerCase()
    if (cacheRef.current.has(key)) { setDetail(cacheRef.current.get(key)); setNotFound(false); return }
    setLoadingDetail(true); setNotFound(false)
    try {
      const r = await fetch(`${API}/pokemon/${key}`)
      if (!r.ok) { setLoadingDetail(false); setNotFound(true); setDetail(null); return }
      const d = await r.json()
      const obj = {
        id: d.id, name: d.name,
        types: d.types,
        height: d.height / 10, weight: d.weight / 10,
        abilities: d.abilities.map((a) => a.ability.name),
        stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
        sprite: `${SPRITE_BASE}/${d.id}.png`,
        shiny: `${SPRITE_BASE}/shiny/${d.id}.png`
      }
      cacheRef.current.set(key, obj)
      setDetail(obj)
    } catch {
      setNotFound(true); setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  // Enter in Suche -> direkter API-Call (auch exakte Namen)
  const onSearchKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      clearTimeout(debounceRef.current)
      loadDetail(query.trim())
    }
  }

  const randomPokemon = () => {
    if (!list || !list.length || randomBusy) return
    setRandomBusy(true)
    const pick = list[Math.floor(Math.random() * list.length)]
    loadDetail(pick.name).finally(() => setRandomBusy(false))
  }

  // Prev/Next im Detail (über gefilterte Liste, sonst alle)
  const stepDetail = (dir) => {
    if (!detail) return
    const base = filtered.length ? filtered : (list || [])
    const idx = base.findIndex((p) => p.name === detail.name)
    if (idx < 0) return
    const next = base[(idx + dir + base.length) % base.length]
    loadDetail(next.name)
  }

  const pageItems = useMemo(() => filtered.slice(page * PAGE, page * PAGE + PAGE), [filtered, page])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE))

  return (
    <section id="pokedex" className="pokedex-section" aria-label="Pokedex">
      <div className="phone">
        <div className="phone-frame">
          <div className="phone-notch" aria-hidden="true"><span className="phone-cam" /></div>
          <div className="phone-screen">
            <header className="pokedex-head">
              <div>
                <h2 className="pokedex-title">PoKeDeX</h2>
                <p className="pokedex-sub">
                  {list ? `${list.length} Pokémon · Suche, filtern, entdecken` : 'Lade Pokémon…'}
                </p>
              </div>
            </header>

            {/* Suche + Typ-Chips */}
            <div className="pokedex-controls">
              <input
                className="dex-search"
                type="search"
                placeholder="Pokémon suchen… (z.B. ditto)"
                value={query}
                onChange={onSearch}
                onKeyDown={onSearchKey}
                aria-label="Pokémon suchen"
              />
              <div className="dex-types">
                {Object.keys(TYPE_COLORS).map((t) => (
                  <button
                    key={t}
                    className={`dex-type ${typeFilter === t ? 'is-on' : ''}`}
                    style={{ '--tc': typeColor(t) }}
                    onClick={() => toggleType(t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {!list ? (
              <div className="dex-empty">⏳ PokeAPI wird geladen…</div>
            ) : filtered.length === 0 ? (
              <div className="dex-empty">
                Kein Treffer für „{query}“.
                <button className="dex-try" onClick={() => loadDetail(query)}>Trotzdem „{query}“ suchen?</button>
              </div>
            ) : (
              <>
                <motion.div className="dex-grid" initial="hidden" animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.015 } } }}>
                  {pageItems.map((p) => {
                    const id = p.url.split('/').slice(-2, -1)[0]
                    return (
                      <motion.button
                        key={p.name}
                        className="dex-cell"
                        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                        onClick={() => loadDetail(p.name)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <img className="dex-sprite" src={`${SPRITE_BASE}/${id}.png`} alt={p.name}
                          loading="lazy" onError={(e) => { e.target.style.visibility = 'hidden' }} />
                        <div className="dex-id">#{String(id).padStart(3, '0')}</div>
                        <div className="dex-name">{p.name}</div>
                      </motion.button>
                    )
                  })}
                </motion.div>

                {/* Pagination (im Screen) */}
                <div className="dex-pager">
                  <button className="ctl" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹</button>
                  <span className="hint">{page + 1} / {pageCount}</span>
                  <button className="ctl" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>›</button>
                </div>
              </>
            )}
          </div>

          {/* Hardware-Keys unter dem Screen (Touch-Buttons) */}
          <div className="phone-keys">
            <button className="phone-key phone-key-nav" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Seite zurück">‹</button>
            <button className="phone-key phone-key-rand" onClick={randomPokemon} disabled={randomBusy} aria-label="Zufall">🎲</button>
            <button className="phone-key phone-key-home" onClick={() => setDetail(null)} aria-label="Zurück/Schließen">⌂</button>
            <button className="phone-key phone-key-nav" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount - 1} aria-label="Seite vor">›</button>
          </div>
        </div>
      </div>

      {/* --- Detail-Modal (im Screen-Look) --- */}
      <AnimatePresence>
        {detail && (
          <motion.div className="deck-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}>
            <motion.div className="deck-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <button className="deck-x" onClick={() => setDetail(null)} aria-label="Schließen">✕</button>
              <div className="deck-nav">
                <button className="ctl" onClick={() => stepDetail(-1)} aria-label="Vorheriges">‹</button>
                <button className="ctl" onClick={() => stepDetail(1)} aria-label="Nächstes">›</button>
              </div>

              <ShinySprite detail={detail} />

              <div className="deck-name">
                <span className="deck-id">#{String(detail.id).padStart(3, '0')}</span>
                {detail.name}
              </div>
              <div className="deck-types">
                {detail.types.map((t) => (
                  <span key={t.type.name} className="deck-type" style={{ background: typeColor(t.type.name) }}>
                    {t.type.name}
                  </span>
                ))}
              </div>

              <div className="deck-stats">
                {detail.stats.map((s) => (
                  <div key={s.name} className="deck-stat">
                    <span className="ds-label">{s.name}</span>
                    <span className="ds-val">{s.value}</span>
                    <div className="ds-bar"><div className="ds-fill" style={{ width: `${Math.min(100, s.value)}%`, background: statColor(s.value) }} /></div>
                  </div>
                ))}
              </div>

              <div className="deck-meta">
                <div>📏 {detail.height} m</div>
                <div>⚖️ {detail.weight} kg</div>
                <div>✨ {detail.abilities.join(', ')}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingDetail && <div className="deck-loading">Lade…</div>}
      {notFound && <div className="deck-nf">Pokémon nicht gefunden 😕</div>}
    </section>
  )
}

// Shiny-Sprite: wechselt zwischen normal/shiny, mit Fallback
function ShinySprite({ detail }) {
  const [shiny, setShiny] = useState(false)
  useEffect(() => { setShiny(false) }, [detail.id])
  return (
    <div className="deck-sprite-inner">
      <img className="deck-sprite" src={shiny ? detail.shiny : detail.sprite} alt={detail.name}
        onError={(e) => { e.target.style.visibility = 'hidden' }} />
      <button className="deck-shiny-btn" onClick={() => setShiny((s) => !s)}>
        {shiny ? '🌟 Shiny' : '⚪ Normal'} · {shiny ? 'zeige normal' : 'zeige shiny'}
      </button>
    </div>
  )
}
