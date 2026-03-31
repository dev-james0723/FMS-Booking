import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import { AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH } from "@/lib/email/referral-ambassador-shared-zh";

export async function sendReferralLinkOpenedToAmbassador(params: {
  ambassadorUserId: string;
  toEmail: string;
  ambassadorNameZh: string;
}): Promise<void> {
  const name = params.ambassadorNameZh.trim() || "D Ambassador";
  const subject = "有人打開了你的 D Ambassador 推薦連結";
  const text = [
    `${name} 你好，`,
    ``,
    `剛有人透過你的專屬推薦連結瀏覽了活動頁面。`,
    ``,
    `若對方之後成功開立本計劃帳戶，你將可獲得 1 節免費 30 分鐘使用時數獎勵；該獎勵適用於預約琴室或大型樂器排練空間。`,
    ``,
    `重要：${AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH}`,
  ].join("\n");

  const safeName = escapeHtml(name);
  const safeDisclaimer = escapeHtml(AMBASSADOR_EXTRA_HOURS_AVAILABILITY_ZH);
  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 你好，</p>
      <p style="margin:0 0 12px;">剛有人透過你的專屬<strong>推薦連結</strong>瀏覽了活動頁面。</p>
      <p style="margin:0 0 12px;">若對方之後成功開立本計劃帳戶，你將可獲得 <strong>1 節免費 30 分鐘</strong>使用時數獎勵；該獎勵適用於預約<strong>琴室</strong>或<strong>大型樂器排練空間</strong>。</p>
      <p style="margin:16px 0 0;font-size:13px;color:#44403c;line-height:1.55;"><strong>重要：</strong>${safeDisclaimer}</p>
    </td></tr>
  </table>
</body>
</html>`;

  if (process.env.NODE_ENV === "development") {
    console.info("[email:referral_link_opened]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "referral_link_opened",
      toEmail: params.toEmail,
      subject,
      payload: { channel: "none" },
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
        templateKey: "referral_link_opened",
        toEmail: params.toEmail,
        subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return;
    }

    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "referral_link_opened",
      toEmail: params.toEmail,
      subject,
      payload: { channel: "resend" },
      status: EmailLogStatus.sent,
      providerMessageId: data?.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEmail({
      userId: params.ambassadorUserId,
      templateKey: "referral_link_opened",
      toEmail: params.toEmail,
      subject,
      payload: { channel: "resend" },
      status: EmailLogStatus.failed,
      error: msg,
    });
  }
}
