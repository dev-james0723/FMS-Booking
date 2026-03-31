import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import { AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH } from "@/lib/email/referral-ambassador-shared-zh";

export async function sendAmbassadorRefereeRegisteredEmail(params: {
  ambassadorUserId: string;
  toEmail: string;
  ambassadorNameZh: string;
  refereeDisplayName: string;
  bonusSlotGranted: boolean;
}): Promise<void> {
  const ambName = params.ambassadorNameZh.trim() || "D Ambassador";
  const refName = params.refereeDisplayName.trim() || "新用戶";
  const subject = "推薦成功｜經你連結的用戶已完成登記";

  const rewardParagraph = params.bonusSlotGranted
    ? `對方已成功申請帳戶，你現已獲得 1 節免費 30 分鐘使用時數獎勵（適用於琴室或大型樂器排練空間）。`
    : `對方已成功申請帳戶；本次推薦已記錄。你目前已達本活動可獲取之推薦獎勵上限，故本次未能再新增額外時數。`;

  const text = [
    `${ambName} 你好，`,
    ``,
    `經你推薦連結登記的用戶「${refName}」已完成帳戶開立。`,
    ``,
    rewardParagraph,
    ``,
    `重要：${AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH}`,
  ].join("\n");

  const safeAmb = escapeHtml(ambName);
  const safeRef = escapeHtml(refName);
  const safeDisclaimer = escapeHtml(AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH);
  const rewardHtml = params.bonusSlotGranted
    ? `對方已成功申請帳戶，你現已獲得 <strong>1 節免費 30 分鐘</strong>使用時數獎勵（適用於琴室或大型樂器排練空間）。`
    : `對方已成功申請帳戶；本次推薦已記錄。你目前已達本活動可獲取之推薦獎勵上限，故本次<strong>未能再新增</strong>額外時數。`;

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeAmb} 你好，</p>
      <p style="margin:0 0 12px;">經你推薦連結登記的用戶「<strong>${safeRef}</strong>」已完成帳戶開立。</p>
      <p style="margin:0 0 12px;">${rewardHtml}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#44403c;line-height:1.55;"><strong>重要：</strong>${safeDisclaimer}</p>
    </td></tr>
  </table>
</body>
</html>`;

  if (process.env.NODE_ENV === "development") {
    console.info("[email:ambassador_referee_registered]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "ambassador_referee_registered",
      toEmail: params.toEmail,
      subject,
      payload: {
        channel: "none",
        bonusSlotGranted: params.bonusSlotGranted,
        refereeDisplayName: refName,
      },
      status: EmailLogStatus.failed,
      error: "RESEND_API_KEY 未設定；電郵未寄出。",
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject,
      text,
      html,
    });

    if (error) {
      const msg = error.message ?? JSON.stringify(error);
      await logEmail({
        userId: params.ambassadorUserId,
        templateKey: "ambassador_referee_registered",
        toEmail: params.toEmail,
        subject,
        payload: {
          channel: "resend",
          bonusSlotGranted: params.bonusSlotGranted,
          refereeDisplayName: refName,
        },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return;
    }

    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "ambassador_referee_registered",
      toEmail: params.toEmail,
      subject,
      payload: {
        channel: "resend",
        bonusSlotGranted: params.bonusSlotGranted,
        refereeDisplayName: refName,
      },
      status: EmailLogStatus.sent,
      providerMessageId: data?.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "ambassador_referee_registered",
      toEmail: params.toEmail,
      subject,
      payload: {
        channel: "resend",
        bonusSlotGranted: params.bonusSlotGranted,
        refereeDisplayName: refName,
      },
      status: EmailLogStatus.failed,
      error: msg,
    });
  }
}
