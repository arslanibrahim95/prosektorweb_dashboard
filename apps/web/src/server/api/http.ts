import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ErrorCode } from "../errors";
import { translateError } from "../errors/messages.tr";
import { getServerEnv } from "../env";

export type ErrorDetails = Record<string, string[]>;

/**
 * API Error Body
 */
export interface ErrorBody {
  code: string;
  message: string;
  details?: ErrorDetails;
}

/**
 * HTTP Error sınıfı
 * 
 * @example
 * throw new HttpError(400, {
 *   code: 'VALIDATION_ERROR',
 *   message: 'Girdiğiniz bilgilerde hata var.'
 * });
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly body: ErrorBody;
  public readonly code: ErrorCode;
  public readonly headers?: HeadersInit;

  constructor(status: number, body: ErrorBody, options?: { headers?: HeadersInit }) {
    super(body.message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.code = body.code as ErrorCode;
    this.headers = options?.headers;
  }
}

/** SECURITY: Standard security headers for all API responses */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function mergeHeaders(security: Record<string, string>, custom?: HeadersInit): Record<string, string> {
  const merged = new Headers(custom);
  for (const [key, value] of Object.entries(security)) {
    // Enforce security headers even if caller tries to override them.
    merged.set(key, value);
  }

  const result: Record<string, string> = {};
  merged.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Başarılı JSON yanıtı döndürür
 */
export function jsonOk<T>(data: T, status: number = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(data, { status, headers: mergeHeaders(SECURITY_HEADERS, headers) });
}

/**
 * Hata JSON yanıtı döndürür
 */
export function jsonError(body: ErrorBody, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: mergeHeaders(
      { ...SECURITY_HEADERS, 'Cache-Control': 'no-store' },
      headers,
    ),
  });
}

/**
 * Zod validasyon hatasını ErrorDetails formatına çevirir
 */
export function zodErrorToDetails(error: z.ZodError): ErrorDetails {
  const details: ErrorDetails = {};

  for (const issue of error.issues) {
    const path =
      issue.path.length > 0 ? issue.path.map((p) => String(p)).join(".") : "_";
    details[path] ??= [];
    details[path].push(issue.message);
  }

  return details;
}

export interface ParseJsonOptions {
  maxBytes?: number;
}

const DEFAULT_JSON_MAX_BYTES = 1024 * 1024; // 1 MB

function payloadTooLargeError(maxBytes: number): HttpError {
  return new HttpError(413, {
    code: "VALIDATION_ERROR",
    message: `JSON body too large (max ${maxBytes} bytes)`,
  });
}

function resolveJsonBodyMaxBytes(opts?: ParseJsonOptions): number {
  if (opts?.maxBytes !== undefined) return opts.maxBytes;
  try {
    return getServerEnv().jsonBodyMaxBytes ?? DEFAULT_JSON_MAX_BYTES;
  } catch {
    return DEFAULT_JSON_MAX_BYTES;
  }
}

/**
 * JSON body parse eder, başarısız olursa hata fırlatır
 */
export async function parseJson(req: Request, opts?: ParseJsonOptions): Promise<unknown> {
  const maxBytes = resolveJsonBodyMaxBytes(opts);
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw payloadTooLargeError(maxBytes);
    }
  }

  try {
    const raw = await req.text();
    const byteLength = new TextEncoder().encode(raw).byteLength;
    if (byteLength > maxBytes) {
      throw payloadTooLargeError(maxBytes);
    }

    if (raw.trim().length === 0) {
      throw new Error("empty-json");
    }

    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      400,
      {
        code: "VALIDATION_ERROR",
        message: translateError("VALIDATION_ERROR", "tr"),
      },
    );
  }
}

/**
 * PostgREST hatasını HttpError'a çevirir
 */
export function mapPostgrestError(error: PostgrestError): HttpError {
  const code = error.code ?? "";

  if (code === "PGRST116") {
    return new HttpError(404, {
      code: "NOT_FOUND",
      message: translateError("NOT_FOUND", "tr"),
    });
  }

  if (code === "23505") {
    return new HttpError(409, {
      code: "CONFLICT",
      message: translateError("CONFLICT", "tr"),
    });
  }

  if (code === "42501" || code === "PGRST301") {
    return new HttpError(403, {
      code: "FORBIDDEN",
      message: translateError("FORBIDDEN", "tr"),
    });
  }

  return new HttpError(500, {
    code: "INTERNAL_ERROR",
    message: translateError("INTERNAL_ERROR", "tr"),
  });
}

/**
 * Hata nesnesini ErrorBody'ye çevirir
 */
export function asErrorBody(error: unknown): ErrorBody {
  if (error instanceof HttpError) return error.body;

  // Sanitize error message to prevent sensitive info leakage
  const rawMessage = error instanceof Error ? error.message : '';

  // Check for sensitive patterns
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /connection.*string/i,
    /\/\/.*\:.*\@/,
    /stack.*trace/i,
    /postgres.*?:.*@/i,
    /mongodb.*?:.*@/i,
    /redis.*?:.*@/i,
  ];

  let sanitizedMessage = rawMessage;
  for (const pattern of sensitivePatterns) {
    if (pattern.test(rawMessage) || rawMessage.includes('/var/') || rawMessage.includes('C:\\') || rawMessage.includes('/home/')) {
      sanitizedMessage = translateError("INTERNAL_ERROR", "tr");
      break;
    }
  }

  return {
    code: "INTERNAL_ERROR",
    message: sanitizedMessage,
  };
}

/**
 * Hata HTTP durum kodunu döndürür
 */
export function asStatus(error: unknown): number {
  if (error instanceof HttpError) return error.status;
  return 500;
}

/**
 * Hata için ek response header'larını döndürür.
 */
export function asHeaders(error: unknown): HeadersInit | undefined {
  if (error instanceof HttpError) return error.headers;
  return undefined;
}
