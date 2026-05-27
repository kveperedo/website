-- CreateEnum
CREATE TYPE "expenses_categories" AS ENUM ('food_drinks', 'groceries_household', 'transportation', 'bills_utilities', 'health_wellness', 'hobbies_lifestyle', 'financial');

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "expenses_categories" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);
