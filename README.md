# Kevin Von Erich Peredo Website

This is my website, built as a flexible foundation for tools, pages, and features I use day to day.

This project currently includes a personal-facing home experience and continues to evolve over time.

## About This App

I build practical, user-focused software with strong attention to frontend experience and maintainable code.

This project serves as a central place to share my work, background, and ongoing updates.

## Tech Stack

- React
- TanStack Start
- Tailwind
- Vite
- TypeScript
- Prisma ORM
- PostgreSQL

## Project Structure

- src/routes: file-based routes and page composition
- src/routes/index: current landing page and core sections
- src/styles.css: global styles, theme tokens, and custom utilities
- public: static assets used by the app

## Getting Started

Install dependencies and run the app locally:

npm install
npm run dev

## Environment Variables

Create a local `.env` file with these required values:

- `SESSION_SECRET`: a long random secret used to sign the session cookie
- `ADMIN_PASSWORD_HASH`: a bcrypt hash of the admin password used by the login flow
- `DATABASE_URL`: PostgreSQL connection string used by Prisma ORM

The repo includes `.env.example` as a reference.

If you need a bcrypt hash, generate one with a small Node script or any bcrypt CLI utility before starting the app.

## Database (Prisma ORM)

Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Useful DB commands:

```bash
npm run db:check
npm run db:push
npm run db:deploy
npm run db:studio
```

Notes:

- `db:generate` generates the Prisma client into `src/generated/prisma`.
- `db:migrate` creates and applies development migrations from `prisma/schema.prisma`.
- `db:deploy` applies committed migrations in production.
- `db:studio` opens Prisma Studio for browsing tables and rows.
- Run DB migrations as a separate deployment step, not inside `npm run build`.

## Build For Production

Create a production build:

npm run build

## Run Tests

Run the test suite:

npm run test
