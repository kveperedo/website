# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start dev server (port 3000)
pnpm build         # Production build
pnpm preview       # Preview production build
pnpm test          # Run Vitest suite
pnpm lint          # Oxlint
pnpm lint:fix      # Auto-fix lint issues
pnpm format        # Oxfmt formatter
pnpm format:check  # Check formatting without writing

# Database (Prisma + Neon)
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:migrate    # Create and apply a new migration (dev)
pnpm db:deploy     # Apply committed migrations (production)
pnpm db:push       # Sync schema without migration file (dev only)
pnpm db:studio     # Open Prisma Studio UI
pnpm db:check      # Validate Prisma schema
```

## Architecture

This is Kevin's personal website — a portfolio with an authenticated admin area for expense tracking. Built with **TanStack Start** (SSR-capable React 19 framework) using file-based routing.

### Routing

TanStack Router with file-based routes under `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` — never edit that file manually.

Key route conventions:
- `(index)/` — route group for public pages (doesn't affect URL)
- `-components/`, `-sections/`, `-constants.ts` — co-located private files; the `-` prefix prevents TanStack Router from treating them as routes
- `_auth.tsx` — layout-only route that enforces authentication; all child routes under `_auth/` are protected
- `__root.tsx` — HTML shell and global providers

### Server Functions

Server-only logic uses TanStack Start's `createServerFn`. The pattern splits concerns across two files:
- `*.server.ts` — raw database/auth logic (never imported by client)
- `*.functions.ts` — `createServerFn` wrappers that call the server file and are safe to import from route components

Auth middleware (`src/utils/auth.middleware.ts`) can be composed onto individual server functions to protect them.

### Authentication

Session-based auth with encrypted cookies (15-day max age). Env vars required:
- `ADMIN_PASSWORD_HASH` — bcrypt hash of the admin password
- `SESSION_SECRET` — secret for signing session cookies

Unauthenticated requests to `_auth/*` routes redirect to `/login`.

### Database

PostgreSQL via **Prisma + Neon serverless adapter**. Schema lives in `prisma/schema.prisma`; the generated client outputs to `src/generated/prisma`. After any schema change, run `pnpm db:generate`.

Current model: `Expense` (id UUID, description, amount Decimal, category enum, timestamps).

### Styling

**Tailwind CSS 4** with custom theme tokens in `src/styles.css`. Dark theme with neutral-900/950 base and neon accents (pink, fuchsia, indigo). Custom fonts: Major Mono Display (headings), Zilla Slab (body serif), JetBrains Mono (code).

Use `cn()` from `src/lib/cn.ts` (tailwind-merge wrapper) for conditional classnames. Use `tailwind-variants` for component variant definitions.

### Component Patterns

- **react-aria-components** for all interactive UI primitives (Button, Input, Label, TextField) — provides accessibility out of the box
- Lucide React for icons
- Components with multiple visual states use `tailwind-variants` for the variant table
- Import alias: `#/*` → `src/*`
