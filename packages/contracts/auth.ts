/**
 * Auth Contracts
 *
 * Authentication ve authorization için Zod schema'ları ve type'ları.
 */

import { z } from 'zod';
import { userRoleSchema, uuidSchema } from './common';

// ===== LOGIN SCHEMAS =====

/**
 * Login request schema
 */
export const loginRequestSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  redirectTo: z.string().optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// ===== TOKEN SCHEMAS =====

/**
 * Token exchange request schema
 */
export const tokenExchangeRequestSchema = z.object({
  rememberMe: z.boolean().optional().default(false),
});

export type TokenExchangeRequest = z.infer<typeof tokenExchangeRequestSchema>;

/**
 * Token exchange response schema
 */
export const tokenExchangeResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_at: z.string().datetime(),
  token_type: z.literal('Bearer'),
});

export type TokenExchangeResponse = z.infer<typeof tokenExchangeResponseSchema>;

// ===== SESSION SCHEMAS =====

/**
 * Session info schema
 */
export const sessionInfoSchema = z.object({
  accessToken: z.string().optional(),
  expiresAt: z.number().optional(),
  timeUntilExpiry: z.number().optional(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;

// ===== CUSTOM JWT PAYLOAD =====

/**
 * Custom JWT payload schema
 */
export const customJWTPayloadSchema = z.object({
  sub: z.string(), // User ID
  tenant_id: z.string(), // Tenant ID
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

// ===== SESSION WARNING =====

/**
 * Session warning level
 */
export const sessionWarningLevelSchema = z.enum(['none', 'warning', 'critical']);

export type SessionWarningLevel = z.infer<typeof sessionWarningLevelSchema>;

/**
 * Session warning state schema
 */
export const sessionWarningStateSchema = z.object({
  show: z.boolean(),
  level: sessionWarningLevelSchema,
  timeUntilExpiry: z.number(), // milliseconds
});

export type SessionWarningState = z.infer<typeof sessionWarningStateSchema>;

// ===== AUTH CONTEXT VALUES =====

/**
 * Auth status
 */
export const authStatusSchema = z.enum(['loading', 'authenticated', 'unauthenticated']);

export type AuthStatus = z.infer<typeof authStatusSchema>;

// ===== ERROR MESSAGES =====

/**
 * Auth error codes
 */
export const authErrorCodes = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'TOKEN_EXPIRED',
  'INVALID_TOKEN',
  'NO_TENANT',
  'SESSION_EXPIRED',
  'SESSION_REFRESH_FAILED',
  'REMEMBER_ME_TOKEN_INVALID',
  'CUSTOM_JWT_INVALID',
  'CUSTOM_JWT_EXPIRED',
  'INVALID_CREDENTIALS',
]);

export type AuthErrorCode = z.infer<typeof authErrorCodes>;

/**
 * Auth error response schema
 */
export const authErrorResponseSchema = z.object({
  code: authErrorCodes,
  message: z.string(),
  details: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string())]),
  ).optional(),
});

export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;

// ===== TOKEN REFRESH =====

/**
 * Token refresh state schema
 */
export const tokenRefreshStateSchema = z.object({
  isRefreshing: z.boolean(),
  lastRefreshAttempt: z.number(),
  retryCount: z.number(),
});

export type TokenRefreshState = z.infer<typeof tokenRefreshStateSchema>;

// ===== REMEMBER ME =====

/**
 * Remember me options
 */
export const rememberMeOptionsSchema = z.object({
  enabled: z.boolean().default(false),
  days: z.number().int().min(1).max(365).default(30),
});

export type RememberMeOptions = z.infer<typeof rememberMeOptionsSchema>;

// ===== EXPORT ALL =====

export const authSchemas = {
  loginRequest: loginRequestSchema,
  loginResponse: loginResponseSchema,
  tokenExchangeRequest: tokenExchangeRequestSchema,
  tokenExchangeResponse: tokenExchangeResponseSchema,
  sessionInfo: sessionInfoSchema,
  customJWTPayload: customJWTPayloadSchema,
  sessionWarningState: sessionWarningStateSchema,
  authStatus: authStatusSchema,
  authErrorResponse: authErrorResponseSchema,
  tokenRefreshState: tokenRefreshStateSchema,
  rememberMeOptions: rememberMeOptionsSchema,
} as const;
