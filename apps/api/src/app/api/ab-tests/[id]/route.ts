import { NextRequest } from "next/server";
import { requireAuthContext, type AuthContext } from "@/server/auth/context";
import { z } from "zod";
import {
    asErrorBody,
    asHeaders,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AB_TEST_WRITE_LIMIT = 30;
const AB_TEST_WRITE_WINDOW_SECONDS = 3600;

function assertCanWriteAbTests(ctx: AuthContext): void {
    if (ctx.role === "viewer") {
        throw new HttpError(403, {
            code: "FORBIDDEN",
            message: "A/B test güncelleme yetkiniz yok",
        });
    }
}

// A/B Test güncelleme şeması
const updateAbTestSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
    traffic_split: z.array(z.number()).length(2).optional(),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        weight: z.number().min(0).max(100)
    })).optional(),
    goals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['pageview', 'click', 'conversion', 'custom']),
        target_url: z.string().optional(),
        selector: z.string().optional()
    })).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    confidence_level: z.number().min(0).max(100).optional()
});

// GET - Tek A/B test detaylarını getir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request);
        const env = getServerEnv();
        const { id } = await params;

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("ab_tests_detail", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        const { data, error } = await ctx.supabase
            .from("ab_tests")
            .select("*")
            .eq("id", id)
            .eq("tenant_id", ctx.tenant.id)
            .single();

        if (error) {
            throw mapPostgrestError(error);
        }

        // Parse JSON fields safely
        function safeParseJson<T>(value: string | T, field: string): T {
            if (typeof value !== "string") return value;
            try {
                return JSON.parse(value);
            } catch {
                throw new HttpError(500, {
                    code: "INTERNAL_ERROR",
                    message: `Invalid JSON in field '${field}'`,
                });
            }
        }

        const parsedData = {
            ...data,
            variants: safeParseJson(data.variants, "variants"),
            goals: safeParseJson(data.goals, "goals"),
        };

        return jsonOk({ data: parsedData }, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// PUT - A/B test güncelle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request);
        assertCanWriteAbTests(ctx);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("ab_tests_write", ctx.tenant.id, ctx.user.id),
            AB_TEST_WRITE_LIMIT,
            AB_TEST_WRITE_WINDOW_SECONDS,
        );

        const { id } = await params;
        const body = await parseJson(request);
        const validation = updateAbTestSchema.safeParse(body);

        if (!validation.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(validation.error),
            });
        }

        const updateData: Record<string, unknown> = { ...validation.data }

        // JSON string olarak saklanacak alanları dönüştür
        if (updateData.variants) {
            updateData.variants = JSON.stringify(updateData.variants)
        }
        if (updateData.goals) {
            updateData.goals = JSON.stringify(updateData.goals)
        }

        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        const { data, error } = await ctx.supabase
            .from("ab_tests")
            .update(updateData)
            .eq("id", id)
            .eq("tenant_id", ctx.tenant.id)
            .select()
            .single();

        if (error) {
            throw mapPostgrestError(error);
        }

        return jsonOk({ data }, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// DELETE - A/B test sil
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request);
        assertCanWriteAbTests(ctx);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("ab_tests_write", ctx.tenant.id, ctx.user.id),
            AB_TEST_WRITE_LIMIT,
            AB_TEST_WRITE_WINDOW_SECONDS,
        );

        const { id } = await params;

        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        const { error } = await ctx.supabase
            .from("ab_tests")
            .delete()
            .eq("id", id)
            .eq("tenant_id", ctx.tenant.id);

        if (error) {
            throw mapPostgrestError(error);
        }

        return jsonOk({ success: true }, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}
