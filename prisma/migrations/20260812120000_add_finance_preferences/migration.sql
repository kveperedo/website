-- CreateTable
CREATE TABLE "finance_preferences" (
    "id" TEXT NOT NULL,
    "category_trends_visible_categories" "transaction_categories"[] NOT NULL DEFAULT ARRAY[]::"transaction_categories"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "finance_preferences_pkey" PRIMARY KEY ("id")
);
