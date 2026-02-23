import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseCookieStorage } from "./supabase-cookie-storage";

let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (cachedBrowserClient) return cachedBrowserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      // PKCE flow for secure cookie-based auth
      flowType: 'pkce',
      persistSession: true,
      storage: supabaseCookieStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedBrowserClient;
}

