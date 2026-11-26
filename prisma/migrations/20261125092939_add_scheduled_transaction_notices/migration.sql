-- CreateTable
CREATE TABLE "scheduled_transaction_notices" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scheduled_transaction_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_transaction_notices_transaction_id_key" ON "scheduled_transaction_notices"("transaction_id");

-- CreateIndex
CREATE INDEX "scheduled_transaction_notices_is_acknowledged_idx" ON "scheduled_transaction_notices"("is_acknowledged");

-- AddForeignKey
ALTER TABLE "scheduled_transaction_notices" ADD CONSTRAINT "scheduled_transaction_notices_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
