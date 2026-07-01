---
name: frontend-design
description: Design guidance for this project's dark neon aesthetic. Use this skill whenever building, extending, or styling any UI — new pages, sections, components, layouts, or visual updates — even if the user doesn't explicitly say "design" or "style". Covers color palette, typography, component patterns, animation, and glassmorphism conventions for this specific codebase. Trigger on anything that touches the visual layer: "add a section", "build a card", "create a new page", "make it look like the rest of the site", "style this component".
---

# Design System

This project uses a dark cyberpunk-minimal aesthetic: near-black backgrounds, two distinct typefaces, neon accent glows, and glassmorphism surfaces with sharp (`rounded-none`) geometry.

## Color Palette

All colors use semantic tokens via CSS variables (defined in `src/styles.css` under `.dark`). The site is always dark mode — `dark` class on `<html>` in `__root.tsx:42`.

Text hierarchy:
- `text-foreground` (`oklch(0.985 0 0)`) — primary headings, strong content
- `text-muted-foreground` (`oklch(0.708 0 0)`) — captions, metadata, secondary labels, dates

Surfaces:
- `bg-background` (`oklch(0.145 0 0)`) — page background
- `bg-card` (`oklch(0.205 0 0)`) — cards, panels, elevated surfaces

Borders:
- `border-border` (`oklch(1 0 0 / 10%)`) — default border
- `border-input` (`oklch(1 0 0 / 15%)`) — input borders

Interactive accent:
- `primary` (`oklch(0.398 0.195 277.366)`) — indigo-toned primary for buttons, focus rings, hover states
- `bg-primary text-primary-foreground` — default button
- `text-primary` — link text
- `ring` (`oklch(0.556 0 0)`) — focus ring base

Destructive:
- `text-destructive` / `bg-destructive/10` — errors, danger states

Neon glow colors (used only in `background.tsx` blur-3xl blobs — not for large fills):
- **Fuchsia-700** — hero blob (top-left)
- **Indigo-700** — secondary blob (center-left)
- **Emerald-700** — bottom blob
- **Blue-700** — right blob
- **Rose-700** — bottom-right blob

All at low opacity (10–50%) with `blur-3xl`. Avoid neon as solid fills on UI elements.

## Typography

Two fonts — always use the Tailwind alias, never raw font names:

| Alias | Font | Use |
|---|---|---|
| `font-mono` | JetBrains Mono Variable | Body text, code, monospace UI (also the base font — `src/styles.css:197`) |
| `font-heading` | Manrope Variable | All headings, hero name, card titles, UI labels, brand text — covers everything previously split across `font-heading` and `font-display` |

Heading / text scale (from actual pages):
- Hero name: `font-heading text-5xl md:text-6xl lg:text-8xl text-foreground`
- Section title (Experience, Education, Projects): `font-heading text-4xl font-medium mr-auto mb-16`
- Subtitle (position): `font-heading text-2xl md:text-3xl lg:text-4xl tracking-wide text-muted-foreground`
- Timeline item title: `font-heading text-2xl font-bold`
- Body summary: `text-base md:text-lg lg:text-xl leading-loose md:leading-[2.5] text-foreground`
- List items: `text-sm leading-loose font-medium tracking-wide text-foreground`
- Dates / captions: `font-mono text-sm text-muted-foreground`
- Config page title: `font-mono text-5xl md:text-6xl font-medium text-foreground`
- Config description: `text-lg leading-loose text-muted-foreground max-w-2xl`

## Spacing & Layout

- Page container: `container mx-auto px-8 py-16`
- Section vertical spacing between major sections: `h-10` spacer divs
- Footer spacing: `my-16` with `flex flex-col items-center gap-8`
- Section padding: `px-8 py-16`
- Large vertical gaps inside sections: `gap-6`, `gap-8`, `gap-16`

## Component Patterns

All interactive primitives use **@base-ui/react** (Button, Input, Separator, Accordion). Native elements for simple wrappers (Label, Field). All components use `cva` (class-variance-authority) for variant management.

### `cn()` utility
Import from `@/lib/utils` (uses `clsx` + `tailwind-merge`):
```tsx
import { cn } from "@/lib/utils";
```

### Buttons (`@/components/ui/button`)
Uses `@base-ui/react/button` + `cva`. All buttons have `rounded-none`.

**Variants:**
- `default` — `bg-primary text-primary-foreground hover:bg-primary/80`
- `secondary` — `bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`
- `outline` — `border-border bg-background hover:bg-muted hover:text-foreground` (dark: `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`)
- `ghost` — `hover:bg-muted hover:text-foreground`
- `destructive` — `bg-destructive/10 text-destructive hover:bg-destructive/20`
- `link` — `text-primary underline-offset-4 hover:underline`

**Sizes:** `default` (h-8), `xs` (h-6), `sm` (h-7), `lg` (h-9), `xl` (h-11), `icon` (size-8), `icon-xs` (size-6), `icon-sm` (size-7), `icon-lg` (size-9)

