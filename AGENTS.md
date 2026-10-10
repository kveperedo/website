# AGENTS.md — Kevin's Personal Website

## Commands

- **pnpm** (lockfile is `pnpm-lock.yaml`)
- `pnpm run dev` — `cf dev`; port 3000 and `--host` live in `vite.config.ts` because `cf dev` forwards no extra arguments to Vite
- `pnpm run lint` / `pnpm run format:check` — pre-commit runs both
- `pnpm run db:generate` → `pnpm run db:deploy` — required before build if schema changed
- `pnpm run test` — Vitest unit tests
- `pnpm run build` — `cf build`, writes Build Output to `.cloudflare/output/v0/`
- `pnpm run deploy` — `cf deploy`, which builds first (production → `kevinperedo.com`)
- **Preview deploy**: `pnpm run preview:deploy` (= `cf previews deploy`) — creates or updates a Worker Preview named after the current git branch; override by passing the name (`pnpm run preview:deploy pr-123`)
- **Preview delete**: `pnpm run preview:delete pr-123-website` — `cf` has no `previews delete`, so this is `cf workers delete <worker-name>`, which prompts; pass `--force` to skip the prompt (CI does)
- `pnpm run preview:vite` — Vite's own preview server, unrelated to Worker Previews
- `pnpm run cf:generate` — regenerates `.cloudflare/types/index.d.ts` from `cloudflare.config.ts`
- `pnpm run typecheck` — runs `cf workers types` first, because the generated types are gitignored

## Previews

