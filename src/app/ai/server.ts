import { APICallError, embedMany } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod";

import { getBinding } from "@/lib/env";

export const EMBEDDING_MODEL = "@cf/qwen/qwen3-embedding-0.6b";
/**
 * Scores a state against typed questions and returns a probability per allowed option. It can
 * classify but cannot generate or extract free-form values — there is no text decoding.
 */
export const DECISION_MODEL = "@cf/cloudflare/clef-flash";
const DEFAULT_DECISION_VARIANT = "clef-flash";
const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions = {
  /** Hard cutoff per attempt. */
  timeoutMs?: number;
  /** Extra attempts after a timeout or provider error. */
  retries?: number;
};

export class AIRequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Workers AI request exceeded ${timeoutMs}ms`);
    this.name = "AIRequestTimeoutError";
  }
}

const getProvider = () => createWorkersAI({ binding: getBinding("AI") });

/**
 * Timeouts and provider errors without a 4xx status are worth another attempt. 4xx failures are
 * deterministic (e.g. input too long) and would just fail again.
 *
 * Decision-model failures arrive as plain errors from the binding, so they are not retried — the
 * call is fast enough that a second attempt is worse than falling back.
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AIRequestTimeoutError) {
    return true;
  }
  if (APICallError.isInstance(error)) {
    return error.statusCode == null || error.statusCode >= 500;
  }
  return false;
};

/**
 * Workers AI intermittently hangs for 30–45s before failing with "internal error", while healthy
 * calls finish in a few seconds. The SDK marks that error non-retryable and only sees it after the
 * hang, so each attempt is cut off here instead. The timer races the call rather than relying on
 * the abort signal alone, because the binding may not stop when aborted.
 */
const runWithTimeout = async <T>(
  run: (abortSignal: AbortSignal) => Promise<T>,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0 }: RequestOptions,
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new AIRequestTimeoutError(timeoutMs);
        controller.abort(error);
        reject(error);
      }, timeoutMs);
    });

    try {
      return await Promise.race([run(controller.signal), timeout]);
    } catch (error) {
      if (!isRetryableError(error) || attempt >= retries) {
        throw error;
      }
    } finally {
      clearTimeout(timer);
    }
  }
};

/** A yes/no question. Answers with the probability that the answer is yes. */
export type NoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: { true?: string; false?: string };
};

/** A pick-one question. Answers with the chosen option, its probability, and a confidence. */
export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

/** An ordered rating. Answers with a probability-weighted position between the levels. */
export type ScoreQuestion = {
  type: "score";
  instructions: string;
  /** Level descriptions, lowest first; levels are indexed from 0. */
  criteria: Array<string>;
};

export type DecisionQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type DecisionRequest = {
  /** The content to evaluate — a string or any structured value. */
  state: unknown;
  questions: Record<string, DecisionQuestion>;
  variant?: string;
};

/**
 * Decision models are not language models, so the AI SDK provider can't wrap them — the Workers AI
 * binding is called directly. The binding also types unknown models as `Record<string, unknown>`,
 * which makes `schema` the only thing giving the answer a real shape.
 */
export const runDecisionModel = async <T>(
  { state, questions, variant = DEFAULT_DECISION_VARIANT }: DecisionRequest,
  schema: z.ZodType<T>,
  requestOptions: RequestOptions = {},
): Promise<T> => {
  const response = await runWithTimeout(
    (abortSignal) =>
      getBinding("AI").run(
        DECISION_MODEL,
        { model: variant, state, questions },
        { signal: abortSignal },
      ),
    requestOptions,
  );

  return schema.parse(response);
};

export const embedTexts = async (
  texts: Array<string>,
  requestOptions: RequestOptions = {},
): Promise<Array<Array<number>>> => {
  if (texts.length === 0) {
    return [];
  }
  const { embeddings } = await runWithTimeout(
    (abortSignal) =>
      embedMany({
        model: getProvider().textEmbedding(EMBEDDING_MODEL),
        values: texts,
        maxRetries: 0,
        abortSignal,
      }),
    requestOptions,
  );
  return embeddings;
};
