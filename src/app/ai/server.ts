import { APICallError, embedMany, generateText, NoObjectGeneratedError, Output } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod";

import { getBinding } from "@/lib/env";

export const TEXT_GENERATION_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
export const EMBEDDING_MODEL = "@cf/qwen/qwen3-embedding-0.6b";
/** Workers AI defaults max_tokens to 256, which would truncate a full parse batch. */
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TIMEOUT_MS = 15_000;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestOptions = {
  /** Hard cutoff per attempt. */
  timeoutMs?: number;
  /** Extra attempts after a timeout or provider error. */
  retries?: number;
};

type GenerateJsonInput<T> = RequestOptions & {
  instructions: string;
  messages: Array<ChatMessage>;
  schema: z.ZodType<T>;
  maxTokens?: number;
};

export class AIRequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Workers AI request exceeded ${timeoutMs}ms`);
    this.name = "AIRequestTimeoutError";
  }
}

const getProvider = () => createWorkersAI({ binding: getBinding("AI") });

/**
 * Timeouts, provider errors without a 4xx status, and output that fails the schema are worth
 * another attempt. Small models produce malformed JSON intermittently; 4xx failures are
 * deterministic (e.g. input too long) and would just fail again.
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AIRequestTimeoutError || NoObjectGeneratedError.isInstance(error)) {
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

export const generateJson = async <T>({
  instructions,
  messages,
  schema,
  maxTokens,
  ...requestOptions
}: GenerateJsonInput<T>): Promise<T> => {
  const { output } = await runWithTimeout(
    (abortSignal) =>
      generateText({
        model: getProvider()(TEXT_GENERATION_MODEL),
        instructions,
        messages,
        temperature: 0,
        maxOutputTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
        output: Output.object({ schema }),
        maxRetries: 0,
        abortSignal,
      }),
    requestOptions,
  );
  return output;
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
