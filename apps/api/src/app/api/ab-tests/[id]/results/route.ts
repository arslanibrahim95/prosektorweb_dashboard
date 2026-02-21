import { NextRequest } from "next/server";
import { requireAuthContext } from "@/server/auth/context";
import {
    asErrorBody,
    asHeaders,
    asStatus,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import {
    analyzeTestResults,
    calculateTestMetrics,
    optimizeTrafficSplit,
    calculateBayesianAB,
} from "@/server/ab-testing";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Test sonuçlarını ve istatistiksel analizi getir
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
            rateLimitAuthKey("ab_tests_results", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // Test bilgilerini getir
        // SECURITY: Use user-scoped client so RLS policies are enforced per role.
        const { data: test, error: testError } = await ctx.supabase
            .from("ab_tests")
            .select("*")
            .eq("id", id)
            .eq("tenant_id", ctx.tenant.id)
            .single();

        if (testError) {
            throw mapPostgrestError(testError);
        }

        // Test varyantları için metrikleri getir
        const { data: metrics, error: metricsError } = await ctx.supabase
            .from("ab_test_metrics")
            .select("*")
            .eq("test_id", id)
            .order("recorded_at", { ascending: false });

        if (metricsError) {
            throw mapPostgrestError(metricsError);
        }

        // En son metrikleri kullan
        const latestMetrics = metrics || []

        // Her varyant için toplamları hesapla
        const variantStats = new Map<string, { visitors: number; conversions: number }>()

        for (const metric of latestMetrics) {
            const existing = variantStats.get(metric.variant_id) || { visitors: 0, conversions: 0 };
            variantStats.set(metric.variant_id, {
                visitors: existing.visitors + (metric.visitors || 0),
                conversions: existing.conversions + (metric.conversions || 0),
            });
        }

        // Parse variants from test
        const variants = typeof test.variants === "string"
            ? JSON.parse(test.variants)
            : test.variants;

        // Control (A) ve Variant (B) için istatistikleri hesapla
        const controlStats = variantStats.get("control") || { visitors: 0, conversions: 0 };

        const results: Record<string, unknown> = {
            test_info: {
                id: test.id,
                name: test.name,
                status: test.status,
                confidence_level: test.confidence_level,
                start_date: test.start_date,
                end_date: test.end_date
            },
            variants: [],
        };

        // Her varyant için analiz yap
        for (const variant of variants) {
            if (variant.id === "control") continue;

            const variantStatsData = variantStats.get(variant.id) || { visitors: 0, conversions: 0 };

            // İstatistiksel analiz
            const analysis = analyzeTestResults(
                controlStats.visitors,
                controlStats.conversions,
                variantStatsData.visitors,
                variantStatsData.conversions,
                variant.id,
                variant.name,
                (test.confidence_level || 95) / 100
            );

            // Bayesian analiz
            const bayesian = calculateBayesianAB(
                controlStats.visitors,
                controlStats.conversions,
                variantStatsData.visitors,
                variantStatsData.conversions
            );

            // Varyant sonucu
            const variantResult = {
                variant_id: variant.id,
                variant_name: variant.name,
                visitors: variantStatsData.visitors,
                conversions: variantStatsData.conversions,
                conversion_rate: variantStatsData.visitors > 0
                    ? variantStatsData.conversions / variantStatsData.visitors
                    : 0,
                statistical_analysis: {
                    relative_improvement: analysis.relative_improvement,
                    absolute_improvement: analysis.absolute_improvement,
                    p_value: analysis.p_value,
                    z_score: analysis.z_score,
                    is_significant: analysis.is_significant,
                    confidence_interval: analysis.confidence_interval,
                    current_power: analysis.current_power,
                    sample_size_required: analysis.sample_size_required
                },
                bayesian_analysis: {
                    probability_to_beat_control: bayesian.probabilityToBeatControl,
                    expected_loss: bayesian.expectedLoss,
                    risk_of_choosing_wrong: bayesian.riskOfChoosingWrong
                },
                recommendation: analysis.recommendation
            };

            // @ts-expect-error - dynamic key assignment
            results.variants.push(variantResult);
        }

        // Test metriklerini ekle
        const dailyTraffic = latestMetrics.length > 0
            ? Math.ceil(latestMetrics.reduce((sum, m) => sum + (m.visitors || 0), 0) / 7) // 7 günlük ort
            : 0;

        results.test_metrics = calculateTestMetrics(
            controlStats.visitors,
            Array.from(variantStats.values()).reduce((sum, v) => sum + v.visitors, 0),
            controlStats.conversions,
            Array.from(variantStats.values()).reduce((sum, v) => sum + v.conversions, 0) - controlStats.conversions,
            test.start_date || new Date().toISOString(),
            dailyTraffic
        );

        // Traffic optimization önerisi
        const testMetrics = results.test_metrics as { overall_conversion_rate: number } | undefined
        if (controlStats.visitors > 0 && testMetrics && testMetrics.overall_conversion_rate > 0) {
            results.traffic_optimization = optimizeTrafficSplit(testMetrics.overall_conversion_rate, 0.05, dailyTraffic);
        }

        return jsonOk({ data: results }, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}
