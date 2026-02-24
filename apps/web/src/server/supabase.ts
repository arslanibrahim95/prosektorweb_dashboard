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
  // Önce Authorization header'ı kontrol et
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (header) {
    if (header.length > MAX_BEARER_TOKEN_LENGTH + 20) return null;
    const match = /^Bearer\s+(\S+)$/.exec(header.trim());
    if (match) {
      const token = match[1];
      if (token && token.length > 0 && token.length <= MAX_BEARER_TOKEN_LENGTH) {
        return token.trim();
      }
    }
  }

  // Cookie'dan Supabase token'ı dene (httpOnly olmayan cookie - JS erişimi için)
  const cookieHeader = req.headers.get("cookie") ?? req.headers.get("Cookie");
  if (cookieHeader) {
    // supabase-auth-token cookie'sını kontrol et
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('sb-') && cookie.includes('-auth-token=')) {
        const tokenMatch = cookie.match(/sb-[\w]+-auth-token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          try {
            // Cookie değeri URL-encoded olabilir
            const decoded = decodeURIComponent(tokenMatch[1]);
            // JSON.parse ile access_token'ı çıkar
            const tokenData = JSON.parse(decoded);
            if (tokenData.access_token && tokenData.access_token.length <= MAX_BEARER_TOKEN_LENGTH) {
              return tokenData.access_token;
            }
          } catch {
            // JSON parse hatası - cookie formatı farklı
          }
        }
      }
    }
  }

  return null;
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
