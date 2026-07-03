import { env } from "cloudflare:workers";
import { setDate, setHours, startOfMonth } from "date-fns";

import { getDb } from "@/db/client";

export function isE2EAvailable() {
  return !!env.E2E_PASSWORD;
}

export function requireE2EAvailable() {
  if (!isE2EAvailable()) {
    throw new Error("Operation not permitted");
  }
}

export async function resetTestData() {
  await getDb().transaction.deleteMany();
}

export async function seedTestData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const at = (day: number, hour = 9) => setHours(setDate(monthStart, day), hour);

  const db = getDb();
  await Promise.all([
    db.transaction.create({
      data: {
        description: "Salary",
        amount: 45000.0,
        type: "income",
        transactedAt: at(1),
      },
    }),
    db.transaction.create({
      data: {
        description: "Groceries run",
        amount: 1500.0,
        type: "expense",
        category: "groceries_household",
        transactedAt: at(2),
      },
    }),
    db.transaction.create({
      data: {
        description: "Client dinner",
        amount: 850.0,
        type: "expense",
        category: "food_drinks",
        transactedAt: at(5),
      },
    }),
  ]);
}
