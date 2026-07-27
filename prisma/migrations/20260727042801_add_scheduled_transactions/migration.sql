/*
  Warnings:

  - A unique constraint covering the columns `[template_id,transacted_at]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "template_id" UUID;

-- CreateTable
CREATE TABLE "scheduled_transaction_templates" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "transaction_types" NOT NULL DEFAULT 'expense',
    "category" "transaction_categories",
    "day_of_month" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "max_occurrences" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_transaction_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduled_transaction_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_transaction_templates_source_transaction_id_key" ON "scheduled_transaction_templates"("source_transaction_id");

-- CreateIndex
CREATE INDEX "scheduled_transaction_templates_is_active_idx" ON "scheduled_transaction_templates"("is_active");

-- CreateIndex
CREATE INDEX "transactions_template_id_idx" ON "transactions"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_template_id_transacted_at_key" ON "transactions"("template_id", "transacted_at");

-- AddForeignKey
ALTER TABLE "scheduled_transaction_templates" ADD CONSTRAINT "scheduled_transaction_templates_source_transaction_id_fkey" FOREIGN KEY ("source_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "scheduled_transaction_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
