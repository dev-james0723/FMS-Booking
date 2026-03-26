import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { getAllSettings, parseInstantSetting } from "@/lib/settings";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type RegistrationEmailOutcome = {
  delivered: boolean;
  channel: "resend" | "none";
  error?: string;
  providerMessageId?: string;
};

function buildRegistrationBodies(params: {
  userName: string;
  toEmail: string;
  tempPassword: string;
  bookingOpensHk: string;
}) {
  const subject = "登記成功｜D Festival × 幻樂空間｜限時免費琴室體驗";
  const loginUrl = `${APP_URL}/login`;
  const text = [
    `${params.userName} 你好，`,
    ``,
    `多謝你登記「D Festival × 幻樂空間｜限時免費琴室體驗」。`,
    `你的帳戶編號（登入名稱）為：${params.toEmail}`,
    `臨時密碼：${params.tempPassword}`,
    `登入連結：${loginUrl}`,
    ``,
    `請注意：完成資料登記並不代表預約已成功。預約系統將於 ${params.bookingOpensHk || "主辦公布時間"} 正式開放申請。`,
    `請妥善保存此電郵。`,
    ``,
    `客服：（請於上線前設定）`,
  ].join("\n");

  const zh = params.bookingOpensHk || "主辦公布時間";
  const safeName = escapeHtml(params.userName);
  const safeEmail = escapeHtml(params.toEmail);
  const safePass = escapeHtml(params.tempPassword);
  const safeZh = escapeHtml(zh);

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 你好，</p>
      <p style="margin:0 0 12px;">多謝你登記「D Festival × 幻樂空間｜限時免費琴室體驗」。</p>
      <p style="margin:0 0 8px;"><strong>帳戶編號（登入名稱）</strong><br /><span style="word-break:break-all;">${safeEmail}</span></p>
      <p style="margin:0 0 16px;"><strong>臨時密碼</strong><br />
        <code style="display:inline-block;margin-top:6px;padding:8px 12px;background:#f5f5f4;border-radius:8px;font-size:14px;letter-spacing:0.02em;">${safePass}</code>
      </p>
      <p style="margin:0 0 20px;">
        <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:10px 20px;background:#1c1917;color:#fff;text-decoration:none;border-radius:9999px;font-size:14px;">前往登入</a>
      </p>
      <p style="margin:0;font-size:13px;color:#78716c;">請注意：完成資料登記並不代表預約已成功。預約系統將於 <strong>${safeZh}</strong> 正式開放申請。</p>
      <p style="margin:16px 0 0;font-size:13px;color:#78716c;">請妥善保存此電郵。</p>
      <p style="margin:16px 0 0;font-size:13px;color:#a8a29e;">客服：（請於上線前設定）</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html, loginUrl };
}

export async function sendRegistrationConfirmation(params: {
  userId: string;
  toEmail: string;
  tempPassword: string;
  userName: string;
}): Promise<RegistrationEmailOutcome> {
  const settings = await getAllSettings();
  const bookingOpens = parseInstantSetting(settings["booking_opens_at"]);
  const bookingOpensHk = bookingOpens
    ? bookingOpens.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })
    : "";

  const { subject, text, html, loginUrl } = buildRegistrationBodies({
    userName: params.userName,
    toEmail: params.toEmail,
    tempPassword: params.tempPassword,
    bookingOpensHk,
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[email:registration_confirmation]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.userId,
      templateKey: "registration_confirmation",
      toEmail: params.toEmail,
      subject,
      payload: {
        loginUrl,
        bookingOpensAt: bookingOpens?.toISOString(),
        channel: "none",
      },
      status: EmailLogStatus.failed,
      error: "RESEND_API_KEY 未設定；電郵未寄出（開發時請查看終端機 log 或 API 回傳的臨時密碼）。",
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
        templateKey: "registration_confirmation",
        toEmail: params.toEmail,
        subject,
        payload: {
          loginUrl,
          bookingOpensAt: bookingOpens?.toISOString(),
          channel: "resend",
        },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return { delivered: false, channel: "resend", error: msg };
    }

    await logEmail({
      userId: params.userId,
      templateKey: "registration_confirmation",
      toEmail: params.toEmail,
      subject,
      payload: {
        loginUrl,
        bookingOpensAt: bookingOpens?.toISOString(),
        channel: "resend",
      },
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
      templateKey: "registration_confirmation",
      toEmail: params.toEmail,
      subject,
      payload: {
        loginUrl,
        bookingOpensAt: bookingOpens?.toISOString(),
        channel: "resend",
      },
      status: EmailLogStatus.failed,
      error: msg,
    });
    return { delivered: false, channel: "resend", error: msg };
  }
}
