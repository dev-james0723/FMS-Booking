import { jsonError, type ApiErrorBody } from "@/lib/api-response";
import {
  getAdminSessionFromCookies,
  verifyAdminSessionToken,
  type AdminSessionPayload,
} from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import type { NextResponse } from "next/server";
import { headers } from "next/headers";

async function getAdminSessionFromRequest(): Promise<AdminSessionPayload | null> {
  const fromCookie = await getAdminSessionFromCookies();
  if (fromCookie) return fromCookie;
  const h = await headers();
  const auth = h.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const t = auth.slice(7).trim();
  if (!t) return null;
  return verifyAdminSessionToken(t);
}

export async function requireAdminSession(): Promise<
  | { ok: true; adminId: string; email: string; role: string }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  const session = await getAdminSessionFromRequest();
  if (!session) {
    return {
      ok: false,
      response: jsonError(
        "ADMIN_UNAUTHORIZED",
        "管理員登入已失效或未附上憑證。請重新以密碼登入；若剛登入成功，請再試一次綁定。",
        401
      ),
    };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
  });
  if (!admin?.isActive) {
    return { ok: false, response: jsonError("ADMIN_DISABLED", "Admin account inactive", 403) };
  }

  return { ok: true, adminId: admin.id, email: admin.email, role: admin.role };
}
