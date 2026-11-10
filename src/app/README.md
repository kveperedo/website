# Backend modules

`src/app/` is organized by business domain, not by technical layer at the top. Each domain owns
its HTTP boundary, business rules, and persistence, and exposes only what another domain needs.

For the step-by-step procedure when adding or extending a module, see
`.agents/skills/create-backend-module/SKILL.md`.

```text
src/app/
├── ai/                       ai.service.server.ts
├── auth/                     auth.{functions,schema,types,middleware,service.server,session.server}
├── e2e/                      e2e.{functions,service.server}
├── finance/
│   ├── analytics/            analytics.{functions,service.server,repository.server,types}
│   ├── preferences/          preferences.{functions,service.server,repository.server}
│   ├── scheduled/            scheduled.{functions,schema,service.server,repository.server}
│   ├── shared/               local-date, month-query.schema, transaction-filters
│   └── transactions/         transactions.{functions,schema,types,parse,service.server,
│                             repository.server,classification.server,memory.repository.server}
├── infra/
│   ├── cache/                cache-control
│   ├── database/             client.server (getDb + withTransaction)
│   ├── logging/              logging.middleware
│   └── rate-limit/           rate-limit.{middleware,service.server,error}
└── README.md
```

## Layer suffixes

| Suffix                       | Role                                                       | Client-safe? |
| ---------------------------- | ---------------------------------------------------------- | ------------ |
| `*.functions.ts`             | `createServerFn` transport: middleware, validator, handler | yes          |
| `*.schema.ts`                | Zod input/output schemas and inferred DTOs                 | yes          |
| `*.types.ts`                 | Shared domain types                                        | yes          |
| `*.parse.ts`                 | Pure browser-side parsing                                  | yes          |
| `*.middleware.ts`            | Request middleware (auth, rate limit, logging)             | yes          |
| `*.service.server.ts`        | Business rules and orchestration; no Prisma                | no           |
| `*.repository.server.ts`     | Persistence; the only layer that issues Prisma queries     | no           |
| `*.session.server.ts`        | Session store (auth only)                                  | no           |
| `*.classification.server.ts` | Domain logic with external model calls (transactions only) | no           |

`*.server.*` is not decoration. TanStack Start refuses to bundle a `**/*.server.*` module into a
client route, so a stray import fails the build instead of leaking `getDb`, secrets, or Node-only
APIs into the browser. Keep `.server.` on every module that touches persistence, sessions, or
server-only bindings.

`src/app/` holds domain logic, not presentation. Pure UI helpers—percentage math, label formatting
for one card, view-model shaping—belong in the route group's `-common/` beside their component.
Client-safe domain logic (schemas, transaction parsing) can stay here.

## Where server functions live

`createServerFn` lives only in `*.functions.ts`. A service is a plain async function because cron
(`src/cloudflare/scheduler.ts`), Vitest, and E2E seeding call the same code without a request
context. The transport layer owns auth middleware, rate limits, and Zod validators; the service
owns behavior.

Use the shorthand when there is nothing to adapt:

```ts
export const getRecentTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getRecentTransactions);
```

Keep an explicit lambda when a validator feeds the service, when arguments need mapping, or when
the service takes a parameter the handler context must not supply (`getFinanceDashboard`'s `now`).

## Repository scope

One repository per domain that owns persistence. A service may import several repositories when a
workflow spans tables, but only repositories call Prisma. `getDb` belongs in repositories,
`infra/`, and the E2E harness—not in services or routes.

Two deliberate exceptions:

- **auth** has no user table. `auth.session.server.ts` is the persistence boundary; a repository
  would only wrap iron-session.
- **e2e** is a test harness, not a business domain. It gets the service rename and no repository.

`transactions.repository.server.ts` owns the `Transaction` table even when a scheduled workflow
writes to it. `scheduled.repository.server.ts` owns `ScheduledTransactionTemplate`.
`transactions.memory.repository.server.ts` owns the in-memory classification cache and its
embedding calls.

## Dependency direction

```text
*.functions -> *.service --> *.repository
                       --> *.classification --> memory.repository
                       --> scheduled.service --> scheduled.repository
                                             --> transactions.repository
```

The graph is one-way and has no service cycle. Cross-domain imports go through
`*.service.server.ts` or `*.schema.ts`; do not import another domain's functions or internal
helpers. There is one documented exception: `scheduled.service.server.ts` imports
`transactions.repository.server.ts` because `transactions.service.server.ts` already depends on
the scheduled service, so routing through the transactions service would create a cycle. There are
no barrel files—import the exact module.

Start a Prisma transaction at the workflow boundary with `withTransaction` from
`infra/database/client.server.ts` and pass the transaction client down to repository writes. A
repository read that is not part of a workflow can call `getDb()` itself.

## NestJS parity

The layering follows NestJS concepts without its runtime:

| NestJS      | Here                               |
| ----------- | ---------------------------------- |
| module      | a folder under `src/app/<domain>/` |
| controller  | `*.functions.ts`                   |
| service     | `*.service.server.ts`              |
| repository  | `*.repository.server.ts`           |
| DTO         | `*.schema.ts`, `*.types.ts`        |
| guard       | `authMiddleware`                   |
| pipe        | `.validator(...)`                  |
| interceptor | `serverFunctionLoggingMiddleware`  |

Deliberately not used: dependency injection, decorators, classes-as-modules, lifecycle hooks, and
Swagger. The project is small enough that explicit imports are clearer, and TanStack Start already
provides the request pipeline.
