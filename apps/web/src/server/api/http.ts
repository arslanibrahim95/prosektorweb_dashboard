import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type ErrorDetails = Record<string, string[]>;

export interface ErrorBody {
  code: string;
  message: string;
  details?: ErrorDetails;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly body: ErrorBody;

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export function jsonOk<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(body: ErrorBody, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

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

export async function parseJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, {
      code: "VALIDATION_ERROR",
      message: "Invalid JSON body",
    });
  }
}

export function mapPostgrestError(error: PostgrestError): HttpError {
  const code = error.code ?? "";

  if (code === "PGRST116") {
    return new HttpError(404, { code: "NOT_FOUND", message: "Not found" });
  }

  if (code === "23505") {
    return new HttpError(409, { code: "CONFLICT", message: "Conflict" });
  }

  if (code === "42501" || code === "PGRST301") {
    return new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
  }

  return new HttpError(500, {
    code: "INTERNAL_ERROR",
    message: error.message || "Internal error",
  });
}

export function asErrorBody(error: unknown): ErrorBody {
  if (error instanceof HttpError) return error.body;

  return {
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Internal error",
  };
}

export function asStatus(error: unknown): number {
  if (error instanceof HttpError) return error.status;
  return 500;
}

