import { jsonError, type ApiErrorBody } from "@/lib/api-response";
import { getAdminSessionFromCookies } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import type { NextResponse } from "next/server";

export async function requireAdminSession(): Promise<
  | { ok: true; adminId: string; email: string; role: string }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return { ok: false, response: jsonError("ADMIN_UNAUTHORIZED", "Admin login required", 401) };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
  });
  if (!admin?.isActive) {
    return { ok: false, response: jsonError("ADMIN_DISABLED", "Admin account inactive", 403) };
  }

  return { ok: true, adminId: admin.id, email: admin.email, role: admin.role };
}
