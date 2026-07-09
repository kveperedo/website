# AGENTS.md — Kevin's Personal Website

## Commands

- **npm** (not pnpm — lockfile is `package-lock.json`)
- `npm run dev` — port 3000, `--host` for network access
- `npm run lint` / `npm run format:check` — pre-commit runs both
- `npm run db:generate` → `npm run db:deploy` — required before build if schema changed
- `npm run test` — Vitest (no tests exist yet)
- `npm run build` — outputs to `.output`; Vercel expects `NITRO_PRESET=vercel`

## Architecture

- **TanStack Start** SSR app, file-based routing in `src/routes/`
- Route groups: `(public)/` (homepage, login, config/mac setup) and `(authed)/_auth` (protected)
- Server functions: `*.server.ts` (raw db/auth) + `*.functions.ts` (`createServerFn` wrappers); use `authMiddleware` for protected endpoints
- Import alias: `@/*` → `src/*`
- Auth: session cookie (15-day max age), env vars `SESSION_SECRET` + `ADMIN_PASSWORD_HASH`
- DB: PostgreSQL via **Prisma v7** + `@prisma/adapter-neon`; config in `prisma.config.ts` (not `schema.prisma` datasource)
- Prisma client outputs to `src/generated/prisma` (gitignored)
- Validation: `zod` schema input validation on server functions (see `auth.functions.ts`)
- **React Compiler** enabled via `@rolldown/plugin-babel`
- Prefer `date-fns` over native `Date` APIs for date manipulation and formatting

## Routing Conventions

- `-common/` directory at each route group level contains all non-route assets: `components/`, `sections/`, `icons/`, and `constants.ts` — `-` prefix prevents TanStack Router from treating them as routes
- `_auth.tsx` — layout-only route; children redirect to `/login` when unauthenticated
- `__root.tsx` — HTML shell, global providers; never edit `routeTree.gen.ts` (auto-generated)

## UI & Styling

- **Tailwind CSS 4** — theme tokens in `src/styles.css`; dark base with neon accents
- Font aliases: `font-mono` (JetBrains Mono — body), `font-heading` (Manrope Variable — all headings, hero, brand)
- `cn()` from `@/lib/utils` (clsx + tailwind-merge); `cva` from `class-variance-authority` for multi-variant components
- **@base-ui/react** (not react-aria-components) for interactive primitives: Button, Input, Separator, Accordion
- Lucide React for icons; shadcn/ui components in `src/components/ui/`
- `components.json` configures the shadcn registry
- `@tailwindcss/typography` plugin and `tw-animate-css` imported in styles

## Key Files

| File                                            | Purpose                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| `src/db/client.ts`                              | Prisma client singleton (Neon adapter)                |
| `src/utils/auth.server.ts`                      | Session read/login/logout                             |
| `src/utils/auth.functions.ts`                   | `createServerFn` wrappers for auth                    |
| `src/utils/auth.middleware.ts`                  | Composable auth middleware for server functions       |
| `src/utils/expenses.server.ts` / `.function.ts` | Example server function pattern                       |
| `prisma/schema.prisma`                          | Single model: `Expense`                               |
| `src/styles.css`                                | Tailwind v4 theme, fonts, keyframes, CSS variables    |
| `src/components/ui/`                            | shadcn components (button, badge, input, field, etc.) |
| `src/lib/env.ts`                                | `requireEnv()` helper for env vars                    |
| `components.json`                               | shadcn registry config                                |

## Gotchas

- Build artifacts (`.nitro`, `.output`, `.tanstack`) are all gitignored
- Oxlint ignores `src/routeTree.gen.ts`; oxfmt ignores it plus `.agents/*` and skill files
- Skills in `.agents/skills/`; remotely-sourced skills mirrored in `skills-lock.json`
- `.env.example` documents required env vars; use `tsx` to run TypeScript scripts locally
- `"use client"` directive needed in any file that uses browser APIs (e.g., `label.tsx`)
- Detailed styling/component patterns live in the `frontend-design` skill at `.agents/skills/frontend-design/SKILL.md`

## Testing

- **Vitest** for unit tests (`npm run test`): `environment: "node"`, runs in `checks` CI job
- **Playwright** for E2E tests (`npm run test:e2e`): runs against the deployed Vercel preview URL in CI
- E2E tests live in `e2e/tests/`; Playwright config at `e2e/playwright.config.ts`
- Auth helper at `e2e/helpers/auth.ts` navigates to `/login`, fills password from `E2E_PASSWORD` (sourced from `.env` locally or injected as a CI secret), and waits for redirect to `/finances`
- Vitest SSR plugins (`tanstackStart`, `nitro`, `devtools`) are disabled when `VITEST=true` to avoid transform conflicts
- For local E2E: start `npm run dev`, then `npm run test:e2e`. `BASE_URL` and `E2E_PASSWORD` are loaded from `.env` (see `.env.example`); the standalone `e2e/.env.test` file no longer exists
