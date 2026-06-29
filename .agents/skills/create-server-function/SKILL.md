---
name: create-server-function
description: Creation of server functions under `src/utils`. Use when: (1) Adding new server-side logic or database operations, (2) Creating TanStack Start server function wrappers accessible from route components
---

# Overview

Server-side logic is split across two co-located files per domain. Never mix raw DB/auth logic with `createServerFn` wrappers in the same file.

# File Location

All server function files live under `src/utils/`. No barrel files.

# File Naming

Use the domain name in kebab-case as the base:

- `<domain>.server.ts` — raw database/auth logic, never imported by the client
- `<domain>.function.ts` — `createServerFn` wrappers, safe to import from route components

Example: `transactions.server.ts` and `transactions.function.ts`.

# General

All exports should be named exports.

# `*.server.ts` — Server Logic File

Contains raw async functions that interact with the database or other server-only resources. No `createServerFn` here.

- Import the Prisma client from `#/db/client`
- Prisma `Decimal` fields must be converted with `.toNumber()` before returning
- Import env vars via `requireEnv` from `#/lib/env`

```ts
import { db } from "#/db/client";

export const getTransactions = async () => {
  const transactions = await db.transaction.findMany();

  return transactions.map((transaction) => ({
    ...transaction,
    amount: transaction.amount.toNumber(),
  }));
};
```

# `*.function.ts` — Server Function Wrapper File

Contains `createServerFn` wrappers that call the corresponding `*.server.ts` functions.

- Import `createServerFn` from `@tanstack/react-start`
- Validate input with `zod` via `.inputValidator(schema)` when the function accepts arguments
- Destructure validated input from `{ data }` in the handler
- Apply `authMiddleware` via `.middleware([authMiddleware])` for any protected function; import it from `./auth.middleware`
- Specify `{ method: "POST" }` for all mutations (create / update / delete); omit for reads (GET is the default)
- Suffix all exported function names with `Fn` (e.g. `getTransactionsFn`)

```ts
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { authMiddleware } from "./auth.middleware";
import { createTransaction, getTransactions } from "./transactions.server";

// Protected read — GET is the default, no method option needed
export const getTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getTransactions();
  });

// Protected mutation — always specify POST
export const createTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ description: z.string(), amount: z.number() }))
  .handler(async ({ data }) => {
    return await createTransaction(data);
  });
```

# Auth Middleware

Import `authMiddleware` from `./auth.middleware` to protect server functions. Always use `.middleware([authMiddleware])` instead of manually calling `requireSession` inside the handler.

# Method Convention

| Scenario | Method |
|---|---|
| Read / query | Omit — `GET` is the default |
| Mutation (create / update / delete) | Always specify `{ method: "POST" }` |
