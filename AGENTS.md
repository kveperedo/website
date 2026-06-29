# AGENTS.md — Kevin's Personal Website

## Commands

- **npm** (not pnpm — lockfile is `package-lock.json`, CI uses `npm ci`)
- `npm run dev` — port 3000
- `npm run lint` / `npm run format:check` — pre-commit hook runs both
- `npm run db:generate` → `npm run db:deploy` — required before build if schema changed
- `npm run test` — runs Vitest; **no tests exist yet**

## Architecture

- **TanStack Start** SSR app, file-based routing under `src/routes/`
- Route groups: `(public)/` (homepage, login, mac config) and `(authed)/_auth` (protected layout)
- Server functions split: `*.server.ts` (raw db/auth) + `*.functions.ts` (`createServerFn` wrappers)
- Import aliases: `#/*` and `@/*` → `src/*`
- Auth: session cookies (15-day max age), env vars `SESSION_SECRET` + `ADMIN_PASSWORD_HASH`
- DB: PostgreSQL via **Prisma v7** + `@prisma/adapter-neon` (runtime adapter pattern in `src/db/client.ts`)
- Prisma config uses `prisma.config.ts` (v7 config system, not `schema.prisma` datasource url)

## Route Conventions

- `-components/`, `-sections/`, `-constants.ts` — `-` prefix prevents TanStack Router from treating them as routes
- `_auth.tsx` — layout-only route; all children are protected (redirects to `/login`)
- `__root.tsx` — HTML shell, global providers; never edit `routeTree.gen.ts` (auto-generated)

## Styling & Components

- **Tailwind CSS 4** — theme tokens in `src/styles.css`; dark base (neutral-900/950) with neon accents (pink, fuchsia, indigo)
- Three font aliases: `font-mono` (Major Mono Display, headings), `font-serif` (Zilla Slab, body), `font-code` (JetBrains Mono, code)
- Use `cn()` from `#/lib/cn.ts` (tailwind-merge) for conditional classnames; `tailwind-variants` for multi-variant component styles
- **react-aria-components** for all interactive primitives (Button, Input, Label, TextField, Link, etc.)
- Lucide React for icons; existing components in `src/components/button/` and `src/components/icon-button/`
- Pre-commit hook runs `npm run lint && npm run format:check` — runs oxlint + oxfmt

## Key Files

| File                           | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `src/db/client.ts`             | Prisma client singleton with Neon adapter                |
| `src/utils/auth.server.ts`     | Session read/login/logout                                |
| `src/utils/auth.middleware.ts` | Composable middleware for server functions               |
| `prisma/schema.prisma`         | Only model: `Expense`                                    |
| `src/styles.css`               | Tailwind CSS 4 theme, custom fonts, animation keyframes  |
| `src/lib/cn.ts`                | `cn()` — tailwind-merge wrapper for conditional classes  |
| `src/components/button/`       | Reusable Button with primary/secondary/tertiery variants |

## Deploy / CI

- **Vercel** — output dir is `.output`; `NITRO_PRESET=vercel` set during build
- CI pipeline (`pipeline.yml`): lint → format:check → db:generate → db:deploy → Vercel build+deploy
- PRs deploy to preview env; pushes to main deploy to production

## Gotchas

- **React Compiler** enabled — `@rolldown/plugin-babel` with `reactCompilerPreset` in `vite.config.ts`
- Prisma client generates to `src/generated/prisma` (gitignored); run `npm run db:generate` after schema changes
- Build artifact dirs (`.nitro`, `.output`, `.tanstack`) are all gitignored
- Oxlint ignores `src/routeTree.gen.ts`; oxfmt ignores it plus `.agents/*`
- Skills in `.agents/skills/`; remotely-sourced skills mirrored in `skills-lock.json`
