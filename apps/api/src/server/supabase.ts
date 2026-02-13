import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getServerEnv } from "./env";

/**
 * Authorization Bearer header'dan token çıkarır.
 * 
 * @param req - HTTP request
 * @returns Bearer token veya null
 */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
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

/**
 * Cookie'lerden session kullanarak user client oluşturur.
 * Next.js server-side context'inde çalışır.
 */
export async function createUserClientFromCookies(): Promise<SupabaseClient> {
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}
