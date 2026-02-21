import { jsonOk } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { assertAdminRole } from "@/server/admin/access";
import { withAdminErrorHandling } from "@/server/admin/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    database: { status: string; latency_ms: number };
    api: { status: string; uptime: string };
    cache: { status: string };
    timestamp: string;
}

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    assertAdminRole(ctx.role);

    const health: HealthStatus = {
        status: "healthy",
        database: { status: "unknown", latency_ms: 0 },
        api: { status: "running", uptime: formatUptime(process.uptime()) },
        cache: { status: "unknown" },
        timestamp: new Date().toISOString(),
    };

    // Check database connectivity and measure latency
    try {
        const dbStart = performance.now();
        const { error } = await ctx.admin
            .from("tenants")
            .select("id")
            .limit(1)
            .single();

        const dbLatency = Math.round(performance.now() - dbStart);
        health.database = {
            status: error ? "degraded" : "connected",
            latency_ms: dbLatency,
        };

        if (error) {
            health.status = "degraded";
        }
    } catch {
        health.database = { status: "disconnected", latency_ms: 0 };
        health.status = "unhealthy";
    }

    // Check cache (rate limit table acts as proxy for cache availability)
    try {
        const { error } = await ctx.admin
            .from("rate_limits")
            .select("id")
            .limit(1);

        health.cache = { status: error ? "degraded" : "active" };
    } catch {
        health.cache = { status: "unavailable" };
        if (health.status !== "unhealthy") {
            health.status = "degraded";
        }
    }

    return jsonOk(health);
});

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}
