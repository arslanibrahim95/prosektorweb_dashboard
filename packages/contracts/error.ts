import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string().min(1), // VALIDATION_ERROR, NOT_FOUND, FORBIDDEN, ...
  message: z.string().min(1),
  details: z.record(z.string(), z.array(z.string())).optional(),
});

export type APIError = z.infer<typeof apiErrorSchema>;

export const ApiErrorSchema = apiErrorSchema;
