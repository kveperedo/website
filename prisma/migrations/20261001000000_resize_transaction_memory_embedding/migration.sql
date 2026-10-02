-- qwen3-embedding-0.6b produces 1024-dim vectors; pgvector cannot cast
-- vector(1536) to vector(1024), so the column must be dropped and re-added.
-- Existing rows keep their exact-match categorization (type/category) with a
-- NULL embedding until each description is re-embedded on its next save.
DROP INDEX "transaction_memories_embedding_idx";

ALTER TABLE "transaction_memories" DROP COLUMN "embedding";

ALTER TABLE "transaction_memories" ADD COLUMN "embedding" vector(1024);

-- CreateIndex
CREATE INDEX "transaction_memories_embedding_idx" ON "transaction_memories" USING hnsw ("embedding" vector_cosine_ops);
