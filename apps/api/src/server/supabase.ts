import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

const MAX_BEARER_TOKEN_LENGTH = 8 * 1024;

/**
 * Authorization Bearer header'dan token çıkarır.
 * 
 * @param req - HTTP request
 * @returns Bearer token veya null
 */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  if (header.length > MAX_BEARER_TOKEN_LENGTH + 20) return null;

  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  if (!match) return null;

  const token = match[1];
  if (!token || token.length === 0 || token.length > MAX_BEARER_TOKEN_LENGTH) return null;

  return token.trim();
}

/**
 * Server-side Supabase auth yapılandırması oluşturur.
 * Bu yapılandırma session persistence devre dışı bırakır çünkü
 * server-side işlemler stateless'tır.
 */
function createServerAuthConfig() {
  return {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  };
}

/**
 * Admin Supabase client oluşturur.
 * Service role key kullanarak tüm tablolara erişim sağlar.
 * RLS (Row Level Security) atlanır.
 */
export function createAdminClient(): SupabaseClient {
  const env = getServerEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: createServerAuthConfig(),
  });
}

/**
 * Bearer token kullanarak user client oluşturur.
 * Auth header'ı manuel olarak eklenir.
 */
export function createUserClientFromBearer(token: string): SupabaseClient {
  const env = getServerEnv();

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: createServerAuthConfig(),
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
