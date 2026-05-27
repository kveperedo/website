import * as p from "drizzle-orm/pg-core";

export const expensesCategoryEnum = p.pgEnum("expenses_categories", [
  "food_drinks",
  "groceries_household",
  "transportation",
  "bills_utilities",
  "health_wellness",
  "hobbies_lifestyle",
  "financial",
]);

export const expensesTable = p.pgTable("expenses", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  description: p.text("description").notNull(),
  amount: p.numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: expensesCategoryEnum("category").notNull(),
  createdAt: p.timestamp("created_at").notNull().defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});