- CI uses a single Preview name, `pr-<number>`, deleted on PR close by the `cleanup-preview` job. Nothing long-lived is deployed: pushing to `main` deploys production only, and `deploy.outputs.url` is therefore empty on `push`.
- Preview settings live in the `ctx.isPreview` branch of `cloudflare.config.ts` — these are Worker Previews, not environments, so nothing is inherited. Every binding read from `env` must be redeclared there, and `cf migrate` copies the whole Worker block into both branches; `defineWebsiteWorker()` in that file is the shared part.
- The preview branch deliberately omits `domains` and `triggers`, so a Preview never claims `kevinperedo.com` and never receives `scheduled()` invocations. `cf migrate` puts them in both branches — that is a bug to keep from re-introducing.
- Secrets (`SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `E2E_PASSWORD`) are declared with `bindings.secret()`; the values live on the account, not in the config file. Set one with `pnpm exec cf workers secrets update <KEY> --worker website --text <VALUE>`, or upload several at once with `cf deploy --secrets-file <PATH>`. Locally they come from `.env`/`.dev.vars`.
- A PR preview is public for as long as the PR is open, and it inherits `E2E_PASSWORD`, so `isE2EAvailable()` is true and the E2E suite skips rate limits there. `loginFn` passes `alwaysEnforce` so its rate limit stays on regardless; every other rate-limited endpoint sits behind `authMiddleware`.
- A local `pnpm run preview:deploy` is not deleted for you and inherits those secrets too — run `pnpm run preview:delete` when you are done with the branch.
- `X-Robots-Tag: noindex` is applied by Cloudflare to `workers.dev` Preview URLs only — a Preview served on a custom domain needs Cloudflare Access instead.
- `cf previews deploy` prints its JSON result after the delegated Vite build log, so do not pipe it into `jq` expecting clean JSON. CI reconstructs the Preview URL as `<preview-name>-website.kevinperedo.workers.dev`.

## Architecture

- **TanStack Start** SSR app, file-based routing in `src/routes/`
- Route groups: `(public)/` (homepage, login, config/mac setup) and `(authed)/_auth` (protected)
- Server functions: `*.server.ts` (raw db/auth) + `*.functions.ts` (`createServerFn` wrappers); use `authMiddleware` for protected endpoints. `serverFunctionLoggingMiddleware` is registered globally: log failures, successful mutations, and reads slower than 500 ms; never log request payloads or sensitive data. Do not log individual rate-limit rejections.
- Import alias: `@/*` → `src/*`
- Auth: session cookie (15-day max age), env vars `SESSION_SECRET` + `ADMIN_PASSWORD_HASH`
- DB: PostgreSQL via **Prisma v7** + `@prisma/adapter-pg` through a Cloudflare Hyperdrive binding; TCP connections support Prisma transactions. Start transactions at coordinated workflow boundaries and pass the transaction client to their write helpers. `DATABASE_URL` in `prisma.config.ts` is for Prisma CLI only
- Prisma client outputs to `src/generated/prisma` (gitignored)
- Validation: `zod` schema input validation on server functions (see `src/app/auth/functions.ts`)
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
- **react-aria-components** for interactive primitives: Button, Input, Separator, Accordion, Popover, Calendar
- Lucide React for icons; shadcn/ui components in `src/components/ui/`
- `components.json` configures the shadcn registry
- `@tailwindcss/typography` plugin and `tw-animate-css` imported in styles

## Key Files

| File                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `src/db/client.ts`        | Prisma client factory (Hyperdrive-backed pg adapter)     |
| `src/app/auth/`           | Session logic, server functions, and auth middleware     |
| `src/app/finance/`        | Finance-domain services and server functions             |
| `src/app/infra/`          | Cache control, logging, and rate limiting                |
| `src/app/e2e/`            | E2E fixture seeding and server functions                 |
| `prisma/schema.prisma`    | Single model: `Expense`                                  |
| `src/styles.css`          | Tailwind v4 theme, fonts, keyframes, CSS variables       |
| `src/components/link.tsx` | RAC `<Link>` via `createLink` — TanStack Router typed    |
| `src/components/ui/`      | shadcn components (button, badge, input, field, etc.)    |
| `src/lib/env.ts`          | `requireEnv()` helper for env vars                       |
| `cloudflare.config.ts`    | Cloudflare Workers config (KV, routes, bindings)         |
| `.cloudflare/types/`      | Auto-generated Worker types (run `pnpm run cf:generate`) |
| `components.json`         | shadcn registry config                                   |

## Gotchas

- Build artifacts (`.output`, `.tanstack`, `.cloudflare`) are all gitignored
- `cf` (the Cloudflare CLI) replaced Wrangler for build, deploy, and previews. Wrangler is no longer installed and `wrangler.jsonc` is gone — secrets go through `cf workers secrets update <KEY> --worker website --text <VALUE>` and live logs through `cf o11y telemetry live-tail`
- `cloudflare.config.ts` must stay loadable by Node (Node >= 22.18, `"type": "module"` already set). It is imported by every `cf` command, including plain API commands
- Oxlint ignores `src/routeTree.gen.ts`; oxfmt ignores it plus `.agents/*`, `.cloudflare/*`, and skill files
- Skills in `.agents/skills/`; remotely-sourced skills mirrored in `skills-lock.json`
- The deployed Worker must use the `HYPERDRIVE` binding; `DATABASE_URL` is reserved for local development and Prisma CLI commands
- `.env.example` documents required env vars; use `tsx` to run TypeScript scripts locally
- `"use client"` directive needed in any file that uses browser APIs (e.g., `label.tsx`)
- Navigation: use `<Link>` from `@/components/link` for internal routes (TanStack Router typed `to`/`search`/`params`), `<LinkButton>` from `@/components/ui/button` for external `href` links
- Detailed styling/component patterns live in the `frontend-design` skill at `.agents/skills/frontend-design/SKILL.md`

## Testing

- **Vitest** for unit tests (`pnpm run test`): `environment: "node"`, runs in `checks` CI job
- **Playwright** for E2E tests (`pnpm run test:e2e`): runs against the deployed Worker Preview URL in CI
- E2E tests live in `e2e/tests/`; Playwright config at `e2e/playwright.config.ts`
- Auth helper at `e2e/helpers/auth.ts` navigates to `/login`, fills password from `E2E_PASSWORD` (sourced from `.env` locally or injected as a CI secret), and waits for redirect to `/finances`
- Vitest SSR plugins (`tanstackStart`, `nitro`, `devtools`) are disabled when `VITEST=true` to avoid transform conflicts
- For local E2E: start `pnpm run dev`, then `pnpm run test:e2e`. `BASE_URL` and `E2E_PASSWORD` are loaded from `.env` (see `.env.example`); the standalone `e2e/.env.test` file no longer exists
