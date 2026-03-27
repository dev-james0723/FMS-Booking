import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import type { ContactInquiryInput } from "@/lib/validation/contact-inquiry";

const DEFAULT_OFFICE_INBOX = "festival.office@gmail.com";

function officeNotifyEmails(): string[] {
  const raw = process.env.CONTACT_INQUIRY_ADMIN_EMAIL?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [DEFAULT_OFFICE_INBOX];
}

function buildUserBodies(
  locale: "zh-HK" | "en",
  params: { name: string; messagePreview: string },
) {
  const isZh = locale === "zh-HK";
  const subject = isZh
    ? "我們已收到你的查詢｜幻樂空間 × D Festival"
    : "We received your enquiry | Fantasia Music Space × D Festival";
  const text = isZh
    ? [
        `${params.name} 你好，`,
        ``,
        `我們已收到你透過網站「聯絡資訊」表格提交的查詢，會盡快回覆你。`,
        ``,
        `你提交的內容摘要：`,
        params.messagePreview,
        ``,
        `此電郵為系統自動發出，請勿直接回覆。如需聯絡，請使用網站上公布的電話、WhatsApp 或電郵。`,
      ].join("\n")
    : [
        `Hi ${params.name},`,
        ``,
        `We have received the enquiry you submitted via our website contact form and will get back to you as soon as we can.`,
        ``,
        `Summary of your message:`,
        params.messagePreview,
        ``,
        `This is an automated confirmation. Please use the phone, WhatsApp or email published on our site to reach us directly.`,
      ].join("\n");

  const safeName = escapeHtml(params.name);
  const safePreview = escapeHtml(params.messagePreview).replace(/\n/g, "<br />");
  const html = isZh
    ? `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 你好，</p>
      <p style="margin:0 0 12px;">我們已收到你透過網站「聯絡資訊」表格提交的查詢，會盡快回覆你。</p>
      <p style="margin:0 0 8px;font-weight:600;">你提交的內容摘要</p>
      <p style="margin:0 0 16px;font-size:14px;color:#57534e;">${safePreview}</p>
      <p style="margin:0;font-size:13px;color:#78716c;">此電郵為系統自動發出，請勿直接回覆。</p>
    </td></tr>
  </table>
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">Hi ${safeName},</p>
      <p style="margin:0 0 12px;">We have received your enquiry from our website contact form and will reply as soon as we can.</p>
      <p style="margin:0 0 8px;font-weight:600;">Your message (summary)</p>
      <p style="margin:0 0 16px;font-size:14px;color:#57534e;">${safePreview}</p>
      <p style="margin:0;font-size:13px;color:#78716c;">This is an automated message — please use our published contact channels to reach us directly.</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function buildAdminBodies(data: ContactInquiryInput) {
  const subject = `【網站查詢】${data.name.trim()}`;
  const phone = (data.phone ?? "").trim() || "—";
  const lines = [
    "網站聯絡表格有新提交：",
    "",
    `姓名：${data.name.trim()}`,
    `電郵：${data.email.trim().toLowerCase()}`,
    `電話：${phone}`,
    "",
    "查詢內容：",
    data.message.trim(),
  ];
  const text = lines.join("\n");
  const safe = {
    name: escapeHtml(data.name.trim()),
    email: escapeHtml(data.email.trim().toLowerCase()),
    phone: escapeHtml(phone),
    message: escapeHtml(data.message.trim()).replace(/\n/g, "<br />"),
  };
  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;">
  <p style="margin:0 0 12px;font-weight:600;">網站聯絡表格 — 新提交</p>
  <p style="margin:0 0 4px;"><strong>姓名</strong><br />${safe.name}</p>
  <p style="margin:12px 0 4px;"><strong>電郵</strong><br /><a href="mailto:${safe.email}">${safe.email}</a></p>
  <p style="margin:12px 0 4px;"><strong>電話</strong><br />${safe.phone}</p>
  <p style="margin:16px 0 4px;"><strong>查詢內容</strong></p>
  <p style="margin:0;font-size:14px;color:#44403c;">${safe.message}</p>
</body>
</html>`;
  return { subject, text, html };
}

