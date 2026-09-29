import OpenAI from "openai";

import type { Prisma } from "@/generated/prisma/client";
import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

import { getDb } from "@/db/client";

export const EMBEDDING_MODEL = "text-embedding-3-small";
/** Cosine distance below which a memory is auto-applied (≈ similarity > 0.85). */
export const MEMORY_MATCH_MAX_DISTANCE = 0.15;

type TransactionMemoryFields = Prisma.TransactionMemoryGetPayload<{
  select: { id: true; type: true; category: true };
}>;

export type TransactionMemoryMatch = TransactionMemoryFields & {
  distance: number;
};

export const normalizeTransactionDescription = (description: string): string =>
  description
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const toVectorLiteral = (embedding: Array<number>): string => `[${embedding.join(",")}]`;

export const embedTransactionDescriptions = async (
  texts: Array<string>,
): Promise<Array<Array<number>>> => {
  if (texts.length === 0) {
    return [];
  }
  const client = new OpenAI();
  const response = await client.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
};

export const findExactTransactionMemory = async (
  normalized: Array<string>,
): Promise<Map<string, TransactionMemoryFields>> => {
  if (normalized.length === 0) {
    return new Map();
  }
  const rows = await getDb().transactionMemory.findMany({
    where: { normalizedDescription: { in: normalized } },
    select: { id: true, normalizedDescription: true, type: true, category: true },
  });
  return new Map(
    rows.map((row) => [
      row.normalizedDescription,
      { id: row.id, type: row.type, category: row.category },
    ]),
  );
};

export const findClosestTransactionMemories = async (
  embeddingsList: Array<Array<number>>,
): Promise<Array<TransactionMemoryMatch | null>> => {
  if (embeddingsList.length === 0) {
    return [];
  }
  const ordinals = embeddingsList.map((_, index) => index);
  const literals = embeddingsList.map(toVectorLiteral);
  const rows = await getDb().$queryRaw<
    Array<Omit<TransactionMemoryMatch, "distance"> & { ord: number; distance: number | null }>
  >`
    -- Closest remembered transaction per query vector.
    -- Vectors without a match come back with NULL memory columns.
    SELECT queries.ord AS ord, match.id, match.type, match.category,
      (match.embedding <=> queries.vec) AS distance
    FROM (
      SELECT ord, vec_text::vector AS vec
      FROM unnest(${ordinals}::int[], ${literals}::text[]) AS input(ord, vec_text)
    ) AS queries
    LEFT JOIN LATERAL (
      SELECT m.id, m.type, m.category, m.embedding
      FROM transaction_memories AS m
      WHERE m.embedding IS NOT NULL
      ORDER BY m.embedding <=> queries.vec
      LIMIT 1
    ) AS match ON true
    ORDER BY queries.ord`;
  const matchesByOrd = new Map(rows.map((row) => [row.ord, row]));
  return embeddingsList.map((_, index) => {
    const top = matchesByOrd.get(index);
    if (!top || top.distance == null || top.distance >= MEMORY_MATCH_MAX_DISTANCE) {
      return null;
    }
    return { id: top.id, type: top.type, category: top.category, distance: top.distance };
  });
};

export const incrementTransactionMemoryUseCount = async (id: string): Promise<void> => {
  await getDb().transactionMemory.update({
    where: { id },
    data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
  });
};

export type UpsertTransactionMemoryInput = {
  normalizedDescription: string;
  embedding: Array<number>;
  type: TransactionType;
  category: TransactionCategory | null;
};

export const upsertTransactionMemories = async (
  entries: Array<UpsertTransactionMemoryInput>,
): Promise<void> => {
  if (entries.length === 0) {
    return;
  }
  const db = getDb();
  // Dedupe by description so concurrent upserts can't race on the same key.
  const unique = [
    ...new Map(entries.map((entry) => [entry.normalizedDescription, entry])).values(),
  ];
  await Promise.all(
    unique.map(
      (entry) => db.$executeRaw`
      INSERT INTO transaction_memories (id, normalized_description, embedding, type, category, use_count, last_used_at, created_at, updated_at)
      VALUES (gen_random_uuid(), ${entry.normalizedDescription}, ${toVectorLiteral(entry.embedding)}::vector, ${entry.type}::"transaction_types", ${entry.category}::"transaction_categories", 1, NOW(), NOW(), NOW())
      ON CONFLICT (normalized_description) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        use_count = transaction_memories.use_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()`,
    ),
  );
};