Use the `render` prop for links:
```tsx
<Button render={<a href="/resume.pdf" target="_blank" rel="noreferrer" />}>
  Resume
</Button>
<Button variant="ghost" size="icon-sm" render={<Link to="/" />}>
  <ArrowLeftIcon />
</Button>
```

### Cards
Sharp-edged (`rounded-none`), with glass effect and hover interaction:
```tsx
<div className="flex flex-col rounded-none border border-border bg-card p-6 shadow-xl backdrop-blur transition-all hover:border-ring/40 hover:bg-card hover:ring-1 hover:ring-ring/40 md:p-8">
```
- Cards use `rounded-none` (not rounded-2xl)
- `shadow-xl` + `backdrop-blur` for glass effect
- Hover: subtle border/ring highlight via `hover:border-ring/40 hover:ring-1 hover:ring-ring/40`

### Badges (`@/components/ui/badge`)
Uses `@base-ui/react/use-render` + `cva`. Sharp-edged (`rounded-none`), compact:
```tsx
<Badge variant="secondary">{label}</Badge>
```
**Variants:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` — same naming as button.

### Inputs (`@/components/ui/input`)
Uses `@base-ui/react/input`. Sharp-edged with focus ring:
```tsx
<Input
  id="password"
  name="password"
  type="password"
  placeholder="Enter password"
  className="h-auto rounded border border-input bg-background px-4 py-3 text-sm tracking-wide text-foreground"
/>
```

### Field Components (`@/components/ui/field`)
Compound group of components for forms: `Field`, `FieldLabel`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldSeparator`, `FieldTitle`.

Use `FieldGroup` > `Field` > `FieldLabel` + `<Input/>` + `FieldError` pattern:
```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="password" className="text-sm tracking-wide text-foreground">
      Password
    </FieldLabel>
    <Input id="password" name="password" type="password" />
    <FieldError />
  </Field>
</FieldGroup>
```

### Separator (`@/components/ui/separator`)
Uses `@base-ui/react/separator`:
```tsx
<Separator />  {/* horizontal (default) */}
<Separator orientation="vertical" />
```

### Accordion (`@/components/ui/accordion`)
Uses `@base-ui/react/accordion` with `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`. Chevron icons for expand/collapse.

### Spinner (`@/components/ui/spinner`)
Simple loading indicator using `Loader2` from lucide-react with `animate-spin`.

### Ambient Background (`@/components/background.tsx`)
Fixed full-screen layer with multiple `blur-3xl` blobs. Reuse `<Background />` in root layout (`__root.tsx:48`). Don't recreate individual blobs.

Blob colors: fuchsia, indigo, emerald, blue, rose at 10–50% opacity with `animate-grow` and staggered `animation-delay-*` utilities.

### Focus Rings
All interactive elements use consistent focus-visible styles:
```tsx
"focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
```
Destructive variants add:
```tsx
"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20"
```

### Animated Dots (timeline status indicators)
```tsx
<div className="flex h-3 w-3">
  <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-muted-foreground/50" />
  <span className="absolute h-full w-full rounded-full bg-foreground" />
</div>
```
Used in `timeline.tsx` with `sticky` positioning for the active dot.

### Timelines (`src/routes/(public)/-components/timeline.tsx`)
Vertical timeline with sticky dots, left date column (hidden on mobile), collapsible content sections. Uses `<Badge>` for technology tags and card-style containers for detail lists.

## Content Style

Section headings are left-aligned with `mr-auto` when inside a centered container. Hero text is center-aligned. Mixed-case stylization (`keVin von eRicH`) is intentional brand voice — don't normalize it.

## Checklist Before Finishing Any UI Task

- [ ] Using semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`, `bg-primary`)
- [ ] Font: `font-mono` for body, `font-heading` for all headings and hero/brand text
- [ ] All interactive: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`
- [ ] Cards: `rounded-none shadow-xl backdrop-blur` with hover border/ring highlight
- [ ] Badges: use `<Badge>` from `@/components/ui/badge` with `variant="secondary"`
- [ ] Buttons: use `<Button>` from `@/components/ui/button` with `render` prop for link behavior
- [ ] Forms: use `@/components/ui/field` compound pattern (FieldGroup > Field > FieldLabel + Input + FieldError)
- [ ] `cn()` imported from `@/lib/utils` (not `#/lib/cn`)
- [ ] No large solid neon fills — neon only as blur-3xl blobs in background

## Scaffolding

The following directories exist under `src/components/` as empty stubs awaiting implementation:
- `badge/` — unlikely needed; use `@/components/ui/badge`
- `card/` — repeatable card variant wrappers
- `heading/` — polymorphic heading components
- `text/` — polymorphic text with body/lead/caption variants
- `separator/` — unlikely needed; use `@/components/ui/separator`
- `text-field/` — unlikely needed; use `@/components/ui/field`

Existing component implementations live in `src/components/ui/` (button, badge, separator, input, label, field, accordion, spinner).

Route-level components live in `src/routes/(public)/-components/` (fade-in, link-buttons, scroll-button, timeline) and `src/routes/(public)/-sections/` (introduction, summary, info, projects). All use the `-` prefix convention to prevent TanStack Router from treating them as routes.
