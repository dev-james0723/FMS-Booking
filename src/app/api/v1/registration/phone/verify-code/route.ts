import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { isJwtSecretConfigured } from "@/lib/jwt-secret";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { verifyPhoneOtp } from "@/lib/phone-otp";
import { signPhoneRegistrationProof } from "@/lib/phone-registration-proof";
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
    console.error(
      "[registration/phone/verify-code] JWT_SECRET missing or shorter than 16 characters"
    );
    return jsonError(
      "SERVER_MISCONFIGURED",
      "伺服器設定未完成，無法驗證號碼。請聯絡主辦方。",
      500
    );
  }

  try {
    const phoneTaken = await prisma.userProfile.findUnique({
      where: { phone: phoneNorm },
      select: { userId: true },
    });
    if (phoneTaken) {
      return jsonError(
        "PHONE_EXISTS",
        "此電話號碼已用於登記另一個帳戶；每個號碼只可綁定一個帳戶。",
        409
      );
    }

    const challenge = await prisma.phoneOtpChallenge.findFirst({
      where: {
        phoneNorm,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return jsonError(
        "NO_ACTIVE_CODE",
        "沒有有效的驗證碼，請先按「發送驗證碼」。",
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
      await prisma.phoneOtpChallenge.update({
        where: { id: challenge.id },
        data: { verifyAttempts: { increment: 1 } },
      });
      return jsonError("INVALID_CODE", "驗證碼不正確。", 400);
    }

    await prisma.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    const phoneVerificationToken = await signPhoneRegistrationProof({
      challengeId: challenge.id,
      phoneNorm,
    });

    return jsonOk({ ok: true, phoneVerificationToken });
  } catch (e) {
    console.error("[registration/phone/verify-code]", e);
    if (e instanceof Error && e.message.includes("JWT_SECRET")) {
      return jsonError(
        "SERVER_MISCONFIGURED",
        "伺服器設定未完成，無法驗證號碼。請聯絡主辦方。",
        500
      );
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError
    ) {
      return jsonError(
        "DATABASE_ERROR",
        "無法連接資料庫。請稍後再試；如問題持續，請聯絡主辦方。",
        500
      );
    }
    return jsonError("INTERNAL", "驗證時發生錯誤，請稍後再試。", 500);
  }
}
