/*
  Warnings:

  - Added the required column `transacted_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add column as nullable first
ALTER TABLE "transactions" ADD COLUMN "transacted_at" TIMESTAMP(6);

-- Backfill existing rows using created_at as the transacted_at value
UPDATE "transactions" SET "transacted_at" = "created_at";

-- Now make it NOT NULL
ALTER TABLE "transactions" ALTER COLUMN "transacted_at" SET NOT NULL;
