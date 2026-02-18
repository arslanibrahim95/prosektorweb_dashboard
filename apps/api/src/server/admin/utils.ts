/**
 * Admin Shared Utilities
 *
 * Common utility functions used across admin API routes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extracts a human-readable user name from Supabase user metadata,
 * falling back to e-mail address.
 */
export function safeUserName(
    email?: string,
    meta?: Record<string, unknown> | null,
): string | undefined {
    const nameCandidate = meta?.name?.toString().trim();
    if (nameCandidate && nameCandidate.length > 0) return nameCandidate;
    return email;
}

export interface EnrichedUserInfo {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    invited_at?: string | null;
    last_sign_in_at?: string | null;
    created_at?: string;
}

/**
 * Batch-fetches user details from Supabase Auth Admin API,
 * processing in chunks to avoid overwhelming rate limits.
 */
export async function batchFetchUsers(
    admin: SupabaseClient,
    userIds: string[],
    batchSize = 10,
): Promise<Map<string, EnrichedUserInfo>> {
    const usersById = new Map<string, EnrichedUserInfo>();

    for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
            batch.map((userId) => admin.auth.admin.getUserById(userId)),
        );

        for (let j = 0; j < results.length; j++) {
            const result = results[j];
            if (result.status !== "fulfilled") continue;
            const { data: userData, error: userError } = result.value;
            if (userError) continue;
            const user = userData.user;
            if (!user) continue;

            const email = user.email ?? undefined;
            const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
            const avatar_url = userMeta.avatar_url?.toString() || undefined;
            const name = safeUserName(email, userMeta);

            usersById.set(batch[j], {
                id: batch[j],
                email,
                name,
                avatar_url,
                invited_at: (user as unknown as { invited_at?: string | null }).invited_at ?? null,
                last_sign_in_at: (user as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
                created_at: user.created_at,
            });
        }
    }

    return usersById;
}

/**
 * Role hierarchy for privilege escalation prevention.
 * Higher number = higher privilege.
 */
const ROLE_HIERARCHY: Record<string, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
    owner: 4,
    super_admin: 5,
};

/**
 * Checks whether the actor's role is allowed to assign the target role.
 * An actor cannot assign a role equal to or higher than their own,
 * unless they are the owner or super_admin.
 */
export function canAssignRole(actorRole: string, targetRole: string): boolean {
    const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;

    // owner and super_admin can assign any role
    if (actorLevel >= ROLE_HIERARCHY.owner) return true;

    // Others can only assign roles strictly below their own level
    return targetLevel < actorLevel;
}
