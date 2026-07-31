-- DropForeignKey
ALTER TABLE "scheduled_transaction_templates" DROP CONSTRAINT "scheduled_transaction_templates_source_transaction_id_fkey";

-- DropIndex
DROP INDEX "scheduled_transaction_templates_source_transaction_id_key";

-- AlterTable
ALTER TABLE "scheduled_transaction_templates" DROP COLUMN "source_transaction_id";
