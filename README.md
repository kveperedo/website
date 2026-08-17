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
- npm
- A PostgreSQL database

## Local Development

Install dependencies, create your local environment file, generate the Prisma client, apply migrations, and start the development server:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run dev
```

The site is available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these values in `.env`:

| Variable                                                   | Purpose                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `SESSION_SECRET`                                           | Long, random secret used to sign session cookies.                                  |
| `ADMIN_PASSWORD_HASH`                                      | bcrypt hash of the password for the admin login.                                   |
| `DATABASE_URL`                                             | Direct PostgreSQL connection string for Prisma CLI commands only.                  |
| `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` | Direct PostgreSQL connection string for local Worker development.                  |
| `OPENAI_API_KEY`                                           | OpenAI API key for AI-powered features.                                            |
| `BASE_URL`                                                 | Base URL for Playwright tests. Defaults to `http://localhost:3000`.                |
| `E2E_PASSWORD`                                             | Plaintext admin password for local E2E tests; it must match `ADMIN_PASSWORD_HASH`. |

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
npm run db:generate

# Create and apply a development migration
npm run db:migrate

# Apply committed migrations
npm run db:deploy

# Validate the schema, push a schema directly, or inspect the database
npm run db:check
npm run db:push
npm run db:studio
```

## Quality Checks

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
```

Run E2E tests against a running local server:

```bash
npm run dev
npm run test:e2e
```

## Build And Deploy

Create a production build locally:

```bash
npm run build
```

Deploy the Worker to production:

```bash
npm run deploy
```

Create an aliased preview deployment:

```bash
npm run deploy:preview -- "pr-<slug>"
```

The Worker configuration, custom domain, KV-backed rate limiting, cron trigger, and observability settings are defined in `wrangler.jsonc`.
