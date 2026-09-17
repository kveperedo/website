-- CreateEnum
CREATE TYPE "scheduled_transaction_status" AS ENUM ('active', 'paused', 'archived');

-- AlterTable
ALTER TABLE "scheduled_transaction_templates" ADD COLUMN "status" "scheduled_transaction_status" NOT NULL DEFAULT 'active';
ALTER TABLE "scheduled_transaction_templates" ADD COLUMN "archived_at" TIMESTAMPTZ(6);

-- Backfill status from is_active
UPDATE "scheduled_transaction_templates" SET "status" = CASE WHEN "is_active" THEN 'active'::"scheduled_transaction_status" ELSE 'paused'::"scheduled_transaction_status" END;

-- Backfill already-finished to archived
UPDATE "scheduled_transaction_templates" t SET "status" = 'archived'::"scheduled_transaction_status", "archived_at" = NOW()
WHERE (
  t."end_date" IS NOT NULL AND t."end_date" < (NOW() AT TIME ZONE 'UTC')::date
) OR (
  t."max_occurrences" IS NOT NULL AND (
    SELECT COUNT(*) FROM "transactions" tx WHERE tx."template_id" = t."id"
  ) >= t."max_occurrences"
);

-- Drop old index and column
DROP INDEX "scheduled_transaction_templates_is_active_idx";
ALTER TABLE "scheduled_transaction_templates" DROP COLUMN "is_active";

-- CreateIndex
CREATE INDEX "scheduled_transaction_templates_status_idx" ON "scheduled_transaction_templates"("status");
