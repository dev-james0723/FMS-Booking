import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import { withBasePath } from "@/lib/base-path";

function absAppUrl(path: string): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}${withBasePath(path)}`;
}

function slotLine(startsAt: Date, endsAt: Date, venueLabel: string | null): string {
  const line = formatSlotListLineZhDateEnRange(startsAt, endsAt);
  const v = venueLabel?.trim();
  return v ? `${line} · ${displayVenueLabel(v)}` : line;
}

async function sendResendMail(params: {
  userId: string;
  toEmail: string;
  templateKey: string;
  subject: string;
  text: string;
  html: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[email:${params.templateKey}]\n`, params.text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.userId,
      templateKey: params.templateKey,
      toEmail: params.toEmail,
      subject: params.subject,
      payload: { ...params.payload, channel: "none" },
      status: EmailLogStatus.failed,
      error:
        "RESEND_API_KEY 未設定；電郵未寄出（開發時請查看終端機 log）。",
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    if (error) {
      const msg = error.message ?? JSON.stringify(error);
      await logEmail({
        userId: params.userId,
        templateKey: params.templateKey,
        toEmail: params.toEmail,
        subject: params.subject,
        payload: { ...params.payload, channel: "resend" },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return;
    }

    await logEmail({
      userId: params.userId,
      templateKey: params.templateKey,
      toEmail: params.toEmail,
      subject: params.subject,
      payload: { ...params.payload, channel: "resend" },
      status: EmailLogStatus.sent,
      providerMessageId: data?.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEmail({
      userId: params.userId,
      templateKey: params.templateKey,
      toEmail: params.toEmail,
      subject: params.subject,
      payload: { ...params.payload, channel: "resend" },
      status: EmailLogStatus.failed,
      error: msg,
    });
  }
}

export async function sendBookingCancelledByStaff(params: {
  userId: string;
  toEmail: string;
  greetingName: string;
  requestId: string;
}): Promise<void> {
  const subject = "預約已由工作人員取消｜D Festival × 幻樂空間";
  const history = absAppUrl("/booking/history");
  const safeName = escapeHtml(params.greetingName);
  const text = [
    `${params.greetingName} 您好，`,
    "",
    `您於本系統的預約（參考編號：${params.requestId.slice(0, 8)}…）已由工作人員取消，原有時段已釋出供其他人士預約。`,
    "",
    `如需查閱紀錄或再次預約，請登入：${history}`,
    "",
    "如有疑問請聯絡主辦方。",
    "",
    "D Festival × 幻樂空間",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 您好，</p>
      <p style="margin:0 0 12px;">您於本系統的預約（參考編號：<strong>${escapeHtml(params.requestId.slice(0, 8))}…</strong>）已由<strong>工作人員取消</strong>，原有時段已釋出供其他人士預約。</p>
      <p style="margin:0 0 20px;"><a href="${escapeHtml(history)}" style="color:#0369a1;">登入查看預約紀錄</a></p>
      <p style="margin:0;font-size:14px;color:#57534e;">如有疑問請聯絡主辦方。</p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">D Festival × 幻樂空間</p>
    </td></tr>
  </table>
</body>
</html>`;

  await sendResendMail({
    userId: params.userId,
    toEmail: params.toEmail,
    templateKey: "booking_cancelled_by_staff",
    subject,
    text,
    html,
    payload: { requestId: params.requestId },
  });
}

export async function sendBookingRescheduledByStaff(params: {
  userId: string;
  toEmail: string;
  greetingName: string;
  requestId: string;
  removedSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
  currentSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
}): Promise<void> {
  const subject = "預約時段已更新｜D Festival × 幻樂空間";
  const history = absAppUrl("/booking/history");
  const safeName = escapeHtml(params.greetingName);

  const removedLines = params.removedSlots.map((s) => slotLine(s.startsAt, s.endsAt, s.venueLabel));
  const newLines = params.currentSlots.map((s) => slotLine(s.startsAt, s.endsAt, s.venueLabel));

  const text = [
    `${params.greetingName} 您好，`,
    "",
    `您於本系統的預約（參考編號：${params.requestId.slice(0, 8)}…）已由工作人員更改時段。`,
    "",
    ...(removedLines.length > 0
      ? ["已被取代／取消的時段：", ...removedLines.map((l) => `· ${l}`), ""]
      : []),
    "現時預約時段：",
    ...newLines.map((l) => `· ${l}`),
    "",
    `詳情請登入查看：${history}`,
    "",
    "如有疑問請聯絡主辦方。",
    "",
    "D Festival × 幻樂空間",
  ].join("\n");

  const removedHtml =
    removedLines.length > 0
      ? `<p style="margin:16px 0 8px;font-weight:600;">已被取代／取消的時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${removedLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>`
      : "";

  const newHtml = `<p style="margin:16px 0 8px;font-weight:600;">現時預約時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${newLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>`;

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 您好，</p>
      <p style="margin:0 0 12px;">您於本系統的預約（參考編號：<strong>${escapeHtml(params.requestId.slice(0, 8))}…</strong>）已由<strong>工作人員更改時段</strong>。</p>
      ${removedHtml}
      ${newHtml}
      <p style="margin:0 0 20px;"><a href="${escapeHtml(history)}" style="color:#0369a1;">登入查看預約紀錄</a></p>
      <p style="margin:0;font-size:14px;color:#57534e;">如有疑問請聯絡主辦方。</p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">D Festival × 幻樂空間</p>
    </td></tr>
  </table>
</body>
</html>`;

  await sendResendMail({
    userId: params.userId,
    toEmail: params.toEmail,
    templateKey: "booking_rescheduled_by_staff",
    subject,
    text,
    html,
    payload: {
      requestId: params.requestId,
      removedCount: params.removedSlots.length,
      slotCount: params.currentSlots.length,
    },
  });
}
