import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { appBasePath } from "@/lib/base-path";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type PasswordResetEmailOutcome = {
  delivered: boolean;
  channel: "resend" | "none";
  error?: string;
  providerMessageId?: string;
};

function buildBodies(params: { resetUrl: string; nextNote?: string }) {
  const subject = "重設密碼｜D Festival × 幻樂空間";
  const nextLine = params.nextNote
    ? `\n登入後將帶你前往：${params.nextNote}\n`
    : "";
  const text = [
    `你好，`,
    ``,
    `我們收到重設預約系統登入密碼的請求。如確定由你本人提出，請於 1 小時內點擊以下連結設定新密碼：`,
    params.resetUrl,
    nextLine,
    ``,
    `如你沒有提出此請求，請忽略此電郵，你的密碼不會被更改。`,
    ``,
    `幻樂空間`,
  ].join("\n");

  const safeUrl = escapeHtml(params.resetUrl);
  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">你好，</p>
      <p style="margin:0 0 12px;">我們收到重設預約系統登入密碼的請求。如確定由你本人提出，請於 <strong>1 小時內</strong> 點擊下方按鈕設定新密碼。</p>
      <p style="margin:0 0 20px;">
        <a href="${safeUrl}" style="display:inline-block;padding:10px 20px;background:#1c1917;color:#fff;text-decoration:none;border-radius:9999px;font-size:14px;">重設密碼</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#78716c;word-break:break-all;">若按鈕無法使用，請複製此連結到瀏覽器：<br />${safeUrl}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#78716c;">如你沒有提出此請求，請忽略此電郵，你的密碼不會被更改。</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function safeInternalPath(next: string | undefined): string | undefined {
  if (!next) return undefined;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return undefined;
  return t;
}

export async function sendPasswordResetEmail(params: {
  userId: string;
  toEmail: string;
  rawToken: string;
  /** Where to redirect after reset (same-origin path only). */
  nextPath?: string;
}): Promise<PasswordResetEmailOutcome> {
  const base = appBasePath();
  const next = safeInternalPath(params.nextPath);
  const q = new URLSearchParams({ token: params.rawToken });
  if (next) q.set("next", next);
  const resetUrl = `${APP_URL}${base}/reset-password?${q.toString()}`;

  const { subject, text, html } = buildBodies({ resetUrl, nextNote: next });

  if (process.env.NODE_ENV === "development") {
    console.info("[email:password_reset]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.userId,
      templateKey: "password_reset",
      toEmail: params.toEmail,
      subject,
      payload: { resetUrl, channel: "none" },
      status: EmailLogStatus.failed,
      error: "RESEND_API_KEY 未設定；重設密碼電郵未寄出。",
    });
    return { delivered: false, channel: "none" };
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
        userId: params.userId,
        templateKey: "password_reset",
        toEmail: params.toEmail,
        subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return { delivered: false, channel: "resend", error: msg };
    }

    await logEmail({
      userId: params.userId,
      templateKey: "password_reset",
      toEmail: params.toEmail,
      subject,
      payload: { channel: "resend" },
      status: EmailLogStatus.sent,
      providerMessageId: data?.id,
    });
    return {
      delivered: true,
      channel: "resend",
      providerMessageId: data?.id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEmail({
      userId: params.userId,
      templateKey: "password_reset",
      toEmail: params.toEmail,
      subject,
      payload: { channel: "resend" },
      status: EmailLogStatus.failed,
      error: msg,
    });
    return { delivered: false, channel: "resend", error: msg };
  }
}
