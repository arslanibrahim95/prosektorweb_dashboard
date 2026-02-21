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

// A/B Test oluşturma şeması
const createAbTestSchema = z.object({
    name: z.string().min(1, "Test adı zorunludur"),
    description: z.string().optional().default(""),
    status: z.enum(["draft", "running", "paused", "completed"]).default("draft"),
    traffic_split: z.array(z.number()).length(2).default([50, 50]),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        weight: z.number().min(0).max(100),
    })).min(2, "En az 2 varyant gereklidir"),
    goals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["pageview", "click", "conversion", "custom"]),
        target_url: z.string().optional(),
        selector: z.string().optional(),
    })).default([]),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    confidence_level: z.number().min(0).max(100).default(95),
});

// GET - Tüm A/B testlerini listele
export async function GET(request: NextRequest) {
    try {
        const ctx = await requireAuthContext(request);
        const env = getServerEnv();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
        const offset = (page - 1) * limit;

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("ab_tests", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        let query = ctx.supabase
            .from("ab_tests")
            .select("*", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        if (error) {
            throw mapPostgrestError(error);
        }

        // Parse JSON fields
        const parsedData = (data || []).map(test => ({
            ...test,
            variants: typeof test.variants === "string" ? JSON.parse(test.variants) : test.variants,
            goals: typeof test.goals === "string" ? JSON.parse(test.goals) : test.goals,
        }));

        return jsonOk({
            data: parsedData,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        }, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// POST - Yeni A/B test oluştur
export async function POST(request: NextRequest) {
    try {
        const ctx = await requireAuthContext(request);
        assertCanWriteAbTests(ctx);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("ab_tests_write", ctx.tenant.id, ctx.user.id),
            AB_TEST_WRITE_LIMIT,
            AB_TEST_WRITE_WINDOW_SECONDS,
        );

        const body = await parseJson(request);
        const validation = createAbTestSchema.safeParse(body);

        if (!validation.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(validation.error),
            });
        }

        const testData = {
            name: validation.data.name,
            description: validation.data.description,
            status: validation.data.status,
            traffic_split: validation.data.traffic_split,
            variants: JSON.stringify(validation.data.variants),
            goals: JSON.stringify(validation.data.goals),
            start_date: validation.data.start_date,
            end_date: validation.data.end_date,
            confidence_level: validation.data.confidence_level,
            tenant_id: ctx.tenant.id,
            created_by: ctx.user.id,
        };

        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        const { data, error } = await ctx.supabase
            .from("ab_tests")
            .insert(testData)
            .select()
            .single();

        if (error) {
            throw mapPostgrestError(error);
        }

        return jsonOk({ data }, 201, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}
