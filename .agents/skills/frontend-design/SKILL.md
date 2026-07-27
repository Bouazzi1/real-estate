---
name: frontend-design
description: Guidelines and principles for creating ultra-luxury, state-of-the-art web frontend interfaces for real estate applications.
---

# 🎨 Luxury Real Estate Frontend Design System & Skill Guide

This skill equips the agent with design principles, component patterns, and visual styling guidelines to produce jaw-dropping, high-converting luxury web applications.

---

## 💎 1. Design Tokens & Color Palette

### Primary Color Scheme (Deep Dark Luxury)
* **Background Canvas:** Deep Charcoal / Midnight (`#030712`, `bg-slate-950`)
* **Card & Surface Backgrounds:** Elevated Slate Glass (`bg-slate-900/60`, `backdrop-blur-xl`)
* **Borders & Dividers:** Subtle Metallic Grid (`border-slate-800/80`, `hover:border-amber-500/40`)

### Accent Palette (Prestige Gold & Emerald)
* **Gold Primary Accent:** Warm Amber / Champagne Gold (`#d97706`, `#f59e0b`, `#fbbf24`)
* **Gold Gradients:** `bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600`
* **Success / Available Status:** Emerald Green (`#10b981`, `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`)
* **Hot Lead / Featured Badge:** Gold Metallic Pill (`bg-amber-500/10 text-amber-400 border-amber-500/30`)

---

## ✒️ 2. Typography & Hierarchy

* **Headings (Prestige Display):** Serif / Geometric Display Font (e.g. `Playfair Display`, `Outfit`, or `Cinzel` for hero headlines).
* **Body & UI Text:** Clean Sans-serif (`Plus Jakarta Sans` or `Inter`, high legibility, letter-spacing tracking).
* **Uppercase Accents:** `text-[10px] font-bold uppercase tracking-widest text-amber-500`

---

## ✨ 3. Component Aesthetics Patterns

### A. Luxury Glass Cards
```tsx
className="group relative overflow-hidden bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 backdrop-blur-xl hover:-translate-y-1"
```

### B. Gold Glow Primary Buttons
```tsx
className="relative group overflow-hidden px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
```

### C. Secondary Glass Buttons
```tsx
className="px-6 py-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
```

---

## 🤖 4. AI Sales Advisor UI Guidelines

* **Floating Widget Trigger:** Pulse ring animation around golden chat icon.
* **Streaming Response:** Typing indicator with pulsing gold dots, smooth auto-scroll.
* **Quick Suggestion Chips:** Pill buttons for instant prompts (*"Prix du Penthouse"*, *"Réserver une visite"*, *"Plans 3D"*).
