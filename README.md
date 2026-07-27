# ⚡ Rondelldemo — Pokémon Showcase & Scroll-Cinematic

**A neon-drenched Pokémon landing experience: a draggable news-rondell with a surprise booster, a scroll-driven Pikachu & Squirtle cinematic, and a full 1,300-entry Pokédex with shiny hunting — all wrapped in GPU-composited glass over a drifting starfield.**

---

## 🌐 Live Demo

**[View Source →](https://github.com/777danielpaul-droid/Pokemon-Website)** · Run locally with `npm run dev` (see Development below).

---

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5.3.4-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11.3.0-000000?style=for-the-badge)
![GSAP](https://img.shields.io/badge/GSAP-3.15.0-0AE448?logo=greensock&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.6-065D44?logo=tailwindcss&logoColor=white&style=for-the-badge)

---

## ✨ Key Features

### 🎡 **Draggable News-Rondell**
A physics-driven carousel (`useSpring` + GSAP) of news cards with one **booster pack injected at a random position** on every load. Drag, flick, or click to spin — the closest card pins and reveals with holo-glass depth.

### 🎁 **Booster Pack Reveal**
Land on the booster card and hit **"BOOSTER ÖFFNEN"** to watch a TCG-pocket-style pack burst open with holo-shimmer. One dose per visit — a high-stakes reward moment.

### 🎬 **Scroll-Driven Cinematic**
A 141-frame sprite sheet (`/anim/sheet.jpg`) of Pikachu & Squirtle plays **once** as you scroll into the story section — frame-scrubbed on both desktop and mobile (300vh on mobile for a clean single pass, no endless loop). Crossfades softly over the hero.

### 📖 **Full Pokédex (1,300+)**
Live data from the **PokéAPI**: browse every species, open a detail dossier with stats, type badges, evolution info, and a **shiny sprite toggle**. Type-filter drills into real `/type/{name}` lists.

### 🌌 **Holo-Glass Visual System**
A 42-spark drifting starfield behind GPU-composited neon over glass panels. Fully respects `prefers-reduced-motion`. Tuned for 55+ FPS.

### 🧭 **Auto-Hide Header & Reset-on-Reload**
Scroll down → header tucks away; scroll up → it returns. Every page reload snaps back to the very top (browser scroll-restoration disabled) so the rondell + cinematic always restart clean.

---

## 🏗️ Architecture & Workflow

Built with a **modern React 18 + Vite** stack, Framer Motion for spring physics, GSAP for scroll orchestration, and Tailwind for styling.

- **`App.jsx`** — Rondell state, drag/flick physics, auto-hide header, scroll-reset, layout
- **`data.js`** — News cards + booster definition
- **`Pokedex.jsx`** — PokéAPI fetch, detail modal, shiny toggle, type filter
- **`ScrollScene.jsx`** — Frame-to-frame sprite scrub (desktop + mobile)
- **`BoosterModal.jsx`** — Pack-open animation
- **`Starfield.jsx`** — Drifting background sparks

The app follows a **component-driven pattern** with strict separation between scroll orchestration (GSAP / rAF scrub), data (PokéAPI), and React UI.

---

## 📊 Performance & Metrics

- **Core Web Vitals**: Optimized for LCP & CLS
- **Animations**: CSS GPU-composited (`transform` / `opacity`), spring physics via Framer Motion
- **Target FPS**: 55–58 stable on desktop & mobile
- **Accessibility**: `prefers-reduced-motion` honored
- **Deployment**: GitHub (manual `npm run dev` / `npm run build`)
- **Framework**: Vite + React 18

---

## 📅 Development

```bash
npm install
npm run dev      # local dev server (http://localhost:5199)
npm run build    # production build
npm run preview  # preview the build
```

> The Pokédex pulls live data from `https://pokeapi.co/api/v2` — an internet connection is required for dex browsing.

---

## 📄 License

Personal Project — Non-commercial use only.

---

## 💝 Credits

Created by Daniel Paul (777danielpaul-droid)

**"Gotta catch 'em all!"** ⚡
