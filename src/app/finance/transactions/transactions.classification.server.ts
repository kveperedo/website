import { z } from "zod";

import {
  runDecisionModel,
  type ChoiceQuestion,
  type NoulQuestion,
} from "@/app/ai/ai.service.server";
import { TransactionCategory } from "@/generated/prisma/enums";

import type { TransactionClassification, TransactionToClassify } from "./transactions.types";

import {
  embedTransactionDescriptions,
  findClosestTransactionMemories,
  findExactTransactionMemory,
  incrementTransactionMemoryUseCount,
  normalizeTransactionDescription,
} from "./transactions.memory.repository.server";

/** A memory query and an embedding call shouldn't stall the classification behind them. */
const MEMORY_LOOKUP_TIMEOUT_MS = 5_000;
/** Median decision latency is ~40ms, so anything past this is a hang rather than a slow call. */
const DECISION_TIMEOUT_MS = 5_000;
/** Bounds the fan-out so one batch of twenty can't open twenty binding calls at once. */
const DECISION_CONCURRENCY = 5;
/** Probability at or above which money is judged to be coming in. */
const INCOME_PROBABILITY_THRESHOLD = 0.5;

/** One question per transaction, so each description is judged on its own terms. */
type TransactionQuestions = {
  type: NoulQuestion;
  category: ChoiceQuestion & { criteria: Record<TransactionCategory, string> };
};

/**
 * The decision model answers a yes/no for the direction of cash flow and a pick-one for category.
 * Category is asked unconditionally because the model scores all questions in one pass, but it is
 * discarded for income — that pairing is not a meaningful one.
 */
const DECISION_QUESTIONS: TransactionQuestions = {
  type: {
    type: "noul",
    instructions: "Is this transaction money coming in rather than money going out?",
    criteria: {
      true: "Money received: salary, refund, cashback, allowance, reimbursement, interest.",
      false: "Money going out: a purchase, a bill, a payment, or a transfer.",
    },
  },
  category: {
    type: "choice",
    instructions: "Which category best fits this transaction?",
    criteria: {
      food_drinks: "Meals, coffee, snacks, and food delivery.",
      groceries_household: "Supermarket shopping, toiletries, and cleaning supplies.",
      transportation: "Fuel, parking, rideshare, and public transit.",
      bills_utilities: "Electricity, water, internet, phone, rent, and subscriptions.",
      health_wellness: "Medicine, doctor visits, the gym, and vitamins.",
      hobbies_lifestyle: "Entertainment, shopping, personal care, travel, and gifts.",
      financial: "Transfers, bank fees, investments, and loan payments.",
    },
  },
};

const DecisionAnswerSchema = z.object({
  answers: z.object({
    type: z.object({ noul: z.number().min(0).max(1) }),
    category: z.object({ choice: z.enum(TransactionCategory) }),
  }),
});

/** An unclassified transaction still has to be saveable, so guess the common case and move on. */
const fallbackClassification = (): TransactionClassification => ({
  type: "expense",
  category: null,
});

const classifyWithDecisionModel = async (
  transaction: TransactionToClassify,
): Promise<TransactionClassification> => {
  try {
    const { answers } = await runDecisionModel(
      { state: transaction, questions: DECISION_QUESTIONS },
      DecisionAnswerSchema,
      { timeoutMs: DECISION_TIMEOUT_MS },
    );

    const type = answers.type.noul >= INCOME_PROBABILITY_THRESHOLD ? "income" : "expense";

    return { type, category: type === "income" ? null : answers.category.choice };
  } catch (err) {
    console.error("Decision model classification failed:", err);
    return fallbackClassification();
  }
};

/**
 * Learns from previous saves first: a remembered description is the user's own past decision and
 * beats any model guess. Only descriptions with no memory hit reach the decision model.
 */
export const classifyTransactions = async (
  transactions: Array<TransactionToClassify>,
): Promise<Array<TransactionClassification>> => {
  const classifications = transactions.map(fallbackClassification);
  const normalized = transactions.map((transaction) =>
    normalizeTransactionDescription(transaction.description),
  );

  const applyMemory = (index: number, memory: { id: string } & TransactionClassification) => {
    classifications[index] = { type: memory.type, category: memory.category };
    void incrementTransactionMemoryUseCount(memory.id).catch((err) => {
      console.error("Transaction memory touch failed:", err);
    });
  };

  // Nothing to remember or look up for a description that normalises away, so those stay out of
  // both the memory tiers and the model. Declared outside the try so a failed lookup leaves the
  // rest to the model rather than silently dropping them.
  let pending = normalized.flatMap((value, index) => (value.length > 0 ? [index] : []));

  try {
    const exactMatches = await findExactTransactionMemory(
      pending.map((index) => normalized[index]),
    );
    const stillPending: Array<number> = [];

    for (const index of pending) {
      const hit = exactMatches.get(normalized[index]);
      if (hit) {
        applyMemory(index, hit);
      } else {
        stillPending.push(index);
      }
    }
    pending = stillPending;

    if (pending.length > 0) {
      const vectors = await embedTransactionDescriptions(
        pending.map((index) => normalized[index]),
        { timeoutMs: MEMORY_LOOKUP_TIMEOUT_MS },
      );
      const matches = await findClosestTransactionMemories(vectors);
      const undecided: Array<number> = [];

      pending.forEach((index, position) => {
        const match = matches[position];
        if (match) {
          applyMemory(index, match);
        } else {
          undecided.push(index);
        }
      });
      pending = undecided;
    }
  } catch (err) {
    console.error("Transaction memory lookup failed:", err);
  }

  for (let start = 0; start < pending.length; start += DECISION_CONCURRENCY) {
    const batch = pending.slice(start, start + DECISION_CONCURRENCY);
    const decisions = await Promise.all(
      batch.map((index) => classifyWithDecisionModel(transactions[index])),
    );
    batch.forEach((index, position) => {
      classifications[index] = decisions[position];
    });
  }

  return classifications;
};
