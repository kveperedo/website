import { z } from "zod";

export const LoginInputSchema = z.object({
  password: z.string(),
  from: z.string().optional(),
});

export const LoginSearchSchema = z.object({
  from: z.string().optional().catch(undefined),
});
