import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { isJwtSecretConfigured } from "@/lib/jwt-secret";
import { signPasswordResetSmsProof } from "@/lib/password-reset-sms-proof";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { verifyPhoneOtp } from "@/lib/phone-otp";
import { z } from "zod";

const bodySchema = z.object({
  phone: z.string().min(5).max(30),
  code: z.string().regex(/^\d{6}$/, "驗證碼須為 6 位數字"),
});

const MAX_VERIFY_ATTEMPTS = 10;

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

  const phoneNorm = normalizePhoneForSms(parsed.data.phone);
  if (!phoneNorm) {
    return jsonError("INVALID_PHONE", "電話號碼格式不正確。", 400);
  }

  if (!isJwtSecretConfigured()) {
    return jsonError("SERVER_MISCONFIGURED", "伺服器設定未完成。", 500);
  }

  try {
    const challenge = await prisma.passwordResetPhoneChallenge.findFirst({
      where: {
        phoneNorm,
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return jsonError(
        "NO_ACTIVE_CODE",
        "沒有有效的驗證碼，請先於「忘記密碼」頁面重新索取。",
        400
      );
    }

    if (challenge.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      return jsonError(
        "TOO_MANY_ATTEMPTS",
        "驗證碼嘗試次數過多，請重新索取驗證碼。",
        429
      );
    }

    const ok = verifyPhoneOtp(phoneNorm, parsed.data.code, challenge.codeHash);

    if (!ok) {
      await prisma.passwordResetPhoneChallenge.update({
        where: { id: challenge.id },
        data: { verifyAttempts: { increment: 1 } },
      });
      return jsonError("INVALID_CODE", "驗證碼不正確。", 400);
    }

    await prisma.passwordResetPhoneChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    const smsResetToken = await signPasswordResetSmsProof({
      challengeId: challenge.id,
      userId: challenge.userId,
    });

    return jsonOk({ ok: true, smsResetToken });
  } catch (e) {
    console.error("[forgot-password/verify-phone]", e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError
    ) {
      return jsonError("DATABASE_ERROR", "無法連接資料庫。", 500);
    }
    return jsonError("INTERNAL", "驗證時發生錯誤。", 500);
  }
}
