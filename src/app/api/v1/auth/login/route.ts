import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { verifyPassword } from "@/lib/password";
import { attachUserSessionCookie, signUserSession } from "@/lib/auth/session";
import { isUserFacingDbLoadFailure } from "@/lib/prisma-user-facing-errors";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid credentials payload", 422);
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true, profile: { select: { bookingVenueKind: true } } },
    });

    if (!user?.credentials) {
      return jsonError("AUTH_INVALID", "Invalid email or password", 401);
    }

    if (user.accountStatus !== "active") {
      return jsonError("AUTH_DISABLED", "Account is not active", 403);
    }

    const ok = await verifyPassword(user.credentials.passwordHash, parsed.data.password);
    if (!ok) {
      return jsonError("AUTH_INVALID", "Invalid email or password", 401);
    }

    await prisma.loginCredential.update({
      where: { userId: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signUserSession({
      sub: user.id,
      email: user.email,
      accountStatus: user.accountStatus,
      mustChangePassword: user.credentials.mustChangePassword,
      hasCompletedRegistration: user.hasCompletedRegistration,
      bookingVenueKind: user.profile?.bookingVenueKind ?? "studio_room",
    });

    const res = jsonOk({
      ok: true,
      mustChangePassword: user.credentials.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        mustChangePassword: user.credentials.mustChangePassword,
        hasCompletedRegistration: user.hasCompletedRegistration,
      },
    });
    return attachUserSessionCookie(res, token);
  } catch (e) {
    if (isUserFacingDbLoadFailure(e)) {
      console.error("[auth/login] database unavailable or schema mismatch", e);
      return jsonError(
        "DATABASE_UNAVAILABLE",
        "伺服器暫時無法連接資料庫，或資料庫尚未更新至最新版本。請稍後再試；若持續發生，請聯絡主辦方並確認 Vercel 已設定 DATABASE_URL 及部署時已執行資料庫 migration。",
        503
      );
    }
    console.error("[auth/login]", e);
    return jsonError("INTERNAL", "登入時發生錯誤，請稍後再試。", 500);
  }
}
