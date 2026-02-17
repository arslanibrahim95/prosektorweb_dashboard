import { NextRequest } from "next/server";
import {
    jsonError,
    jsonOk,
    HttpError
} from "@/server/api/http";
import { createAdminClient } from "@/server/supabase";
import { enforceRateLimit, rateLimitAuthKey } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Türkçe karakterleri düzgün slugify eder
 * İ -> i, ı -> i, ğ -> g, ü -> u, ö -> o, ş -> s
 */
function slugify(text: string): string {
    const turkishMap: Record<string, string> = {
        'İ': 'i', 'I': 'i', 'ı': 'i',
        'Ğ': 'g', 'ğ': 'g',
        'Ü': 'u', 'ü': 'u',
        'Ö': 'o', 'ö': 'o',
        'Ş': 's', 'ş': 's',
        'Ç': 'c', 'ç': 'c'
    };

    return text
        .split('')
        .map(char => turkishMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60); // Max 60 karakter
}

/**
 * XSS temizleme - temel HTML/JS injection koruması
 */
function sanitizeInput(text: string): string {
    return text
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .trim();
}

// POST /api/onboarding/tenant - Create a new tenant for the user
export async function POST(req: NextRequest) {
    const supabase = createAdminClient();

    try {
        // 1. Get current user from session
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return jsonError({ code: "UNAUTHORIZED", message: "No authorization header" }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return jsonError({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
        }

        // 2. Rate limiting - 3 tenant creations per hour per user
        const rateLimitKey = rateLimitAuthKey('onboarding-tenant', 'global', user.id);
        await enforceRateLimit(supabase, rateLimitKey, 3, 3600);

        // 3. Check tenant limit - max 5 tenants per user
        const { count: tenantCount, error: countError } = await supabase
            .from('tenant_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) {
            console.error('Error checking tenant count:', countError);
            return jsonError({ code: "INTERNAL_ERROR", message: "Failed to check tenant limit" }, 500);
        }

        const MAX_TENANTS_PER_USER = 5;
        if (tenantCount !== null && tenantCount >= MAX_TENANTS_PER_USER) {
            return jsonError({
                code: "TENANT_LIMIT_EXCEEDED",
                message: `You can only create up to ${MAX_TENANTS_PER_USER} organizations`
            }, 403);
        }

        const body = await req.json();

        // 4. Validate input - IMPROVED
        if (!body.name || typeof body.name !== 'string') {
            return jsonError({ code: "VALIDATION_ERROR", message: "Organization name is required" }, 400);
        }

        // Trim and sanitize
        const sanitizedName = sanitizeInput(body.name);

        if (sanitizedName.length < 2) {
            return jsonError({ code: "VALIDATION_ERROR", message: "Organization name must be at least 2 characters" }, 400);
        }

        if (sanitizedName.length > 100) {
            return jsonError({ code: "VALIDATION_ERROR", message: "Organization name must be less than 100 characters" }, 400);
        }

        // 5. Generate unique slug with retry loop - FIXED race condition
        let slug = body.slug ? sanitizeInput(body.slug) : slugify(sanitizedName);

        // Ensure slug is not empty
        if (!slug) {
            slug = `org-${Date.now()}`;
        }

        // Retry loop for slug uniqueness
        let slugAttempts = 0;
        const maxSlugAttempts = 5;

        while (slugAttempts < maxSlugAttempts) {
            const { data: existingTenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('slug', slug)
                .single();

            if (!existingTenant) {
                break; // Unique slug found
            }

            // Append timestamp + random suffix
            slug = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            slugAttempts++;
        }

        if (slugAttempts >= maxSlugAttempts) {
            return jsonError({ code: "SLUG_ERROR", message: "Could not generate unique organization URL. Please try again." }, 500);
        }

        // 6. Create Tenant
        const { data: tenant, error: createError } = await supabase
            .from('tenants')
            .insert({
                name: sanitizedName,
                slug: slug,
                plan: 'demo',
                status: 'active'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating tenant:', createError);
            return jsonError({ code: "CREATE_ERROR", message: "Failed to create organization" }, 500);
        }

        // 7. Create Tenant Member (Owner) with ROLLBACK on failure
        const { error: memberError } = await supabase
            .from('tenant_members')
            .insert({
                tenant_id: tenant.id,
                user_id: user.id,
                role: 'owner'
            });

        if (memberError) {
            console.error('Error creating tenant member:', memberError);

            // ROLLBACK: Delete the tenant
            await supabase.from('tenants').delete().eq('id', tenant.id);

            return jsonError({ code: "MEMBER_ERROR", message: "Failed to create organization. Please try again." }, 500);
        }

        // 8. Create Default Site
        const { error: siteError } = await supabase
            .from('sites')
            .insert({
                tenant_id: tenant.id,
                name: `${sanitizedName} Website`,
                slug: slug, // Use same slug as tenant for the site
                status: 'draft',
                settings: {}
            });

        if (siteError) {
            console.error('Error creating default site:', siteError);
            // We don't rollback tenant here, just log warning. User can create site later.
        }

        return jsonOk({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan
        }, 201);

    } catch (error) {
        console.error('Onboarding API error:', error);
        return jsonError({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
    }
}
