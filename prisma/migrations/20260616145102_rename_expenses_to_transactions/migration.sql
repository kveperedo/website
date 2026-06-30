/*
  Warnings:

  - You are about to drop the `expenses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "transaction_categories" AS ENUM ('food_drinks', 'groceries_household', 'transportation', 'bills_utilities', 'health_wellness', 'hobbies_lifestyle', 'financial');

-- CreateEnum
CREATE TYPE "transaction_types" AS ENUM ('expense', 'income');

-- DropTable
DROP TABLE "expenses";

-- DropEnum
DROP TYPE "expenses_categories";

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "transaction_types" NOT NULL DEFAULT 'expense',
    "category" "transaction_categories",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
