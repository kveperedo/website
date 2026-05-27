import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "./auth.middleware";
import { getExpenses } from "./expenses.server";

export const getExpensesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getExpenses();
  });
