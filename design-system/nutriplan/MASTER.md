# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** NutriPlan  
**Generated:** 2026-07-20  
**Category:** Nutrition / Wellness mobile app  
**Style:** Soft UI Evolution (warm food brand)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#FF6A3D` | `--np-primary` | CTAs, active nav, accents |
| Primary deep | `#E0512C` | `--np-primary-deep` | Eyebrows, links, emphasis |
| Secondary | `#FFB02E` | `--np-secondary` | Gradient end, carb accent |
| Success | `#18BD73` | `--np-success` | Health, fat macro, connected |
| Success deep | `#11A866` | `--np-success-deep` | Health hero gradient |
| Background | `#FFF6EC` | `--np-bg` | Screen canvas |
| Surface | `#FFFFFF` | `--np-surface` | Cards |
| Surface muted | `#F6ECE0` | `--np-surface-muted` | Chips, tracks, sheets |
| Border | `#F0E8DF` | `--np-border` | Inputs, dividers |
| Text | `#2A2520` | `--np-text` | Headings, body |
| Text muted | `#9A9087` | `--np-text-muted` | Secondary copy |
| Text soft | `#B8AEA2` | `--np-text-soft` | Hints, inactive nav |
| Ink | `#2A2520` | `--np-ink` | Dark buttons |
| Wrapper | `#EFE7DA` | `--np-wrapper` | Desktop frame backdrop |

**Brand notes:** Warm coral + amber food energy. Soft cream canvas. Mint for health/success only. Do **not** introduce purple/indigo as brand color.

### Typography

- **Display / headings:** Nunito (600–900)
- **Body / UI:** Plus Jakarta Sans (400–800)
- **Mood:** warm, approachable, nutritional, mobile-first
- **Google Fonts:** already loaded in `index.html`

```css
font-family: 'Nunito', system-ui, sans-serif;           /* titles */
font-family: 'Plus Jakarta Sans', system-ui, sans-serif; /* body */
```

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--np-space-xs` | `4px` | Tight gaps |
| `--np-space-sm` | `8px` | Icon gaps |
| `--np-space-md` | `16px` | Standard |
| `--np-space-lg` | `24px` | Section gaps |
| `--np-space-xl` | `32px` | Large gaps |
| Page padding (phone) | `64px 20px 120px` | Mockup tabs (notch + bottom nav) |
| Page padding (web) | `36px 28px 48px` | Desktop content column |
| Auth padding | `60–72px 28px 40px` | Login / register (phone); tighter on web card |

### Shells (mobile mockup vs web)

| Mode | Breakpoint | Shell |
|------|------------|--------|
| **Phone mockup** | `< 900px` | `.phone-frame` + `.phone-screen` + `BottomNav` — unchanged |
| **Web** | `≥ 900px` | `.app-shell` + `SideNav` + content `max-width: 840px` |

- Overlay portals: `.phone-screen` (mockup) or `.app-root` (web)
- Do **not** redesign mockup screens when changing web layout

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--np-radius-sm` | `14px` | Compact controls |
| `--np-radius-md` | `16px` | Inputs |
| `--np-radius-lg` | `18px` | Buttons, banners |
| `--np-radius-xl` | `22px` | Cards |
| `--np-radius-2xl` | `26px` | Hero cards |
| `--np-radius-pill` | `999px` | Chips, toggles |

### Shadows

| Level | Value |
|-------|-------|
| `--np-shadow-sm` | `0 2px 8px rgba(80,60,40,.08)` |
| `--np-shadow-md` | `0 4px 16px rgba(80,60,40,.05)` |
| `--np-shadow-lg` | `0 8px 30px rgba(80,60,40,.07)` |
| `--np-shadow-cta` | `0 8px 20px rgba(224,122,77,.32)` |

### Gradients

```css
--np-grad-primary: linear-gradient(120deg, #ff6a3d, #ffb02e);
--np-grad-avatar: linear-gradient(135deg, #ffc24d, #ff6a3d);
--np-grad-selected: linear-gradient(140deg, #ff7a45, #ff6a3d);
--np-grad-health: linear-gradient(135deg, #18bd73, #11a866);
--np-grad-warm-banner: linear-gradient(120deg, #fff1ea, #ffe9de);
```

---

## Component Specs

### Primary button
- Background: `--np-grad-primary`
- Text: white, weight 800
- Radius: 18–20px, padding ~15–17px
- Shadow: `--np-shadow-cta`
- Transition: 200ms ease
- Disabled: muted surface `#f0e8df` / text `#c8bfb4`

### Secondary button
- Background: white, border `2px solid #f0e8df`
- Text: `#4a4038`

### Dark button
- Background: `#2a2520`, text white
- Used for secondary strong actions (e.g. generate week)

### Cards
- Background: white, radius 22px
- Shadow: `--np-shadow-md`
- No decorative borders unless interactive selected state

### Inputs
- Border `2px solid #f0e8df`, radius 16px
- Font: Nunito 600, 15–16px
- Focus: border `#ff6a3d`, soft ring `rgba(255,106,61,.15)`

### Chips / selectable
- Inactive: white + border `#f0e8df`
- Active: `#fff4f0` + border `#ff6a3d` + text `#e0512c`

### Screen header
- Prefer `ScreenHeader` (`title`, optional `subtitle`, optional `onBack`)
- Eyebrow: 13–14px, weight 600–700, color `#e0512c`
- Title: Nunito 24–30px, weight 800, letter-spacing -0.5
- Subtitle: 13px, `#9a9087`, short (one short clause)

### Empty & notice
- `EmptyState`: title + optional short body + optional action
- `Notice`: soft tip banner (`primarySoft` or `bannerWarm`); keep copy ≤ 1 line when possible

### Copy tone
- Spanish, short, plain. Prefer verb + noun. Avoid filler (“puedes”, “para poder”, long explanations under inputs).
- Legal: short on-screen; full only in consent modal if needed.
---

## Style Guidelines

**Style:** Soft UI Evolution  
**Keywords:** soft depth, warm cream, rounded cards 18–26px, clear contrast, micro-transitions 150–300ms  

**Key effects:** Soft shadows, color/opacity hover (no layout-shifting scale), ease-out transitions, respect `prefers-reduced-motion`

### Anti-patterns

- ❌ Purple / indigo as brand primary
- ❌ Pink→coral selected gradients (use brand orange gradient)
- ❌ Emojis as UI icons (use SVG)
- ❌ Mixing random border-radii (stick to token scale)
- ❌ Solid primary CTAs when gradient primary is the brand button
- ❌ Layout-shifting hover scales
- ❌ Missing `cursor: pointer` on clickables

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (SVG instead)
- [ ] `cursor-pointer` on clickable elements
- [ ] Transitions 150–300ms
- [ ] Text contrast ≥ 4.5:1
- [ ] Focus states visible
- [ ] `prefers-reduced-motion` respected
- [ ] Page padding accounts for bottom nav on **phone mockup** (120px); web uses sidebar + lower bottom pad
- [ ] Web shell only at `min-width: 900px`; mockup intact below
- [ ] Radii / shadows from tokens
