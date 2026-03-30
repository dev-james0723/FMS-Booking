import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { resolveUserForPasswordReset } from "@/lib/auth/resolve-user-for-password-reset";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { isJwtSecretConfigured } from "@/lib/jwt-secret";
import {
  generatePasswordResetRawToken,
  hashPasswordResetToken,
} from "@/lib/password-reset-token";
import { hashPhoneOtp } from "@/lib/phone-otp";
import { sendSms } from "@/lib/sms/send-sms";
import { randomInt } from "crypto";
import { z } from "zod";

function safeInternalNext(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return undefined;
  if (t.length > 512) return undefined;
  return t;
}

const bodySchema = z.object({
  identifier: z.string().min(3).max(200),
  channel: z.enum(["email", "phone"]),
  next: z.string().optional(),
});

const SEND_COOLDOWN_MS = 60_000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000;

function genericOk() {
  return jsonOk({
    ok: true,
    message:
      "如該資料與已登記帳戶相符，我們已發送重設指示（請檢查電郵或短訊）。",
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  try {
    const resolved = await resolveUserForPasswordReset(parsed.data.identifier);
    if (!resolved || !resolved.hasCredentials || resolved.accountStatus !== "active") {
      return genericOk();
    }

    if (parsed.data.channel === "email") {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: resolved.id, usedAt: null },
      });

      const rawToken = generatePasswordResetRawToken();
      const tokenHash = hashPasswordResetToken(rawToken);
      const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

      await prisma.passwordResetToken.create({
        data: {
          userId: resolved.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail({
        userId: resolved.id,
        toEmail: resolved.email,
        rawToken,
        nextPath: safeInternalNext(parsed.data.next),
      });

      return genericOk();
    }

    if (!isJwtSecretConfigured()) {
      console.error("[forgot-password/start] JWT_SECRET missing for OTP hashing");
      return jsonError(
        "SERVER_MISCONFIGURED",
        "伺服器設定未完成，暫時無法發送驗證碼。",
        500
      );
    }

    const phoneNorm = resolved.phoneNorm;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSends = await prisma.passwordResetPhoneChallenge.count({
      where: { phoneNorm, createdAt: { gte: hourAgo } },
    });
    if (recentSends >= MAX_SENDS_PER_HOUR) {
      return genericOk();
    }

    const latest = await prisma.passwordResetPhoneChallenge.findFirst({
      where: { phoneNorm, verifiedAt: null, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (latest && latest.createdAt.getTime() > Date.now() - SEND_COOLDOWN_MS) {
      return genericOk();
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = hashPhoneOtp(phoneNorm, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const challenge = await prisma.passwordResetPhoneChallenge.create({
      data: {
        userId: resolved.id,
        phoneNorm,
        codeHash,
        expiresAt,
      },
    });

    const smsBody = `【幻樂空間 / D Festival】重設登入密碼驗證碼：${code}（10 分鐘內有效，請勿向他人透露。）`;
    const sms = await sendSms({ toE164: phoneNorm, body: smsBody });

    if (!sms.ok) {
      await prisma.passwordResetPhoneChallenge.delete({ where: { id: challenge.id } });
      console.error("[forgot-password/start] SMS failed", sms.error);
      return jsonError("SMS_FAILED", sms.error, 502);
    }

    return genericOk();
  } catch (e) {
    console.error("[forgot-password/start]", e);
    if (e instanceof Error && e.message.includes("JWT_SECRET")) {
      return jsonError("SERVER_MISCONFIGURED", "伺服器設定未完成。", 500);
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError
    ) {
      return jsonError("DATABASE_ERROR", "無法處理請求，請稍後再試。", 500);
    }
    return jsonError("INTERNAL", "發生錯誤，請稍後再試。", 500);
  }
}
