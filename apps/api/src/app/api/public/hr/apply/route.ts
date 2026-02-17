import { cvFileSchema, publicJobApplyFieldsSchema, publicSubmitSuccessSchema } from "@prosektor/contracts";
import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  asHeaders,
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, getClientIp, hashIp, randomId, rateLimitKey, rateLimitHeaders } from "@/server/rate-limit";
import { verifySiteToken } from "@/server/site-token";
import { createAdminClient } from "@/server/supabase";
import {
  validateCVFile,
  sanitizeFilename,
} from "@/server/security/file-validation";
import { ErrorCodes, ErrorCode } from "@/server/errors/error-codes";

function asString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function parseCheckbox(value: FormDataEntryValue | null): boolean | undefined {
  const v = asString(value);
  if (v === undefined) return undefined;
  const s = v.trim().toLowerCase();
  if (s === "true" || s === "1" || s === "on" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "off" || s === "no") return false;
  return undefined;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const env = getServerEnv();

    const formData = await req.formData();

    const honeypotRaw = formData.get("honeypot");
    const honeypot = asString(honeypotRaw);
    if (honeypot && honeypot.length > 0) {
      return new NextResponse(null, { status: 204 });
    }

    const fieldsRaw = {
      site_token: asString(formData.get("site_token")),
      job_post_id: asString(formData.get("job_post_id")),
      full_name: asString(formData.get("full_name")),
      email: asString(formData.get("email")),
      phone: asString(formData.get("phone")),
      message: asString(formData.get("message")) ?? undefined,
      kvkk_consent: parseCheckbox(formData.get("kvkk_consent")),
      honeypot,
    };

    const fieldsParsed = publicJobApplyFieldsSchema.safeParse(fieldsRaw);
    if (!fieldsParsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(fieldsParsed.error),
      });
    }

    const cvEntry = formData.get("cv_file");
    const cvParsed = cvFileSchema.safeParse(cvEntry);
    if (!cvParsed.success) {
      throw new HttpError(400, {
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Validation failed",
        details: { cv_file: cvParsed.error.issues.map((i) => i.message) },
      });
    }
    const cvFile = cvParsed.data;

    // Convert file to buffer for comprehensive validation
    const cvBuffer = await cvFile.arrayBuffer();

    // Perform comprehensive security validation (magic bytes, file type, size)
    const validationResult = await validateCVFile(cvFile, cvBuffer);
    if (!validationResult.valid) {
      // Determine specific error code based on validation failure
      let errorCode: ErrorCode = ErrorCodes.VALIDATION_ERROR;
      if (validationResult.error?.includes('file type')) {
        errorCode = ErrorCodes.INVALID_FILE_TYPE;
      } else if (validationResult.error?.includes('size')) {
        errorCode = ErrorCodes.FILE_TOO_LARGE;
      } else if (validationResult.error?.includes('content')) {
        errorCode = ErrorCodes.INVALID_FILE_CONTENT;
      }

      throw new HttpError(errorCode === ErrorCodes.FILE_TOO_LARGE ? 413 : 400, {
        code: errorCode,
        message: validationResult.error || "File validation failed",
      });
    }

    const { site_id } = await verifySiteToken(fieldsParsed.data.site_token);

    const { data: site, error: siteError } = await admin
      .from("sites")
      .select("id, tenant_id")
      .eq("id", site_id)
      .maybeSingle();
    if (siteError) throw mapPostgrestError(siteError);
    if (!site) throw new HttpError(404, { code: "SITE_NOT_FOUND", message: "Site not found" });

    const { data: moduleInstance, error: moduleError } = await admin
      .from("module_instances")
      .select("enabled")
      .eq("site_id", site.id)
      .eq("module_key", "hr")
      .maybeSingle();
    if (moduleError) throw mapPostgrestError(moduleError);
    if (!moduleInstance || !moduleInstance.enabled) {
      throw new HttpError(404, { code: "MODULE_DISABLED", message: "Module disabled" });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const rateLimitResult = await enforceRateLimit(
      admin,
      rateLimitKey("public_hr_apply", site.id, ipHash),
      env.publicHrApplyRlLimit,
      env.publicHrApplyRlWindowSec
    );

    const { data: jobPost, error: jobPostError } = await admin
      .from("job_posts")
      .select("id")
      .eq("tenant_id", site.tenant_id)
      .eq("site_id", site.id)
      .eq("id", fieldsParsed.data.job_post_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (jobPostError) throw mapPostgrestError(jobPostError);
    if (!jobPost) throw new HttpError(404, { code: "NOT_FOUND", message: "Job post not found" });

    const nowIso = new Date().toISOString();
    const key = `tenant_${site.tenant_id}/cv/${Date.now()}_${randomId()}_${sanitizeFilename(
      cvFile.name,
    )}`;

    // PERFORMANCE FIX: Upload directly from the ArrayBuffer used for validation
    // instead of creating a second Buffer copy (avoids double memory usage)
    const { error: uploadError } = await admin.storage
      .from(env.storageBucketPrivateCv)
      .upload(key, new Uint8Array(cvBuffer), { contentType: cvFile.type, upsert: false });
    if (uploadError) throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Upload failed" });

    const { data: inserted, error: insertError } = await admin
      .from("job_applications")
      .insert({
        tenant_id: site.tenant_id,
        site_id: site.id,
        job_post_id: fieldsParsed.data.job_post_id,
        full_name: fieldsParsed.data.full_name,
        email: fieldsParsed.data.email,
        phone: fieldsParsed.data.phone,
        message: fieldsParsed.data.message ?? null,
        cv_path: key,
        kvkk_accepted_at: nowIso,
        is_read: false,
      })
      .select("id")
      .single();
    if (insertError) {
      // Robust cleanup with retry logic to avoid orphaned objects
      await cleanupStorageFile(admin, env.storageBucketPrivateCv, key);
      throw mapPostgrestError(insertError);
    }

    // Helper function for robust storage cleanup with retries
    async function cleanupStorageFile(
      admin: SupabaseClient,
      bucketName: string,
      filePath: string,
      maxRetries: number = 3
    ): Promise<void> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { error } = await admin.storage.from(bucketName).remove([filePath]);
          if (!error) {
            return; // Success
          }
          console.warn(`[Cleanup] Attempt ${attempt} failed:`, error.message);
        } catch (err) {
          console.warn(`[Cleanup] Attempt ${attempt} threw:`, err);
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }

      // Log final failure for manual cleanup
      console.error(`[Cleanup] Failed to remove file after ${maxRetries} attempts:`, filePath);
    }

    return jsonOk(
      publicSubmitSuccessSchema.parse({ id: inserted.id }),
      200,
      rateLimitHeaders(rateLimitResult)
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
