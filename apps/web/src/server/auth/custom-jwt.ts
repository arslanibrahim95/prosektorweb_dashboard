/**
 * Custom JWT Implementation
 *
 * Supabase JWT'e ek olarak internal API'lar için özel JWT üretir.
 * Jose kütüphanesi kullanılarak HS256 algorithm ile imzalanır.
 */

import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import type { UserRole } from '@prosektor/contracts';
import { userRoleSchema } from '@prosektor/contracts';
import { getServerEnv } from '../env';
import { createError } from '../errors';

// JWT Audience identifiers
export const CUSTOM_JWT_AUDIENCE = 'prosektor:api';
export const CUSTOM_JWT_ISSUER = 'prosektor:auth';

// Token TTL constants (in seconds)
export const TOKEN_TTL = {
  ACCESS: 15 * 60, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60, // 7 days
  REMEMBER_ME: 14 * 24 * 60 * 60, // 14 days (reduced from 30 for security)
} as const;

export type TokenType = 'access' | 'refresh' | 'remember_me';

/**
 * Custom JWT Payload Schema
 */
const customJWTPayloadSchema = z.object({
  // SECURITY FIX: Validate as UUID to prevent arbitrary string injection
  sub: z.string().uuid(), // User ID
  tenant_id: z.string().uuid(), // Tenant ID
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  permissions: z.array(z.string()),
  iat: z.number().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
});

export type CustomJWTPayload = z.infer<typeof customJWTPayloadSchema>;

/**
 * Token options
 */
export interface SignTokenOptions {
  tokenType: TokenType;
  tenantId: string;
}

/**
 * Sign result
 */
export interface SignResult {
  token: string;
  expires_at: string;
  expires_in: number;
}

/**
 * Get JWT secret from environment
 *
 * SECURITY: Uses dedicated CUSTOM_JWT_SECRET instead of SITE_TOKEN_SECRET
 * to ensure cryptographic separation between authentication tokens and
 * public form tokens. This prevents cross-domain attacks where a compromised
 * site token could be used to forge authentication JWTs.
 */
function getJWTSecret(): Uint8Array {
  const env = getServerEnv();
  return new TextEncoder().encode(env.customJwtSecret);
}

/**
 * Get TTL for token type
 */
function getTTLForTokenType(tokenType: TokenType): number {
  switch (tokenType) {
    case 'access':
      return TOKEN_TTL.ACCESS;
    case 'refresh':
      return TOKEN_TTL.REFRESH;
    case 'remember_me':
      return TOKEN_TTL.REMEMBER_ME;
    default:
      return TOKEN_TTL.ACCESS;
  }
}

/**
 * Custom JWT token oluşturur.
 *
 * @param payload - JWT payload
 * @param options - Token options (token type, tenant id)
 * @returns Signed token with expiry information
 */
export async function signCustomJWT(
  payload: CustomJWTPayload,
  options: SignTokenOptions
): Promise<SignResult> {
  const secret = getJWTSecret();
  const ttl = getTTLForTokenType(options.tokenType);
  const exp = Math.floor(Date.now() / 1000) + ttl;

  // SECURITY FIX: Explicitly pick allowed fields instead of spreading
  // Spreading `payload` could let callers inject `exp`, `iat`, `iss`, `aud`,
  // or override `role`/`permissions` after schema validation.
  const validatedPayload = customJWTPayloadSchema.parse({
    sub: payload.sub,
    tenant_id: options.tenantId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    permissions: payload.permissions,
  });

  const token = await new SignJWT(validatedPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(CUSTOM_JWT_ISSUER)
    .setAudience(CUSTOM_JWT_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);

  return {
    token,
    expires_at: new Date(exp * 1000).toISOString(),
    expires_in: ttl,
  };
}

/**
 * Custom JWT token doğrular.
 *
 * @param token - JWT token string
 * @returns Validated payload
 * @throws Error if token is invalid or expired
 */
export async function verifyCustomJWT(token: string): Promise<CustomJWTPayload> {
  const secret = getJWTSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: CUSTOM_JWT_ISSUER,
      audience: CUSTOM_JWT_AUDIENCE,
    });

    // Validate payload structure
    const parsed = customJWTPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw createError({
        code: 'CUSTOM_JWT_INVALID',
        message: 'Oturum bilgisi geçersiz.',
      });
    }

    return parsed.data;
  } catch (err) {
    if (err instanceof Error && err.name === 'JWTExpired') {
      throw createError({
        code: 'CUSTOM_JWT_EXPIRED',
        message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
      });
    }

    // Re-throw if it's already a createError
    if (err instanceof Error && 'code' in err) {
      throw err;
    }

    throw createError({
      code: 'CUSTOM_JWT_INVALID',
      message: 'Oturum bilgisi geçersiz.',
    });
  }
}

/**
 * User info için basit payload oluşturur.
 */
export interface UserInfo {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

/**
 * User info'dan custom JWT payload oluşturur.
 */
export function createCustomJWTPayload(userInfo: UserInfo): CustomJWTPayload {
  return {
    sub: userInfo.id,
    tenant_id: userInfo.tenantId,
    email: userInfo.email,
    name: userInfo.name,
    role: userInfo.role,
    permissions: userInfo.permissions,
  };
}

/**
 * Token'dan kalan süreyi hesaplar (milisaniye).
 */
export function getTimeUntilExpiry(payload: CustomJWTPayload): number | null {
  if (!payload.exp) return null;

  const expMs = payload.exp * 1000;
  const now = Date.now();
  const remaining = expMs - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Access token yenileme için kullanılır.
 * Mevcut token'dan yeni bir access token üretir.
 */
export async function refreshAccessToken(
  currentToken: string,
  userInfo: UserInfo
): Promise<SignResult> {
  // Mevcut token'ı validate et (expire olmamalı)
  const payload = await verifyCustomJWT(currentToken);

  // SECURITY FIX: Verify token claims match userInfo to prevent privilege escalation.
  // Without this check, an attacker could present a valid token but pass different
  // userInfo (e.g. elevated role/tenant) to get a new token with escalated privileges.
  if (payload.sub !== userInfo.id || payload.tenant_id !== userInfo.tenantId) {
    throw createError({
      code: 'UNAUTHORIZED',
      message: 'Token bilgileri kullanıcı bilgileri ile eşleşmiyor.',
    });
  }

  // Yeni access token oluştur
  return signCustomJWT(createCustomJWTPayload(userInfo), {
    tokenType: 'access',
    tenantId: userInfo.tenantId,
  });
}

/**
 * Token'ın belirli bir süre içinde expire olup olmadığını kontrol eder.
 */
export function isTokenExpiringSoon(
  payload: CustomJWTPayload,
  withinSeconds: number = 300 // Default 5 minutes
): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(payload);
  if (timeUntilExpiry === null) return false;

  const thresholdMs = withinSeconds * 1000;
  return timeUntilExpiry <= thresholdMs;
}
