/**
 * Token Exchange API Endpoint
 *
 * Supabase session'ı custom JWT ile değiştirir.
 * Remember me desteği ile 30 güne kadar oturum süresi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserClientFromBearer, createAdminClient, getBearerToken } from '@/server/supabase';
import { createCustomTokenFromSupabase } from '@/server/auth/dual-auth';
import { createError } from '@/server/errors';
import { asErrorBody, asHeaders, asStatus, jsonError, jsonOk } from '@/server/api/http';
import { enforceRateLimit, getClientIp, hashIp, rateLimitAuthKey } from '@/server/rate-limit';
import { assertAllowedWebOrigin, getAllowedCorsOrigin } from '@/server/security/origin';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request schema
const tokenExchangeRequestSchema = z.object({
  rememberMe: z.boolean().optional().default(false),
});

function mergeResponseHeaders(...headersList: Array<HeadersInit | undefined>): HeadersInit | undefined {
  const merged = new Headers();
  let hasAny = false;

  for (const headers of headersList) {
    if (!headers) continue;
    hasAny = true;
    const normalized = new Headers(headers);
    normalized.forEach((value, key) => {
      merged.set(key, value);
    });
  }

  return hasAny ? merged : undefined;
}

/**
 * POST /api/auth/token
 *
 * Supabase access token'ı custom JWT ile değiştirir.
 *
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *
 * Body:
 *   {
 *     "rememberMe": boolean (optional, default: false)
 *   }
 *
 * Response:
 *   {
 *     "access_token": string,
 *     "refresh_token": string | undefined,
 *     "expires_at": string (ISO 8601),
 *     "token_type": "Bearer"
 *   }
 */
export async function POST(req: NextRequest) {
  let corsHeaders: HeadersInit | undefined;

  try {
    const admin = createAdminClient();
    const origin = req.headers.get('origin');
    const allowedOrigin = await assertAllowedWebOrigin(origin, admin);
    corsHeaders = allowedOrigin
      ? {
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        }
      : undefined;

    // SECURITY: Rate limit by IP address first (before authentication)
    // This prevents brute force attacks on the token exchange endpoint
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    await enforceRateLimit(
      admin,
      `rl:token-exchange:ip:${ipHash}`,
      10, // 10 requests per 15 minutes per IP
      900 // 15 minutes in seconds
    );

    // Request body parse
    const body = await req.json().catch(() => ({}));
    const parsed = tokenExchangeRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({
        code: 'INVALID_REQUEST_BODY',
        message: 'Geçersiz istek. rememberMe boolean olmalı.',
      });
    }

    const { rememberMe } = parsed.data;

    // Authorization header'dan Supabase token'ı al
    const token = getBearerToken(req);
    if (!token) {
      throw createError({
        code: 'UNAUTHORIZED',
        message: 'Oturum bilgisi bulunamadı.',
      });
    }

    // Supabase session'ı validate et
    const supabase = createUserClientFromBearer(token);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      throw createError({
        code: 'UNAUTHORIZED',
        message: 'Supabase oturumu geçersiz. Lütfen tekrar giriş yapın.',
      });
    }

    // Get user's first tenant for rate limiting
    const { data: membership } = await admin
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Use tenant_id from trusted membership data (not user_metadata).
    // Fallback to userId keeps per-user throttling stable even without membership row.
    const effectiveTenantId = membership?.tenant_id ?? userData.user.id;

    // SECURITY: Additional rate limit by user ID (after authentication)
    // This prevents a single user from generating too many tokens
    await enforceRateLimit(
      admin,
      rateLimitAuthKey('token-exchange', effectiveTenantId, userData.user.id),
      20, // 20 requests per hour per user
      3600 // 1 hour in seconds
    );

    // AUDIT LOG: Log token exchange for security monitoring
    // SECURITY: No raw PII (email, IP) in logs — use hashed values for KVKK/GDPR
    if (process.env.NODE_ENV === 'production') {
      logger.info('[AUDIT] Token exchange', {
        userId: userData.user.id,
        rememberMe,
        ipHash: ipHash, // Already hashed above, never log raw IP
        timestamp: new Date().toISOString(),
      });
    }

    // Custom JWT oluştur
    const tokenResponse = await createCustomTokenFromSupabase(
      userData.user,
      rememberMe
    );

    // SECURITY: Use jsonOk to include security headers (X-Content-Type-Options, etc.)
    return jsonOk(tokenResponse, 200, corsHeaders);
  } catch (err) {
    // SECURITY: Log failed token exchange attempts for monitoring
    // SECURITY: No raw IP in logs — use hashed value
    if (process.env.NODE_ENV === 'production') {
      const error = err as Error;
      const failedIpHash = hashIp(getClientIp(req));
      logger.warn('[SECURITY] Token exchange failed', {
        error: error.message,
        ipHash: failedIpHash,
        timestamp: new Date().toISOString(),
      });
    }

    return jsonError(
      asErrorBody(err),
      asStatus(err),
      mergeResponseHeaders(asHeaders(err), corsHeaders),
    );
  }
}

/**
 * OPTIONS /api/auth/token
 *
 * CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  const admin = createAdminClient();
  const allowedOrigin = await getAllowedCorsOrigin(req.headers.get('origin'), admin);
  if (!allowedOrigin) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        Vary: 'Origin',
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    },
  });
}
