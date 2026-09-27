# 🎨 WanderAI — Frontend Design System & UI Specifications

> **Design Philosophy**: High-altitude expedition aesthetics, sleek modern dark theme, frosted glassmorphism, crisp typography, and fluid micro-interactions.

---

## 1. Typography Hierarchy

The WanderAI frontend uses Google Fonts configured in `layout.tsx`:
- **Primary Body Font**: `Inter`, `sans-serif` (clean, highly legible for data tables, descriptions, and badges).
- **Display & Headings Font**: `Plus Jakarta Sans`, `sans-serif` (bold, expressive, geometric headers).
- **Accent & Numbers**: `Outfit` / `Inter` tabular figures for coordinates, currency (PKR), and elevations.
- **Iconography**: Google **Material Symbols Outlined** (variable font: `FILL@0..1, wght@100..700`) + **Lucide React**.

### Typography Classes:
| Element | Font | Weight | Size / Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display H1** | Plus Jakarta Sans | 700 / 800 | `text-4xl md:text-6xl` | `tracking-tight` |
| **Section Title H2** | Plus Jakarta Sans | 600 / 700 | `text-2xl md:text-3xl` | `tracking-tight` |
| **Card Header H3** | Plus Jakarta Sans | 600 | `text-lg md:text-xl` | `tracking-normal` |
| **Body Primary** | Inter | 400 / 500 | `text-sm md:text-base` | `leading-relaxed` |
| **Micro Badges / Metadata** | Inter | 600 | `text-xs uppercase` | `tracking-wider` |
| **Coordinates / Money / AMSL** | Outfit / Inter | 600 | `font-mono text-xs md:text-sm` | `tracking-tight` |

---

## 2. Color Palette & Thematic Tokens

The palette is tuned for high-contrast dark mode with emerald/cyan topographic accents:

### Surface & Background Tokens:
- **Canvas Base Background**: `#0b1329` (`bg-[#0b1329]` or `bg-slate-950`)
- **Surface Elevation 1 (Card Base)**: `rgba(17, 24, 39, 0.75)` with `backdrop-blur-md`
- **Surface Elevation 2 (Hover/Active Card)**: `rgba(30, 41, 59, 0.85)`
- **Surface Elevation 3 (Modals / Drawers)**: `rgba(15, 23, 42, 0.95)` with `border-slate-700/50`
- **Glass Border Stroke**: `border border-white/10` or `border-slate-800/80`

### Brand & Accent Tokens:
- **Primary Accent (Emerald / Cyan Route)**: `#00dc82` / `#10b981` / `#06b6d4`
- **Secondary Accent (Glacial Ice)**: `#38bdf8` / `#60a5fa`
- **Warning / Advisory (High-Altitude Alerts)**: `#f59e0b` / `#fbbf24`
- **Danger / Road Blockage**: `#ef4444` / `#f87171`
- **Text Primary**: `#f8fafc` (`text-slate-50`)
- **Text Secondary / Muted**: `#94a3b8` (`text-slate-400`)
- **Text Tertiary / Subtle**: `#64748b` (`text-slate-500`)

---

## 3. Reusable Component Conventions

### 1. Glassmorphism Card Style
```tsx
<div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all duration-300">
  {/* Content */}
</div>
```

### 2. Status & Passability Badge Style
```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
  100% Operational
</span>
```

### 3. Action Buttons
- **Primary Action (Synthesize / Book)**:
  ```tsx
  <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all duration-200 active:scale-[0.98]">
    <span>Synthesize Expedition</span>
    <span className="material-symbols-outlined text-sm">auto_awesome</span>
  </button>
  ```
- **Secondary / Ghost Action**:
  ```tsx
  <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all duration-150">
    <span>View Elevation Matrix</span>
  </button>
  ```

---

## 4. Layout & Spacing Rules

- **Max Container Width**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Top Offset for Fixed Navbar**: `pt-20` to `pt-24`
- **Section Vertical Rhythm**: `py-16 md:py-24`
- **Grid Gaps**: `gap-6` for standard card grids, `gap-8 md:gap-12` for 2-column feature layouts.

---

## 5. Responsive Design Standards

- **Mobile (< 640px)**: Bottom drawer navigation, single column cards, collapsible filters in bottom sheets.
- **Tablet (640px - 1024px)**: 2-column place cards, inline tab bars, compact map drawer.
- **Desktop (1024px+)**: 3-column place grids, split-screen Mapbox explorer, multi-tier filter sidebar.
