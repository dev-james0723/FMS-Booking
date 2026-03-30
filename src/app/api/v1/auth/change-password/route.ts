import { jsonError, jsonOk } from "@/lib/api-response";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";
import {
  attachUserSessionCookie,
  buildUserSessionJwtPayload,
  getSessionFromCookies,
  PRISMA_PROFILE_SELECT_FOR_SESSION_JWT,
  signUserSession,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  const locale = await serverLocaleFromCookies();
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError(
      "UNAUTHORIZED",
      apiBilingual(locale, "尚未登入", "Not logged in"),
      401
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  const cred = await prisma.loginCredential.findUnique({
    where: { userId: session.sub },
  });
  if (!cred) {
    return jsonError(
      "NOT_FOUND",
      apiBilingual(locale, "找不到登入憑證", "No credentials on file"),
      404
    );
  }

  const match = await verifyPassword(cred.passwordHash, parsed.data.currentPassword);
  if (!match) {
    return jsonError(
      "AUTH_INVALID",
      apiBilingual(locale, "目前密碼不正確", "Current password incorrect"),
      401
    );
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  await prisma.loginCredential.update({
    where: { userId: session.sub },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.sub },
    include: {
      credentials: true,
      profile: { select: PRISMA_PROFILE_SELECT_FOR_SESSION_JWT },
    },
  });

  const token = await signUserSession(
    buildUserSessionJwtPayload({
      id: user.id,
      email: user.email,
      accountStatus: user.accountStatus,
      hasCompletedRegistration: user.hasCompletedRegistration,
      credentials: user.credentials,
      profile: user.profile,
    })
  );
  const res = jsonOk({ ok: true });
  return attachUserSessionCookie(res, token);
}
