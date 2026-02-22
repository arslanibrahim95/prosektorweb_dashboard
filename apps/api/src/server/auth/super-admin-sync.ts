import type { SupabaseClient, User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

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
      logger.error("[super-admin-sync] listUsers failed", { message: error.message });
      return;
    }

    const users = data?.users ?? [];
    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (!email || !targetEmails.has(email)) continue;

      syncedEmails.add(email);
      if (hasSuperAdminRole(user)) continue;

      const nextAppMeta = Object.assign(
        {},
        (user.app_metadata ?? {}) as Record<string, unknown>,
        { role: "super_admin" }
      );

      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: nextAppMeta,
      });

      if (updateError) {
        logger.error("[super-admin-sync] Failed to set super_admin for user", {
          email,
          message: updateError.message,
        });
      } else {
        logger.info("[super-admin-sync] Applied super_admin metadata for user", {
          email,
        });
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  const notFoundEmails = emails.filter((email) => !syncedEmails.has(email.toLowerCase()));
  if (notFoundEmails.length > 0) {
    logger.warn("[super-admin-sync] Emails not found in auth.users", {
      emails: notFoundEmails.join(", "),
    });
  }
}

export async function ensureSuperAdminStartupSync(admin: SupabaseClient): Promise<void> {
  if (startupSyncPromise) {
    await startupSyncPromise;
    return;
  }

  const emails = parseSuperAdminEmails();
  startupSyncPromise = runStartupSync(admin, emails).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[super-admin-sync] Unexpected startup sync error", { error: message });
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

  const nextAppMeta = Object.assign(
    {},
    (user.app_metadata ?? {}) as Record<string, unknown>,
    { role: "super_admin" }
  );

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: nextAppMeta,
  });

  if (error) {
    logger.error("[super-admin-sync] Failed per-user bootstrap for user", {
      email,
      message: error.message,
    });
    return user;
  }

  return {
    ...user,
    app_metadata: nextAppMeta,
  };
}
