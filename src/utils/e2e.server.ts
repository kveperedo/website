import { env } from "cloudflare:workers";
import { setDate, setHours, startOfMonth, subMonths } from "date-fns";

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
  const db = getDb();
  const [templates, transactions] = await Promise.all([
    db.scheduledTransactionTemplate.findMany({ select: { id: true } }),
    db.transaction.findMany({ select: { id: true } }),
  ]);

  await Promise.all(
    templates.map(({ id }) => db.scheduledTransactionTemplate.delete({ where: { id } })),
  );
  await Promise.all(transactions.map(({ id }) => db.transaction.delete({ where: { id } })));
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

  const dueScheduleDate = subMonths(now, 1);
  const template = await db.scheduledTransactionTemplate.create({
    data: {
      description: "E2E due scheduled transaction",
      amount: 750.0,
      type: "expense",
      category: "bills_utilities",
      dayOfMonth: now.getDate(),
      startDate: dueScheduleDate,
      maxOccurrences: 3,
    },
  });
  const sourceTransaction = await db.transaction.create({
    data: {
      description: template.description,
      amount: 750.0,
      type: "expense",
      category: "bills_utilities",
      transactedAt: dueScheduleDate,
      templateId: template.id,
    },
  });
  await db.scheduledTransactionTemplate.update({
    where: { id: template.id },
    data: { sourceTransactionId: sourceTransaction.id },
  });
}
