import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { registrationSchema } from "@/lib/validation/registration";
import { hashPassword } from "@/lib/password";
import {
  sendRegistrationAdminNotification,
  sendRegistrationConfirmation,
} from "@/lib/email";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { verifyPasskeyPreregToken } from "@/lib/passkey-prereg-token";
import { verifyPhoneRegistrationProof } from "@/lib/phone-registration-proof";
import { AccountStatus, Prisma, RegistrationSubmissionStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { deriveRegistrationProfile } from "@/lib/registration/profile-kind";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  const data = parsed.data;
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    undefined;

  const email = data.email.trim().toLowerCase();
  const phoneNorm = normalizePhoneForSms(data.phone);
  if (!phoneNorm) {
    return jsonError(
      "INVALID_PHONE",
      "電話號碼格式無法用於短訊驗證，請檢查後再試。",
      422
    );
  }

  const phoneProof = await verifyPhoneRegistrationProof(data.phoneVerificationToken);
  if (!phoneProof || phoneProof.phoneNorm !== phoneNorm) {
    return jsonError(
      "PHONE_NOT_VERIFIED",
      "請先完成電話短訊驗證（發送驗證碼並輸入正確的 6 位數字）。",
      400
    );
  }

  const challenge = await prisma.phoneOtpChallenge.findFirst({
    where: {
      id: phoneProof.challengeId,
      phoneNorm,
      verifiedAt: { not: null },
      registrationConsumedAt: null,
    },
  });
  if (!challenge) {
    return jsonError(
      "PHONE_VERIFICATION_EXPIRED",
      "電話驗證已失效，請重新發送驗證碼並完成驗證。",
      400
    );
  }

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

  const idempotencyKey = req.headers.get("idempotency-key") ?? undefined;

  if (idempotencyKey) {
    const existing = await prisma.registrationSubmission.findUnique({
      where: { idempotencyKey },
      include: { user: { include: { credentials: true } } },
    });
    if (existing?.status === RegistrationSubmissionStatus.processed && existing.userId) {
      return jsonOk({
        ok: true,
        idempotent: true,
        userId: existing.userId,
        message: "Already registered",
      });
    }
  }

  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) {
    return jsonError("EMAIL_EXISTS", "This email is already registered", 409);
  }

  const passkeyTok = data.passkeyPreregToken.trim();
  const dec = await verifyPasskeyPreregToken(passkeyTok);
  if (!dec) {
    return jsonError(
      "PASSKEY_TOKEN_INVALID",
      "生物認證憑證無效或已過期，請重新按「綁定 Face ID／指紋」完成驗證。",
      400
    );
  }
  const pkRow = await prisma.passkeyPreregChallenge.findFirst({
    where: {
      id: dec.preregChallengeId,
      emailNorm: email,
      phoneNorm,
      completedAt: { not: null },
      credentialId: { not: null },
      publicKey: { not: null },
      counter: { not: null },
    },
  });
  if (!pkRow?.credentialId || !pkRow.publicKey || pkRow.counter === null) {
    return jsonError(
      "PASSKEY_TOKEN_INVALID",
      "生物認證未完成或已失效，請重新綁定 Face ID／指紋。",
      400
    );
  }
  const passkeyPrereg = {
    id: pkRow.id,
    credentialId: pkRow.credentialId,
    publicKey: pkRow.publicKey,
    counter: pkRow.counter,
    transports: pkRow.transports,
  };

  const derived = deriveRegistrationProfile(data.registrationProfileKind);
  const category = await prisma.userCategory.findUnique({
    where: { code: derived.categoryCode },
  });
  if (!category) {
    return jsonError("INVALID_CATEGORY", "User category not found", 500);
  }

  const tempPassword = nanoid(14);
  const passwordHash = await hashPassword(tempPassword);

  const snapshotFields: Record<string, unknown> = { ...data };
  delete snapshotFields.phoneVerificationToken;
  delete snapshotFields.passkeyPreregToken;
  const payloadSnapshot = JSON.parse(
    JSON.stringify({
      ...snapshotFields,
      phone: phoneNorm,
      isAge17OrAbove: true,
      teacherRecommended: derived.teacherRecommended,
      quotaTier: derived.quotaTier,
      individualEligible: derived.individualEligible,
      teachingEligible: derived.teachingEligible,
    })
  ) as Prisma.InputJsonValue;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          accountStatus: AccountStatus.active,
          hasCompletedRegistration: true,
          category: { connect: { id: category.id } },
          quotaTier: derived.quotaTier,
          referralAttributionCode: data.referralCode?.trim() || null,
          socialFollowSetupToken: data.socialFollowClaimed ? nanoid(32) : null,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          nameZh: data.nameZh.trim(),
          nameEn: data.nameEn?.trim() || null,
          phone: phoneNorm,
          age: data.age,
          isAge17OrAbove: true,
          teacherRecommended: derived.teacherRecommended,
          teacherName: data.teacherName?.trim() || null,
          teacherContact: data.teacherContact?.trim() || null,
          individualEligible: derived.individualEligible,
          teachingEligible: derived.teachingEligible,
          identityFlags: data.identityFlags as Prisma.InputJsonValue,
          identityOtherText:
            data.identityFlags.includes("other") && data.identityOtherText?.trim()
              ? data.identityOtherText.trim()
              : null,
          instrumentField: data.instrumentField.trim(),
          bookingVenueKind: data.bookingVenueKind,
          usagePurposes: data.usagePurposes as Prisma.InputJsonValue,
          preferredDates: (data.preferredDates ?? undefined) as Prisma.InputJsonValue | undefined,
          preferredTimeText: data.preferredTimeText?.trim() || null,
          wantsConsecutiveSlots: null,
          extraNotes: data.extraNotes?.trim() || null,
          interestDfestival: data.interestDfestival,
          interestDmasters: data.interestDmasters,
          marketingOptIn: data.marketingOptIn,
          socialFollowClaimed: data.socialFollowClaimed,
          socialFollowLinkClicks: {},
          socialFollowVerified: false,
          socialRepostClaimed: data.socialRepostClaimed,
          wantsAmbassador: data.wantsAmbassador,
          agreedTerms: data.agreedTerms,
          agreedPrivacy: data.agreedPrivacy,
          agreedEmailNotifications: data.agreedEmailNotifications,
        },
      });

      await tx.loginCredential.create({
        data: {
          userId: user.id,
          passwordHash,
          mustChangePassword: true,
        },
      });

      await tx.webAuthnCredential.create({
        data: {
          userId: user.id,
          credentialId: passkeyPrereg.credentialId,
          publicKey: passkeyPrereg.publicKey,
          counter: passkeyPrereg.counter,
          transports:
            passkeyPrereg.transports === null || passkeyPrereg.transports === undefined
              ? undefined
              : (passkeyPrereg.transports as Prisma.InputJsonValue),
        },
      });
      await tx.passkeyPreregChallenge.delete({
        where: { id: passkeyPrereg.id },
      });

      await tx.registrationSubmission.create({
        data: {
          userId: user.id,
          email,
          payloadSnapshot,
          status: RegistrationSubmissionStatus.processed,
          idempotencyKey: idempotencyKey ?? null,
          clientIp: clientIp ?? null,
        },
      });

      const consumed = await tx.phoneOtpChallenge.updateMany({
        where: {
          id: phoneProof.challengeId,
          phoneNorm,
          verifiedAt: { not: null },
          registrationConsumedAt: null,
        },
        data: { registrationConsumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error("PHONE_VERIFICATION_ALREADY_USED");
      }

      return user;
    });

    let emailOutcome: Awaited<ReturnType<typeof sendRegistrationConfirmation>>;
    try {
      emailOutcome = await sendRegistrationConfirmation({
        userId: result.id,
        toEmail: email,
        tempPassword,
        userName: data.nameZh.trim(),
      });
    } catch (emailErr) {
      console.error("[registration] confirmation email pipeline", emailErr);
      emailOutcome = {
        delivered: false,
        channel: "none",
        error:
          emailErr instanceof Error ? emailErr.message : String(emailErr),
      };
    }

    try {
      await sendRegistrationAdminNotification({
        userId: result.id,
        registrantEmail: email,
        payloadSnapshot: payloadSnapshot as Record<string, unknown>,
        clientIp: clientIp ?? null,
      });
    } catch (adminNotifyErr) {
      console.error("[registration] admin registration notify email", adminNotifyErr);
    }

    const base = {
      ok: true as const,
      userId: result.id,
      emailSent: emailOutcome.delivered,
      emailChannel: emailOutcome.channel,
      socialFollowSetupToken: result.socialFollowSetupToken,
      message: emailOutcome.delivered
        ? "登記成功。請查收確認電郵（含臨時密碼及登入連結）。"
        : "登記成功，但確認電郵未能寄出。請稍後再試或聯絡主辦。",
    };

    if (process.env.NODE_ENV === "development") {
      return jsonOk({
        ...base,
        tempPassword,
        emailError: emailOutcome.error,
        devNote: emailOutcome.delivered
          ? undefined
          : emailOutcome.channel === "none"
            ? "未設定 RESEND_API_KEY 時不會寄出真電郵；以下臨時密碼僅供本機測試。"
            : `Resend 寄信失敗：${emailOutcome.error ?? "unknown"}`,
      });
    }

    return jsonOk(base);
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const target = (e.meta as { target?: string[] })?.target ?? [];
        if (target.includes("phone")) {
          return jsonError(
            "PHONE_EXISTS",
            "此電話號碼已用於登記另一個帳戶；每個號碼只可綁定一個帳戶。",
            409
          );
        }
        if (target.some((t) => t.includes("credential_id"))) {
          return jsonError(
            "PASSKEY_CONFLICT",
            "此裝置的通行密鑰已被使用，請重新整理頁面後再試，或改用其他裝置完成生物認證。",
            409
          );
        }
        return jsonError("EMAIL_EXISTS", "此電郵已被登記，請直接登入或使用其他電郵。", 409);
      }
      if (e.code === "P2022") {
        return jsonError(
          "DB_SCHEMA_MISMATCH",
          "伺服器資料庫尚未更新至最新版本。請聯絡主辦方，或於部署環境執行：npx prisma migrate deploy",
          503
        );
      }
    }
    const errMsg = e instanceof Error ? e.message : String(e);
    if (errMsg === "PHONE_VERIFICATION_ALREADY_USED") {
      return jsonError(
        "PHONE_VERIFICATION_ALREADY_USED",
        "此電話驗證已使用過，請重新發送驗證碼後再試。",
        409
      );
    }
    const hint = /column .* does not exist|Unknown column/i.test(errMsg);
    if (hint) {
      return jsonError(
        "DB_SCHEMA_MISMATCH",
        "資料庫結構與程式版本不一致（例如缺少新欄位）。請在伺服器執行 npx prisma migrate deploy 後再試。",
        503
      );
    }
    const devMessage =
      process.env.NODE_ENV === "development" && e instanceof Error ? errMsg : undefined;
    return jsonError(
      "REGISTRATION_FAILED",
      "登記暫時未能完成。請稍後再試；若你已收到確認電郵，可嘗試直接登入。若問題持續，請聯絡主辦方。",
      500,
      devMessage ? { devMessage } : undefined
    );
  }
}
