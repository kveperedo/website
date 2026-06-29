---
name: frontend-design
description: Design guidance for this project's dark neon aesthetic. Use this skill whenever building, extending, or styling any UI — new pages, sections, components, layouts, or visual updates — even if the user doesn't explicitly say "design" or "style". Covers color palette, typography, component patterns, animation, and glassmorphism conventions for this specific codebase. Trigger on anything that touches the visual layer: "add a section", "build a card", "create a new page", "make it look like the rest of the site", "style this component".
---

# Design System

This project uses a dark cyberpunk-minimal aesthetic: near-black backgrounds, three distinct typefaces, neon accent glows, and glassmorphism surfaces.

## Color Palette

Base surfaces use Tailwind neutrals:
- `bg-neutral-950` / `bg-neutral-900` — page and card backgrounds
- `bg-neutral-900/40` + `backdrop-blur` — glass surface (preferred for cards, list items, content panels)
- `border-neutral-800` — default border; `border-neutral-700` / `border-neutral-500` on hover

Text hierarchy:
- `text-neutral-50` — primary headings
- `text-neutral-100` / `text-neutral-200` — strong secondary content
- `text-neutral-300` — captions, metadata, secondary labels
- `text-neutral-400` — icon colors at rest

Neon accents (use as glows, borders, and focus rings — not large fills):
- **Indigo** — primary interactive: `indigo-900` bg, `indigo-800/40` border, `indigo-400` hover/focus
- **Fuchsia** — ambient glow accent
- **Emerald** — ambient glow accent
- **Blue** — ambient glow accent
- **Rose** — ambient glow accent

Neon colors appear in background blobs, button/focus ring accents, and hover border tints. Avoid large solid fills; prefer low-opacity with `blur-3xl`.

## Typography

Three fonts — always use the Tailwind alias, never raw font names:

| Alias | Font | Use |
|---|---|---|
| `font-mono` | Major Mono Display | Brand headings, page titles, signature text |
| `font-serif` | Zilla Slab | Body text, descriptions, button labels, prose |
| `font-code` | JetBrains Mono | Code, technical labels, monospace UI text |

Heading scale:
- Hero: `font-mono text-5xl md:text-6xl lg:text-8xl text-neutral-50`
- Section h1: `text-4xl font-medium` (implicit weight from font)
- Sub-heading h4: `font-serif text-2xl md:text-3xl lg:text-4xl tracking-wide text-neutral-300`
- Content h3: `text-2xl font-bold`

Body text:
- Long-form: `font-serif text-lg leading-loose text-neutral-100 md:text-xl md:leading-[2.5]`
- List items: `leading-loose font-medium tracking-wide text-neutral-200`
- Captions: `font-mono text-neutral-200` (or `font-serif` depending on context)

## Spacing & Layout

- Page container: `container mx-auto` with `relative`
- Section padding: `px-8 py-16`
- Vertical rhythm between major sections: `h-10` spacer divs or `gap-16` on flex parents
- Footer spacing: `my-16`
- Large vertical gaps inside sections: `gap-8`, `gap-10`, `gap-16`

## Component Patterns

### Cards
```tsx
<div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-xl backdrop-blur transition-colors hover:border-neutral-700 hover:bg-neutral-900/60 md:p-8">
```
- Always `rounded-2xl` for cards, `rounded` for small controls
- Hover state: lighten both border and background
- `shadow-xl` for elevation, `backdrop-blur` for glass effect

### Tags / Chips
```tsx
<span className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-bold text-neutral-300">
  {label}
</span>
```

### Buttons (via `buttonStyles` from `src/components/button`)
Three variants defined in `button.shared.styles.ts`:
- `primary` — indigo-900 bg with indigo border/hover
- `secondary` — neutral-900/40 bg with neutral border
- `tertiary` — transparent, border appears on hover only

Always use the existing `Button` component from `#/components/button` rather than raw `<button>`. For link-styled buttons use `AriaLink` with `buttonStyles()` applied.

### Ambient Background
The animated glow background (`src/components/background.tsx`) uses multiple `blur-3xl` blobs with `animate-grow`. When adding a background to a new page, reuse `<Background />`. Don't recreate individual blobs unless intentionally scoping them to a section.

### Transitions
All interactive elements use `transition-all duration-500` for a slow, premium feel. Don't use shorter durations unless animating something that must feel snappy (e.g. a toggle flip).

### Focus Rings
Always include accessible focus-visible styles:
```tsx
"focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
```
Ring color should match the accent: `focus-visible:ring-indigo-400/70` for primary, `focus-visible:ring-neutral-400` for secondary.

### Animated Dots (timeline / status indicators)
```tsx
<div className="relative h-3 w-3">
  <span className="absolute h-full w-full animate-ping rounded-full bg-neutral-400/50" />
  <span className="absolute h-full w-full rounded-full bg-neutral-50" />
</div>
```

## Content Style

Section headings are left-aligned with `mr-auto` when inside a centered container. Hero text is center-aligned. Mixed-case stylization (`keVin von eRicH`) is intentional brand voice — don't normalize it.

## Checklist Before Finishing Any UI Task

- [ ] Background: dark neutral (`bg-neutral-900` or `bg-neutral-900/40 backdrop-blur`)
- [ ] Text: correct neutral shade for hierarchy (50 → 100 → 200 → 300 → 400)
- [ ] Font: `font-mono` for display/brand, `font-serif` for prose, `font-code` for technical
- [ ] Borders: `border-neutral-800` default, lighter on hover
- [ ] Interactive elements: `transition-all duration-500`, focus-visible ring
- [ ] Cards: `rounded-2xl shadow-xl backdrop-blur`
- [ ] Tags: `rounded-full px-4 py-2 text-xs font-bold`
- [ ] Used existing `Button` / `IconButton` components rather than raw elements
- [ ] No large solid neon fills — neon only as accents, glows, or borders
