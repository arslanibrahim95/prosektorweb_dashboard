export interface ServerEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  siteTokenSecret: string;
  storageBucketPrivateCv: string;
  storageBucketPublicMedia: string;
}

let cachedEnv: ServerEnv | null = null;

function pickEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function requireEnv(name: string): string {
  const value = pickEnv(name);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const supabaseUrl = pickEnv("SUPABASE_URL") ?? pickEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("Missing required env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }

  cachedEnv = {
    supabaseUrl,
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    siteTokenSecret: requireEnv("SITE_TOKEN_SECRET"),
    storageBucketPrivateCv: pickEnv("STORAGE_BUCKET_PRIVATE_CV") ?? "private-cv",
    storageBucketPublicMedia: pickEnv("STORAGE_BUCKET_PUBLIC_MEDIA") ?? "public-media",
  };

  return cachedEnv;
}

