import { z } from "zod";
import { HttpError } from "./http";

const SAFE_SEARCH_MAX_LENGTH = 80;
const POSTGREST_CONTROL_CHAR_PATTERN = /[(),]/u;
const SAFE_SEARCH_INPUT_PATTERN = /^[\p{L}\p{N}\s@.+_%\\-]+$/u;
const SAFE_COLUMN_PATTERN = /^[a-z_][a-z0-9_]*$/;

export const safeSearchParamSchema = z
  .string()
  .max(SAFE_SEARCH_MAX_LENGTH)
  .refine((value) => value.trim().length >= 2, {
    message: "Search must be at least 2 non-space characters",
  })
  .refine((value) => !POSTGREST_CONTROL_CHAR_PATTERN.test(value), {
    message: "Search contains invalid control characters",
  })
  .refine((value) => SAFE_SEARCH_INPUT_PATTERN.test(value.normalize("NFKC")), {
    message: "Search contains unsupported characters",
  });

function throwSearchValidation(message: string): never {
  throw new HttpError(400, {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: {
      search: [message],
    },
  });
}

export function sanitizeSearchTerm(raw: string): string {
  const normalized = raw.normalize("NFKC").trim();

  if (normalized.length < 2) {
    throwSearchValidation("Search must be at least 2 non-space characters");
  }
  if (normalized.length > SAFE_SEARCH_MAX_LENGTH) {
    throwSearchValidation(`Search must be at most ${SAFE_SEARCH_MAX_LENGTH} characters`);
  }
  if (POSTGREST_CONTROL_CHAR_PATTERN.test(normalized)) {
    throwSearchValidation("Search contains invalid control characters");
  }
  if (!SAFE_SEARCH_INPUT_PATTERN.test(normalized)) {
    throwSearchValidation("Search contains unsupported characters");
  }

  return normalized.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function buildSafeIlikeOr(columns: string[], rawSearch: string): string {
  if (columns.length === 0 || columns.some((column) => !SAFE_COLUMN_PATTERN.test(column))) {
    throw new Error("Invalid column list for PostgREST search");
  }

  const escapedTerm = sanitizeSearchTerm(rawSearch);
  return columns.map((column) => `${column}.ilike.%${escapedTerm}%`).join(",");
}
