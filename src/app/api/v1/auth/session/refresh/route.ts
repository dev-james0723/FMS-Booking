import { jsonError, jsonOk } from "@/lib/api-response";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import {
  attachUserSessionCookie,
  buildUserSessionJwtPayload,
  getSessionFromCookies,
  PRISMA_PROFILE_SELECT_FOR_SESSION_JWT,
  signUserSession,
} from "@/lib/auth/session";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

/** Re-signs the session cookie from the database (e.g. after post-registration social steps). */
export async function POST() {
  const locale = await serverLocaleFromCookies();
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError(
      "UNAUTHORIZED",
      apiBilingual(locale, "尚未登入", "Not signed in"),
      401
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      credentials: true,
      profile: { select: PRISMA_PROFILE_SELECT_FOR_SESSION_JWT },
    },
  });

  if (!user?.credentials) {
    return jsonError(
      "NOT_FOUND",
      apiBilingual(locale, "找不到帳戶", "Account not found"),
      404
    );
  }

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