export type ContactInquiryEmailResult = {
  confirmationOk: boolean;
  officeOk: boolean;
  error?: string;
};

export async function sendContactInquiryEmails(
  data: ContactInquiryInput,
): Promise<ContactInquiryEmailResult> {
  const locale = data.locale === "en" ? "en" : "zh-HK";
  const preview =
    data.message.trim().length > 400
      ? `${data.message.trim().slice(0, 400)}…`
      : data.message.trim();

  const userBodies = buildUserBodies(locale, {
    name: data.name.trim(),
    messagePreview: preview,
  });
  const adminBodies = buildAdminBodies(data);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";
  const toUser = data.email.trim().toLowerCase();
  const toOffice = officeNotifyEmails();

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email:contact_inquiry:user]\n", userBodies.text);
      console.info("[email:contact_inquiry:office]\n", adminBodies.text);
    }
    await logEmail({
      templateKey: "contact_inquiry_user",
      toEmail: toUser,
      subject: userBodies.subject,
      payload: { channel: "none" },
      status: EmailLogStatus.failed,
      error: "RESEND_API_KEY 未設定",
    });
    await logEmail({
      templateKey: "contact_inquiry_office",
      toEmail: toOffice[0] ?? DEFAULT_OFFICE_INBOX,
      subject: adminBodies.subject,
      payload: { channel: "none", recipients: toOffice },
      status: EmailLogStatus.failed,
      error: "RESEND_API_KEY 未設定",
    });
    return {
      confirmationOk: false,
      officeOk: false,
      error: "RESEND_API_KEY 未設定",
    };
  }

  const resend = new Resend(apiKey);
  let confirmationOk = false;
  let officeOk = false;
  let lastError: string | undefined;

  try {
    const userSend = await resend.emails.send({
      from,
      to: [toUser],
      subject: userBodies.subject,
      text: userBodies.text,
      html: userBodies.html,
    });
    if (userSend.error) {
      lastError = userSend.error.message ?? JSON.stringify(userSend.error);
      await logEmail({
        templateKey: "contact_inquiry_user",
        toEmail: toUser,
        subject: userBodies.subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.failed,
        error: lastError,
      });
    } else {
      confirmationOk = true;
      await logEmail({
        templateKey: "contact_inquiry_user",
        toEmail: toUser,
        subject: userBodies.subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.sent,
        providerMessageId: userSend.data?.id,
      });
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    await logEmail({
      templateKey: "contact_inquiry_user",
      toEmail: toUser,
      subject: userBodies.subject,
      payload: { channel: "resend" },
      status: EmailLogStatus.failed,
      error: lastError,
    });
  }

  try {
    const officeSend = await resend.emails.send({
      from,
      to: toOffice,
      replyTo: toUser,
      subject: adminBodies.subject,
      text: adminBodies.text,
      html: adminBodies.html,
    });
    if (officeSend.error) {
      lastError = officeSend.error.message ?? JSON.stringify(officeSend.error);
      await logEmail({
        templateKey: "contact_inquiry_office",
        toEmail: toOffice[0] ?? DEFAULT_OFFICE_INBOX,
        subject: adminBodies.subject,
        payload: { channel: "resend", recipients: toOffice },
        status: EmailLogStatus.failed,
        error: lastError,
      });
    } else {
      officeOk = true;
      await logEmail({
        templateKey: "contact_inquiry_office",
        toEmail: toOffice[0] ?? DEFAULT_OFFICE_INBOX,
        subject: adminBodies.subject,
        payload: { channel: "resend", recipients: toOffice },
        status: EmailLogStatus.sent,
        providerMessageId: officeSend.data?.id,
      });
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    await logEmail({
      templateKey: "contact_inquiry_office",
      toEmail: toOffice[0] ?? DEFAULT_OFFICE_INBOX,
      subject: adminBodies.subject,
      payload: { channel: "resend", recipients: toOffice },
      status: EmailLogStatus.failed,
      error: lastError,
    });
  }

  return {
    confirmationOk,
    officeOk,
    ...(confirmationOk && officeOk ? {} : { error: lastError }),
  };
}
