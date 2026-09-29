-- Enable pgvector for transaction memory embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "transaction_memories" (
    "id" UUID NOT NULL,
    "normalized_description" TEXT NOT NULL,
    "embedding" vector(1536),
    "type" "transaction_types" NOT NULL DEFAULT 'expense',
    "category" "transaction_categories",
    "use_count" INTEGER NOT NULL DEFAULT 1,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_memories_normalized_description_key" ON "transaction_memories"("normalized_description");
CREATE INDEX "transaction_memories_embedding_idx" ON "transaction_memories" USING hnsw ("embedding" vector_cosine_ops);
