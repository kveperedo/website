import { env } from "cloudflare:workers";
import {
  addDays,
  addHours,
  addMonths,
  getDaysInMonth,
  setDate,
  setHours,
  startOfMonth,
} from "date-fns";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { getDb, type DbTransactionClient } from "@/db/client";

import { getCurrentYearMonth, startOfLocalMonth } from "../finance/local-date";

export type NetCardScenario = "below-pace" | "no-history" | "on-pace" | "over-income";

export function isE2EAvailable() {
  return !!env.E2E_PASSWORD;
}

export function requireE2EAvailable() {
  if (!isE2EAvailable()) {
    throw new Error("Operation not permitted");
  }
}

async function clearTestData(db: DbTransactionClient) {
  await db.scheduledTransactionTemplate.deleteMany();
  await db.transaction.deleteMany();
  await db.financePreferences.deleteMany({ where: { id: "default" } });
}

export async function resetTestData() {
  await getDb().$transaction(clearTestData);
}

export async function seedTestData(scenario?: NetCardScenario) {
  await getDb().$transaction(async (db) => {
    await clearTestData(db);
    if (scenario) {
      await seedNetCardTestData(db, scenario);
      return;
    }

    await seedDefaultTestData(db);
  });
}

async function seedDefaultTestData(db: DbTransactionClient) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(addMonths(now, 1));
  const at = (day: number, hour = 9) => setHours(setDate(monthStart, day), hour);
  const hasUpcomingCurrentMonth = now.getDate() < getDaysInMonth(now);
  const upcomingDay = hasUpcomingCurrentMonth ? now.getDate() + 1 : now.getDate();

  await db.transaction.createMany({
    data: [
      {
        description: "Salary",
        amount: 45000.0,
        type: "income",
        transactedAt: at(1),
      },
      {
        description: "Groceries run",
        amount: 1500.0,
        type: "expense",
        category: "groceries_household",
        transactedAt: at(2),
      },
      {
        description: "Client dinner",
        amount: 850.0,
        type: "expense",
        category: "food_drinks",
        transactedAt: at(5),
      },
    ],
  });

  const dueScheduleDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, today.getUTCDate()),
  );
  const template = await db.scheduledTransactionTemplate.create({
    data: {
      description: "Disney+ subscription",
      amount: 750.0,
      type: "expense",
      category: "bills_utilities",
      dayOfMonth: today.getUTCDate(),
      startDate: dueScheduleDate,
      maxOccurrences: 2,
      isActive: false,
    },
  });
  await db.transaction.createMany({
    data: [
      {
        description: template.description,
        amount: 750.0,
        type: "expense",
        category: "bills_utilities",
        transactedAt: dueScheduleDate,
        templateId: template.id,
      },
      {
        description: template.description,
        amount: 750.0,
        type: "expense",
        category: "bills_utilities",
        transactedAt: today,
        templateId: template.id,
      },
    ],
  });
  await db.scheduledTransactionTemplate.update({
    where: { id: template.id },
    data: { isActive: true },
  });

  await db.scheduledTransactionTemplate.create({
    data: {
      description: "Spotify subscription",
      amount: 320.0,
      type: "expense",
      category: "bills_utilities",
      dayOfMonth: 1,
      startDate: nextMonthStart,
    },
  });
  const recordedTemplate = await db.scheduledTransactionTemplate.create({
    data: {
      description: "Google One storage",
      amount: 180.0,
      type: "expense",
      category: "bills_utilities",
      dayOfMonth: upcomingDay,
      startDate: monthStart,
    },
  });

  await db.transaction.create({
    data: {
      description: recordedTemplate.description,
      amount: 180.0,
      type: "expense",
      category: "bills_utilities",
      transactedAt: at(upcomingDay),
      templateId: recordedTemplate.id,
    },
  });

  if (hasUpcomingCurrentMonth) {
    await db.scheduledTransactionTemplate.create({
      data: {
        description: "Internet bill",
        amount: 240.0,
        type: "expense",
        category: "bills_utilities",
        dayOfMonth: upcomingDay,
        startDate: monthStart,
      },
    });
  }
}

