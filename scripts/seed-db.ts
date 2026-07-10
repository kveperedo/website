import { Prisma } from "../src/generated/prisma/client";
import { createDbClient } from "./db-utils";

const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const at = (day: number, hour = 9) =>
  new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour);

const seed = [
  {
    description: "Salary",
    amount: new Prisma.Decimal("45000.00"),
    type: "income" as const,
    category: null,
    transactedAt: at(1),
  },
  {
    description: "Groceries run",
    amount: new Prisma.Decimal("1500.00"),
    type: "expense" as const,
    category: "groceries_household" as const,
    transactedAt: at(2),
  },
  {
    description: "Client dinner",
    amount: new Prisma.Decimal("850.00"),
    type: "expense" as const,
    category: "food_drinks" as const,
    transactedAt: at(5),
  },
];

const db = createDbClient();

await db.transaction.deleteMany({});
await db.transaction.createMany({ data: seed });

await db.$disconnect();
