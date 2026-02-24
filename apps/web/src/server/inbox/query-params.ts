import type { z } from "zod";
import { HttpError, zodErrorToDetails } from "@/server/api/http";

/**
 * Parses inbox route query params using the provided schema.
 * Strict schemas remain strict: unknown params are not stripped.
 */
export function parseInboxQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>,
): T {
  const rawParams = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(rawParams);

  if (!parsed.success) {
    throw new HttpError(400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: zodErrorToDetails(parsed.error),
    });
  }

  return parsed.data;
}
