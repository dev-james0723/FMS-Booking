import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  attachUserSessionCookie,
  buildUserSessionJwtPayload,
  PRISMA_PROFILE_SELECT_FOR_SESSION_JWT,
  signUserSession,
} from "@/lib/auth/session";
import { verifyPasswordResetSmsProof } from "@/lib/password-reset-sms-proof";
import { hashPassword } from "@/lib/password";
import { hashPasswordResetToken } from "@/lib/password-reset-token";
import { z } from "zod";

const schema = z
  .object({
    newPassword: z.string().min(10).max(128),
  })
  .and(
    z.union([
      z.object({
        emailToken: z.string().min(32).max(256),
        smsResetToken: z.undefined().optional(),
      }),
      z.object({
        smsResetToken: z.string().min(20).max(4096),
        emailToken: z.undefined().optional(),
      }),
    ])
  );

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  const { newPassword } = parsed.data;
  const emailToken =
    "emailToken" in parsed.data && typeof parsed.data.emailToken === "string"
      ? parsed.data.emailToken
      : undefined;
  const smsResetToken =
    "smsResetToken" in parsed.data && typeof parsed.data.smsResetToken === "string"
      ? parsed.data.smsResetToken
      : undefined;

  if ((emailToken ? 1 : 0) + (smsResetToken ? 1 : 0) !== 1) {
    return jsonError("VALIDATION_ERROR", "Provide either emailToken or smsResetToken", 422);
  }

  try {
    let userId: string;

    if (emailToken) {
      const tokenHash = hashPasswordResetToken(emailToken);
      const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              credentials: true,
              profile: { select: { bookingVenueKind: true } },
            },
          },
        },
      });

      if (
        !row ||
        row.usedAt ||
        row.expiresAt.getTime() <= Date.now() ||
        !row.user.credentials ||
        row.user.accountStatus !== "active"
      ) {
        return jsonError(
          "INVALID_OR_EXPIRED_TOKEN",
          "連結無效或已過期，請重新申請重設密碼。",
          400
        );
      }

      userId = row.userId;

      const newHash = await hashPassword(newPassword);

      await prisma.$transaction([
        prisma.passwordResetToken.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.updateMany({
          where: { userId, usedAt: null, id: { not: row.id } },
          data: { usedAt: new Date() },
        }),
        prisma.loginCredential.update({
          where: { userId },
          data: { passwordHash: newHash, mustChangePassword: false },
        }),
      ]);
    } else {
      const proof = await verifyPasswordResetSmsProof(smsResetToken!);
      if (!proof) {
        return jsonError(
          "INVALID_OR_EXPIRED_TOKEN",
          "驗證已過期，請重新索取短訊驗證碼。",
          400
        );
      }

      const challenge = await prisma.passwordResetPhoneChallenge.findUnique({
        where: { id: proof.challengeId },
      });

      if (
        !challenge ||
        challenge.userId !== proof.userId ||
        !challenge.verifiedAt ||
        challenge.consumedAt ||
        challenge.expiresAt.getTime() <= Date.now()
      ) {
        return jsonError(
          "INVALID_OR_EXPIRED_TOKEN",
          "驗證已失效，請重新申請重設密碼。",
          400
        );
      }

      userId = proof.userId;

      const preUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          accountStatus: true,
          credentials: { select: { id: true } },
        },
      });
      if (!preUser?.credentials || preUser.accountStatus !== "active") {
        return jsonError("AUTH_DISABLED", "帳戶無法重設密碼。", 403);
      }

      const newHash = await hashPassword(newPassword);

      await prisma.$transaction([
        prisma.passwordResetPhoneChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        }),
        prisma.passwordResetToken.updateMany({
          where: { userId, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.loginCredential.update({
          where: { userId },
          data: { passwordHash: newHash, mustChangePassword: false },
        }),
      ]);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        credentials: true,
        profile: { select: PRISMA_PROFILE_SELECT_FOR_SESSION_JWT },
      },
    });

    if (!user.credentials) {
      return jsonError("NOT_FOUND", "找不到登入憑證。", 404);
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
  } catch (e) {
    console.error("[forgot-password/complete]", e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError
    ) {
      return jsonError("DATABASE_ERROR", "無法儲存新密碼。", 500);
    }
    return jsonError("INTERNAL", "發生錯誤。", 500);
  }
}
