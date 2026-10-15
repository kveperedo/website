# Kevin Von Erich Peredo's Website

The personal website for [Kevin Von Erich Peredo](https://kevinperedo.com). It includes a public portfolio and an authenticated personal-finance dashboard for tracking transactions, scheduled entries, and spending trends.

## Stack

- React 19, TypeScript, and TanStack Start
- Vite and Cloudflare Workers
- Tailwind CSS 4, shadcn/ui, and React Aria Components
- PostgreSQL, Prisma 7, `pg`, and Cloudflare Hyperdrive
- Vitest and Playwright

## Requirements

- Node.js 22+
- pnpm
- A PostgreSQL database

## Local Development

Install dependencies, create your local environment file, generate the Prisma client, apply migrations, and start the development server:

```bash
pnpm install
cp .env.example .env
pnpm run db:generate
pnpm run db:deploy
pnpm run dev
```

The site is available at [http://localhost:3000](http://localhost:3000).

`pnpm run dev` sets `CLOUDFLARE_PREVIEW_BUILD=true`, which makes `cloudflare.config.ts` resolve its `ctx.isPreview` branch locally. That branch declares `E2E_PASSWORD`, so the E2E endpoints exist and the local server matches the Worker Previews CI tests against.

## Environment Variables

Set these values in `.env`:

| Variable                                                   | Purpose                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SESSION_SECRET`                                           | At least 32 characters. Seals the session cookie; use a distinct value per environment. |
| `ADMIN_PASSWORD_HASH`                                      | bcrypt hash of the password for the admin login.                                        |
| `DATABASE_URL`                                             | Direct PostgreSQL connection string for Prisma CLI commands only.                       |
| `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` | Direct PostgreSQL connection string for local Worker development.                       |
| `BASE_URL`                                                 | Base URL for Playwright tests. Defaults to `http://localhost:3000`.                     |
| `E2E_PASSWORD`                                             | Plaintext admin password for local E2E tests; it must match `ADMIN_PASSWORD_HASH`.      |

Use `.env.example` as the source of truth for the local environment template. Deployed Workers use the `HYPERDRIVE` binding rather than a database URL; production and preview configurations target separate databases.

## Project Structure

```text
src/
  app/            Domain services for auth, finance, infrastructure, and E2E fixtures
  components/     Shared UI components
  routes/         TanStack Start file-based routes
    (public)/     Homepage, login, and public configuration pages
    (authed)/     Protected finance dashboard and transaction management
  styles.css      Global Tailwind theme tokens and styles
prisma/           Prisma schema and committed database migrations
```

## Database

The project uses Prisma with PostgreSQL. Workers connect through Cloudflare Hyperdrive; Prisma CLI commands connect directly through `DATABASE_URL`. Generate the client after dependency or schema changes, then use the appropriate migration command for the environment.

```bash
# Generate Prisma client and Zod schemas
pnpm run db:generate

# Create and apply a development migration
pnpm run db:migrate

# Apply committed migrations
pnpm run db:deploy

# Validate the schema, push a schema directly, or inspect the database
pnpm run db:check
pnpm run db:push
pnpm run db:studio
```

## Quality Checks

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test
```

Run E2E tests against a running local server:

```bash
pnpm run dev
pnpm run test:e2e
```

## Build And Deploy

Create a production build locally:

```bash
pnpm run build
```

Deploy the Worker to production:

```bash
pnpm run deploy
```

Create or update a Preview for the current branch:

```bash
pnpm run preview:deploy
```

The Preview name defaults to the current git branch; pass it positionally to override it:

```bash
pnpm run preview:deploy pr-123
```

Preview bindings live in the `ctx.isPreview` branch of `cloudflare.config.ts`. `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` are declared with `bindings.secret()` in both branches, but their values live on the Cloudflare account rather than in the config file. Set one with:

```bash
pnpm exec cf workers secrets update SESSION_SECRET --worker website --text <value>
```

Check what is registered:

```bash
pnpm exec cf workers secrets list --worker website
```

`E2E_PASSWORD` is declared in the Preview branch only — a declared secret has to be set on the Worker or the deploy is refused, and the E2E suite never runs against production. Without it a Preview still deploys, but `/api/e2e` answers 404 and the E2E suite cannot seed fixtures.

Delete a Preview — the Worker name is the Preview name plus the `-website` suffix:

```bash
pnpm run preview:delete pr-123-website
```

Previews are not deleted automatically — CI removes its own `pr-<number>` Previews when a pull request closes, but anything you deploy by hand stays up until you delete it. Previews carry their own secrets and are public while they exist, so treat a live one as a real deployment.

The Worker configuration, custom domain, KV-backed rate limiting, cron trigger, and observability settings are defined in `cloudflare.config.ts`.
