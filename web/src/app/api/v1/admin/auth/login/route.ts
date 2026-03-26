import { jsonError, jsonOk } from "@/lib/api-response";
import {
  attachAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/admin-session";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "請輸入有效的電郵及密碼", 422);
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin?.isActive) {
      return jsonError("AUTH_INVALID", "帳號或密碼不正確", 401);
    }

    const ok = await verifyPassword(admin.passwordHash, parsed.data.password);
    if (!ok) {
      return jsonError("AUTH_INVALID", "帳號或密碼不正確", 401);
    }

    const token = await signAdminSession({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const res = jsonOk({
      ok: true,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
    return attachAdminSessionCookie(res, token);
  } catch (e) {
    console.error("[admin/login]", e);
    if (e instanceof Error && e.message.includes("JWT_SECRET")) {
      return jsonError(
        "SERVER_MISCONFIGURED",
        "伺服器 JWT_SECRET 未正確設定（至少 16 字元）",
        500
      );
    }
    return jsonError(
      "SERVER_ERROR",
      "無法連接資料庫或伺服器錯誤。請確認 PostgreSQL 已啟動，並已執行 npx prisma migrate deploy 及 npm run db:seed。",
      500
    );
  }
}
