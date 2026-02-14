import type { SupabaseClient, User } from "@supabase/supabase-js";

let startupSyncPromise: Promise<void> | null = null;

function parseSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  if (!raw.trim()) return [];

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    ),
  );
}

function hasSuperAdminRole(user: Pick<User, "app_metadata">): boolean {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  if (appMeta.role === "super_admin") return true;
  if (Array.isArray(appMeta.roles) && appMeta.roles.includes("super_admin")) return true;
  return false;
}

async function runStartupSync(admin: SupabaseClient, emails: string[]): Promise<void> {
  if (emails.length === 0) return;

  const targetEmails = new Set(emails.map((email) => email.toLowerCase()));
  const syncedEmails = new Set<string>();
  let page = 1;
  const perPage = 500;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[super-admin-sync] listUsers failed:", error.message);
      return;
    }

    const users = data?.users ?? [];
    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (!email || !targetEmails.has(email)) continue;

      syncedEmails.add(email);
      if (hasSuperAdminRole(user)) continue;

      const nextAppMeta = {
        ...((user.app_metadata ?? {}) as Record<string, unknown>),
        role: "super_admin",
      };

      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: nextAppMeta,
      });

      if (updateError) {
        console.error(
          `[super-admin-sync] Failed to set super_admin for ${email}:`,
          updateError.message,
        );
      } else {
        console.info(`[super-admin-sync] Applied super_admin metadata for ${email}`);
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  const notFoundEmails = emails.filter((email) => !syncedEmails.has(email.toLowerCase()));
  if (notFoundEmails.length > 0) {
    console.warn(
      "[super-admin-sync] Emails not found in auth.users:",
      notFoundEmails.join(", "),
    );
  }
}

export async function ensureSuperAdminStartupSync(admin: SupabaseClient): Promise<void> {
  if (startupSyncPromise) {
    await startupSyncPromise;
    return;
  }

  const emails = parseSuperAdminEmails();
  startupSyncPromise = runStartupSync(admin, emails).catch((error) => {
    console.error("[super-admin-sync] Unexpected startup sync error:", error);
  });

  await startupSyncPromise;
}

export async function ensureSuperAdminBootstrapForUser(
  admin: SupabaseClient,
  user: User,
): Promise<User> {
  const email = user.email?.toLowerCase();
  if (!email) return user;

  const allowlist = parseSuperAdminEmails();
  if (!allowlist.includes(email)) return user;
  if (hasSuperAdminRole(user)) return user;

  const nextAppMeta = {
    ...((user.app_metadata ?? {}) as Record<string, unknown>),
    role: "super_admin",
  };

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: nextAppMeta,
  });

  if (error) {
    console.error(
      `[super-admin-sync] Failed per-user bootstrap for ${email}:`,
      error.message,
    );
    return user;
  }

  return {
    ...user,
    app_metadata: nextAppMeta,
  };
}

