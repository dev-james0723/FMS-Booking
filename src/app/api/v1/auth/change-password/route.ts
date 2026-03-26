import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  attachUserSessionCookie,
  getSessionFromCookies,
  signUserSession,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError("UNAUTHORIZED", "Not logged in", 401);
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
    return jsonError("NOT_FOUND", "No credentials", 404);
  }

  const match = await verifyPassword(cred.passwordHash, parsed.data.currentPassword);
  if (!match) {
    return jsonError("AUTH_INVALID", "Current password incorrect", 401);
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
    include: { credentials: true },
  });

  const token = await signUserSession({
    sub: user.id,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: false,
    hasCompletedRegistration: user.hasCompletedRegistration,
  });
  const res = jsonOk({ ok: true });
  return attachUserSessionCookie(res, token);
}
