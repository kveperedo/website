---
name: create-backend-module
description: Procedure for adding or extending a backend module under `src/app`. Use when adding server-side logic, database operations, TanStack Start server functions, protected endpoints, Zod schemas, or a new business domain.
---

# Create a backend module

Read `src/app/README.md` first. It is the source of truth for the layout, layer suffixes,
repository scope, dependency direction, and NestJS parity. This skill is the step-by-step
procedure; do not restate or diverge from the README.

## Procedure

1. **Choose the domain.** Reuse an existing folder under `src/app/`. Create a new one only when the
   feature owns a new business concept, and do not add empty `shared/` folders.

2. **Define the input contract.** Add a `*.schema.ts` with the Zod schema and its inferred input
   type. Keep Prisma imports out of it so route components can import it.

3. **Write the repository.** Only if the domain owns a table. Reads call `getDb()`; writes accept a
   `DbTransactionClient`. Convert `Decimal` fields with `.toNumber()` before returning.

4. **Write the service.** A plain async function, no `createServerFn`, no Prisma. Open a
   transaction with `withTransaction` when the workflow spans writes, and pass the client down.

5. **Expose the server function.** Add it to `*.functions.ts` with middleware and a validator.
   Reads omit the method; mutations use `{ method: "POST" }`.

6. **Wire the route.** Import the exported `*Fn` from `*.functions.ts`, never the service.

7. **Test and verify.** Colocate `*.test.ts`, then run `pnpm run checks`.

## Repository

```ts
import type { Prisma } from "@/generated/prisma/client";

import { getDb, type DbTransactionClient } from "@/app/infra/database/client.server";

export const findById = async (id: string) => {
  const transaction = await getDb().transaction.findUniqueOrThrow({ where: { id } });

  return { ...transaction, amount: transaction.amount.toNumber() };
};

export const create = async (
  db: DbTransactionClient,
  data: Prisma.TransactionUncheckedCreateInput,
) => {
  const transaction = await db.transaction.create({ data });

  return { ...transaction, amount: transaction.amount.toNumber() };
};
```

## Service

```ts
import { withTransaction } from "@/app/infra/database/client.server";

import { create, findById } from "./transactions.repository.server";

export const getTransaction = async (id: string) => {
  return await findById(id);
};

export const createTransaction = async (data: CreateTransactionInput) => {
  return await withTransaction((tx) => create(tx, data));
};
```

## Server function

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authMiddleware } from "@/app/auth/auth.middleware";
import { createRateLimitMiddleware } from "@/app/infra/rate-limit/rate-limit.middleware";
import { CreateTransactionSchema } from "./transactions.schema";
import { createTransaction, getTransaction } from "./transactions.service.server";

export const getTransactionFn = createServerFn()
  .middleware([authMiddleware])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await getTransaction(data);
  });

export const createTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(CreateTransactionSchema)
  .handler(async ({ data }) => {
    return await createTransaction(data);
  });
```

Use `.handler(serviceFn)` when no validator or argument mapping is needed; keep the lambda when
there is something to adapt.

## Checklist

- [ ] Domain folder chosen; no speculative `shared/` folder.
- [ ] Schema and inferred types live in `*.schema.ts`.
- [ ] Repository owns Prisma and converts `Decimal`.
- [ ] Service is plain async, Prisma-free, and uses `withTransaction` for multi-write work.
- [ ] `createServerFn` appears only in `*.functions.ts`; exports end with `Fn`.
- [ ] Mutations use `{ method: "POST" }`, `authMiddleware`, and a rate limit where appropriate.
- [ ] Validators feed `{ data }`; reads omit the method.
- [ ] `.server.` suffix kept on persistence, session, and server-only modules.
- [ ] No barrels; cross-domain imports go through a service or schema.
- [ ] Tests are colocated and mock repositories rather than `getDb`.
- [ ] `pnpm run checks` passes.
