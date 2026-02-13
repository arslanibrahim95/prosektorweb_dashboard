import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ErrorCode } from "../errors";
import { translateError } from "../errors/messages.tr";

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

/**
 * Başarılı JSON yanıtı döndürür
 */
export function jsonOk<T>(data: T, status: number = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(data, { status, headers });
}

/**
 * Hata JSON yanıtı döndürür
 */
export function jsonError(body: ErrorBody, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json(body, { status, headers });
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

/**
 * JSON body parse eder, başarısız olursa hata fırlatır
 */
export async function parseJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, {
      code: "VALIDATION_ERROR",
      message: translateError("VALIDATION_ERROR", "tr"),
    });
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

  return {
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : translateError("INTERNAL_ERROR", "tr"),
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
