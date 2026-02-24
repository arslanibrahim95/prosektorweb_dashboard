import type { UserRole } from "@prosektor/contracts";
import { HttpError, mapPostgrestError } from "@/server/api/http";
import type { AuthContext } from "@/server/auth/context";

export type PageOrigin = "panel" | "site_engine" | "unknown";

interface PageOriginRow {
  id: string;
  origin: PageOrigin;
}

export async function getPageOriginForTenant(
  ctx: AuthContext,
  pageId: string,
): Promise<PageOriginRow> {
  const { data, error } = await ctx.supabase
    .from("pages")
    .select("id, origin")
    .eq("tenant_id", ctx.tenant.id)
    .eq("id", pageId)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }

  if (!data) {
    throw new HttpError(404, {
      code: "NOT_FOUND",
      message: "Not found",
    });
  }

  return data as PageOriginRow;
}

export function assertPageEditableByPanelRole(origin: PageOrigin, role: UserRole): void {
  if (role === "super_admin") {
    return;
  }

  if (origin !== "panel") {
    throw new HttpError(403, {
      code: "PAGE_READ_ONLY",
      message: "Bu sayfa panelden düzenlenemez.",
    });
  }
}
