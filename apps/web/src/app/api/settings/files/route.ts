import { asErrorBody, asHeaders, asStatus, jsonError, jsonOk } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "tenant-files";
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    const { data: files, error } = await ctx.supabase.storage
      .from(BUCKET_NAME)
      .list(ctx.tenant.id);

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    // Transform files to include metadata
    const fileList = (files ?? [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        size: f.metadata?.size ?? 0,
        created_at: f.created_at,
        mimetype: f.metadata?.mimetype ?? 'application/octet-stream',
      }));

    return jsonOk({ files: fileList });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return jsonError({ message: 'Dosya gerekli', code: 'FILE_REQUIRED' }, 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonError({ message: 'Dosya boyutu 10MB\'i aşamaz', code: 'FILE_TOO_LARGE' }, 400);
    }

    // Validate file type
    if (!ALLOWED_MIMETYPES.includes(file.type)) {
      return jsonError({ message: 'Yalnızca görseller (JPEG, PNG, WebP, GIF) ve PDF dosyaları yüklenebilir', code: 'INVALID_FILE_TYPE' }, 400);
    }

    // Sanitize filename
    let filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!filename) {
      filename = `file_${Date.now()}`;
    }

    // Upload file to storage
    const { error: uploadError } = await ctx.supabase.storage
      .from(BUCKET_NAME)
      .upload(`${ctx.tenant.id}/${filename}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    return jsonOk({ filename, size: file.size });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