async function seedNetCardTestData(db: DbTransactionClient, scenario: NetCardScenario) {
  const { year, month } = getCurrentYearMonth();
  const currentMonthStart = startOfLocalMonth(year, month);
  const priorMonthStart = startOfLocalMonth(year, month - 1);
  const at = (monthStart: Date, day: number) => addHours(addDays(monthStart, day - 1), 9);

  const currentTransactions =
    scenario === "over-income"
      ? [{ description: "Expense only", amount: 1200, type: "expense" as const }]
      : [
          { description: "Income", amount: 1000, type: "income" as const },
          {
            description: "Current expense",
            amount: scenario === "below-pace" || scenario === "no-history" ? 100 : 500,
            type: "expense" as const,
          },
        ];

  await db.transaction.createMany({
    data: [
      ...currentTransactions.map((transaction) => ({
        ...transaction,
        transactedAt: at(currentMonthStart, 1),
      })),
      ...(scenario !== "over-income" && scenario !== "no-history"
        ? [
            {
              description: "Historical expense",
              amount: 500,
              type: "expense" as const,
              transactedAt: at(priorMonthStart, 1),
            },
          ]
        : []),
    ],
  });
}

export async function seedTrendsTestData() {
  const { year, month } = getCurrentYearMonth();
  const at = (monthOffset: number, day: number) =>
    addHours(addDays(startOfLocalMonth(year, month + monthOffset), day - 1), 12);

  const trendsData: Array<{
    description: string;
    amount: number;
    category: TransactionCategory;
    monthOffset: number;
    day: number;
  }> = [
    // 6 months ago — groceries low, food low, transport high
    {
      description: "Groceries run",
      amount: 1800,
      category: "groceries_household",
      monthOffset: -5,
      day: 3,
    },
    {
      description: "Market veggies",
      amount: 650,
      category: "groceries_household",
      monthOffset: -5,
      day: 18,
    },
    { description: "Lunch out", amount: 450, category: "food_drinks", monthOffset: -5, day: 7 },
    { description: "Coffee", amount: 180, category: "food_drinks", monthOffset: -5, day: 14 },
    {
      description: "Jeepney fare",
      amount: 320,
      category: "transportation",
      monthOffset: -5,
      day: 5,
    },
    {
      description: "Gas top-up",
      amount: 2800,
      category: "transportation",
      monthOffset: -5,
      day: 20,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: -5,
      day: 10,
    },

    // 5 months ago
    {
      description: "Groceries run",
      amount: 2000,
      category: "groceries_household",
      monthOffset: -4,
      day: 4,
    },
    {
      description: "Market run",
      amount: 700,
      category: "groceries_household",
      monthOffset: -4,
      day: 20,
    },
    { description: "Dinner out", amount: 650, category: "food_drinks", monthOffset: -4, day: 9 },
    { description: "Snacks", amount: 250, category: "food_drinks", monthOffset: -4, day: 22 },
    {
      description: "Jeepney fare",
      amount: 280,
      category: "transportation",
      monthOffset: -4,
      day: 6,
    },
    {
      description: "Gas top-up",
      amount: 2500,
      category: "transportation",
      monthOffset: -4,
      day: 18,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: -4,
      day: 10,
    },

    // 4 months ago
    {
      description: "Groceries run",
      amount: 2500,
      category: "groceries_household",
      monthOffset: -3,
      day: 2,
    },
    {
      description: "Market veggies",
      amount: 850,
      category: "groceries_household",
      monthOffset: -3,
      day: 16,
    },
    {
      description: "Restaurant dinner",
      amount: 900,
      category: "food_drinks",
      monthOffset: -3,
      day: 8,
    },
    { description: "Coffee runs", amount: 350, category: "food_drinks", monthOffset: -3, day: 15 },
    {
      description: "Jeepney fare",
      amount: 240,
      category: "transportation",
      monthOffset: -3,
      day: 7,
    },
    {
      description: "Gas top-up",
      amount: 2200,
      category: "transportation",
      monthOffset: -3,
      day: 19,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: -3,
      day: 10,
    },

    // 3 months ago — groceries climbing, food climbing, transport dropping
    {
      description: "Groceries run",
      amount: 3000,
      category: "groceries_household",
      monthOffset: -2,
      day: 3,
    },
    {
      description: "Market haul",
      amount: 1100,
      category: "groceries_household",
      monthOffset: -2,
      day: 17,
    },
    {
      description: "Takeout meals",
      amount: 1200,
      category: "food_drinks",
      monthOffset: -2,
      day: 6,
    },
    {
      description: "Coffee & snacks",
      amount: 500,
      category: "food_drinks",
      monthOffset: -2,
      day: 14,
    },
    { description: "Grab ride", amount: 180, category: "transportation", monthOffset: -2, day: 9 },
    {
      description: "Gas top-up",
      amount: 1800,
      category: "transportation",
      monthOffset: -2,
      day: 21,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: -2,
      day: 10,
    },

    // 2 months ago
    {
      description: "Groceries run",
      amount: 3400,
      category: "groceries_household",
      monthOffset: -1,
      day: 5,
    },
    {
      description: "Market haul",
      amount: 1300,
      category: "groceries_household",
      monthOffset: -1,
      day: 19,
    },
    {
      description: "Restaurant dinner",
      amount: 1500,
      category: "food_drinks",
      monthOffset: -1,
      day: 8,
    },
    {
      description: "Food delivery",
      amount: 650,
      category: "food_drinks",
      monthOffset: -1,
      day: 16,
    },
    { description: "Grab ride", amount: 150, category: "transportation", monthOffset: -1, day: 11 },
    {
      description: "Gas top-up",
      amount: 1500,
      category: "transportation",
      monthOffset: -1,
      day: 22,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: -1,
      day: 10,
    },

    // current month — groceries highest, food highest, transport lowest
    {
      description: "Groceries run",
      amount: 3800,
      category: "groceries_household",
      monthOffset: 0,
      day: 1,
    },
    {
      description: "Market haul",
      amount: 1500,
      category: "groceries_household",
      monthOffset: 0,
      day: 18,
    },
    { description: "Food trip", amount: 1800, category: "food_drinks", monthOffset: 0, day: 7 },
    {
      description: "Coffee & brunch",
      amount: 750,
      category: "food_drinks",
      monthOffset: 0,
      day: 15,
    },
    {
      description: "Jeepney fare",
      amount: 120,
      category: "transportation",
      monthOffset: 0,
      day: 10,
    },
    {
      description: "Gas top-up",
      amount: 1200,
      category: "transportation",
      monthOffset: 0,
      day: 20,
    },
    {
      description: "Internet bill",
      amount: 1500,
      category: "bills_utilities",
      monthOffset: 0,
      day: 10,
    },
  ];

  const netIncomeData = [
    { description: "March income", amount: 10_000.01, monthOffset: -5 },
    { description: "April income", amount: 7_880, monthOffset: -4 },
  ];

  await getDb().$transaction(async (db) => {
    await clearTestData(db);
    await db.transaction.createMany({
      data: [
        ...trendsData.map((item) => ({
          description: item.description,
          amount: item.amount,
          type: "expense" as const,
          category: item.category,
          transactedAt: at(item.monthOffset, item.day),
        })),
        ...netIncomeData.map((item) => ({
          description: item.description,
          amount: item.amount,
          type: "income" as const,
          transactedAt: at(item.monthOffset, 1),
        })),
      ],
    });
  });
}
