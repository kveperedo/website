import { PrismaNeon } from "@prisma/adapter-neon";

import { Prisma, PrismaClient } from "../../src/generated/prisma/client";

let _db: PrismaClient | null = null;

function getDb(): PrismaClient {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const adapter = new PrismaNeon({ connectionString });
    _db = new PrismaClient({ adapter });
  }
  return _db;
}

export async function resetDatabase() {
  const db = getDb();
  await db.transaction.deleteMany({});
  await db.$disconnect();
  _db = null;
}

export async function seedDatabase() {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const at = (day: number, hour = 9) =>
    new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour);

  await db.transaction.deleteMany({});
  await db.transaction.createMany({
    data: [
      {
        description: "Salary",
        amount: new Prisma.Decimal("45000.00"),
        type: "income",
        category: null,
        transactedAt: at(1),
      },
      {
        description: "Groceries run",
        amount: new Prisma.Decimal("1500.00"),
        type: "expense",
        category: "groceries_household",
        transactedAt: at(2),
      },
      {
        description: "Client dinner",
        amount: new Prisma.Decimal("850.00"),
        type: "expense",
        category: "food_drinks",
        transactedAt: at(5),
      },
    ],
  });
  await db.$disconnect();
  _db = null;
}
