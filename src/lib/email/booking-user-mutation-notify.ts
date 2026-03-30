import { EmailLogStatus, type BookingVenueKind } from "@prisma/client";
import { Resend } from "resend";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import { withBasePath } from "@/lib/base-path";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";

function absAppUrl(path: string): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}${withBasePath(path)}`;
}

function historyPathForVenue(venueKind: BookingVenueKind): string {
  return venueKind === "open_space" ? "/booking/open-space/history" : "/booking/history";
}

function defaultOfficeNotifyEmails(): string[] {
  const raw =
    process.env.BOOKING_ADMIN_NOTIFY_EMAIL?.trim() ||
    "dfestival.office@gmail.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function slotLine(startsAt: Date, endsAt: Date, venueLabel: string | null): string {
  const line = formatSlotListLineZhDateEnRange(startsAt, endsAt);
  const v = venueLabel?.trim();
  return v ? `${line} · ${displayVenueLabel(v)}` : line;
}

function venueLabelZh(venueKind: BookingVenueKind): string {
  return venueKind === "open_space"
    ? "大型樂器／開放空間預約系統"
    : "琴室預約系統";
}

async function sendResendTo(params: {
  userId: string;
  toEmail: string;
  templateKey: string;
  subject: string;
  text: string;
  html: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[email:${params.templateKey}] → ${params.toEmail}\n`, params.text);
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

export async function sendBookingUserRescheduleNotifications(params: {
  userId: string;
  userEmail: string;
  greetingName: string;
  requestId: string;
  venueKind: BookingVenueKind;
  removedSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
  currentSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
}): Promise<void> {
  const history = absAppUrl(historyPathForVenue(params.venueKind));
  const safeName = escapeHtml(params.greetingName);
  const removedLines = params.removedSlots.map((s) =>
    slotLine(s.startsAt, s.endsAt, s.venueLabel)
  );
  const newLines = params.currentSlots.map((s) =>
    slotLine(s.startsAt, s.endsAt, s.venueLabel)
  );

  const userSubject = "預約時段已更新（自行更改）｜D Festival × 幻樂空間";
  const userText = [
    `${params.greetingName} 您好，`,
    "",
    `您已成功於網上更改預約（參考編號：${params.requestId.slice(0, 8)}…）。`,
    "",
    ...(removedLines.length > 0
      ? ["已釋出／取代的時段：", ...removedLines.map((l) => `· ${l}`), ""]
      : []),
    "更改後現時預約時段：",
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
      ? `<p style="margin:16px 0 8px;font-weight:600;">已釋出／取代的時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${removedLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>`
      : "";

  const userHtml = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 您好，</p>
      <p style="margin:0 0 12px;">您已成功於網上<strong>更改預約</strong>（參考編號：<strong>${escapeHtml(params.requestId.slice(0, 8))}…</strong>）。</p>
      ${removedHtml}
      <p style="margin:16px 0 8px;font-weight:600;">更改後現時預約時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${newLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>
      <p style="margin:0 0 20px;"><a href="${escapeHtml(history)}" style="color:#0369a1;">登入查看預約紀錄</a></p>
      <p style="margin:0;font-size:14px;color:#57534e;">如有疑問請聯絡主辦方。</p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">D Festival × 幻樂空間</p>
    </td></tr>
  </table>
</body>
</html>`;

  await sendResendTo({
    userId: params.userId,
    toEmail: params.userEmail,
    templateKey: "booking_user_reschedule_confirm",
    subject: userSubject,
    text: userText,
    html: userHtml,
    payload: { requestId: params.requestId },
  });

  const officeLines = [
    `使用者自行更改預約時段。`,
    ``,
    `預約編號：${params.requestId}`,
    `使用者：${params.greetingName}`,
    `Email：${params.userEmail}`,
    `場地：${venueLabelZh(params.venueKind)}`,
    ``,
    ...(removedLines.length > 0
      ? ["已釋出／取代：", ...removedLines.map((l) => `· ${l}`), ""]
      : []),
    "更改後現時時段：",
    ...newLines.map((l) => `· ${l}`),
  ];
  const officeText = officeLines.join("\n");
  const officeHtml = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#292524;">
  <p style="margin:0 0 12px;font-weight:600;">使用者自行更改預約</p>
  <p style="margin:0 0 8px;">預約編號：<code>${escapeHtml(params.requestId)}</code></p>
  <p style="margin:0 0 8px;">使用者：${escapeHtml(params.greetingName)} · ${escapeHtml(params.userEmail)}</p>
  <p style="margin:0 0 16px;">場地：${escapeHtml(venueLabelZh(params.venueKind))}</p>
  ${removedHtml || ""}
  <p style="margin:16px 0 8px;font-weight:600;">更改後現時時段</p>
  <ul style="margin:0;padding-left:20px;">${newLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
</body>
</html>`;

  const officeSubject = `【使用者更改預約】${params.greetingName}｜${params.requestId.slice(0, 8)}`;
  for (const to of defaultOfficeNotifyEmails()) {
    await sendResendTo({
      userId: params.userId,
      toEmail: to,
      templateKey: "booking_user_reschedule_office",
      subject: officeSubject,
      text: officeText,
      html: officeHtml,
      payload: { requestId: params.requestId, office: true },
    });
  }
}

export async function sendBookingUserCancelNotifications(params: {
  userId: string;
  userEmail: string;
  greetingName: string;
  requestId: string;
  venueKind: BookingVenueKind;
  requestCancelled: boolean;
  releasedSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
  remainingSlots: { startsAt: Date; endsAt: Date; venueLabel: string | null }[];
}): Promise<void> {
  const history = absAppUrl(historyPathForVenue(params.venueKind));
  const safeName = escapeHtml(params.greetingName);
  const releasedLines = params.releasedSlots.map((s) =>
    slotLine(s.startsAt, s.endsAt, s.venueLabel)
  );
  const remainingLines = params.remainingSlots.map((s) =>
    slotLine(s.startsAt, s.endsAt, s.venueLabel)
  );

  const userSubject = params.requestCancelled
    ? "預約已取消（自行取消）｜D Festival × 幻樂空間"
    : "預約時段已更新（自行取消部分時段）｜D Festival × 幻樂空間";

  const userText = [
    `${params.greetingName} 您好，`,
    "",
    params.requestCancelled
      ? `您已取消預約（參考編號：${params.requestId.slice(0, 8)}…），下列時段已釋出供其他人士預約。`
      : `您已於網上取消部分預約時段（參考編號：${params.requestId.slice(0, 8)}…）。`,
    "",
    "已取消的時段：",
    ...releasedLines.map((l) => `· ${l}`),
    "",
    ...(params.requestCancelled
      ? []
      : ["仍保留的預約時段：", ...remainingLines.map((l) => `· ${l}`), ""]),
    `詳情請登入查看：${history}`,
    "",
    "如有疑問請聯絡主辦方。",
    "",
    "D Festival × 幻樂空間",
  ]
    .filter(Boolean)
    .join("\n");

  const remainingBlock =
    !params.requestCancelled && remainingLines.length > 0
      ? `<p style="margin:16px 0 8px;font-weight:600;">仍保留的預約時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${remainingLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>`
      : "";

  const userHtml = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <p style="margin:0 0 12px;">${safeName} 您好，</p>
      <p style="margin:0 0 12px;">${
        params.requestCancelled
          ? `您已<strong>取消預約</strong>（參考編號：<strong>${escapeHtml(params.requestId.slice(0, 8))}…</strong>），下列時段已釋出。`
          : `您已於網上<strong>取消部分預約時段</strong>（參考編號：<strong>${escapeHtml(params.requestId.slice(0, 8))}…</strong>）。`
      }</p>
      <p style="margin:16px 0 8px;font-weight:600;">已取消的時段</p>
  <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;">
    ${releasedLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>
      ${remainingBlock}
      <p style="margin:0 0 20px;"><a href="${escapeHtml(history)}" style="color:#0369a1;">登入查看預約紀錄</a></p>
      <p style="margin:0;font-size:14px;color:#57534e;">如有疑問請聯絡主辦方。</p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">D Festival × 幻樂空間</p>
    </td></tr>
  </table>
</body>
</html>`;

  await sendResendTo({
    userId: params.userId,
    toEmail: params.userEmail,
    templateKey: "booking_user_cancel_confirm",
    subject: userSubject,
    text: userText,
    html: userHtml,
    payload: { requestId: params.requestId, requestCancelled: params.requestCancelled },
  });

  const officeText = [
    `使用者自行取消預約時段。`,
    ``,
    `預約編號：${params.requestId}`,
    `整筆預約已取消：${params.requestCancelled ? "是" : "否"}`,
    `使用者：${params.greetingName}`,
    `Email：${params.userEmail}`,
    `場地：${venueLabelZh(params.venueKind)}`,
    ``,
    "已釋出時段：",
    ...releasedLines.map((l) => `· ${l}`),
    ...(params.requestCancelled
      ? []
      : ["", "仍保留：", ...remainingLines.map((l) => `· ${l}`)]),
  ].join("\n");

  const officeHtml = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,sans-serif;font-size:14px;line-height:1.6;">
  <p style="margin:0 0 12px;font-weight:600;">使用者自行取消時段</p>
  <p style="margin:0 0 8px;">預約編號：<code>${escapeHtml(params.requestId)}</code> · 整筆取消：${params.requestCancelled ? "是" : "否"}</p>
  <p style="margin:0 0 8px;">${escapeHtml(params.greetingName)} · ${escapeHtml(params.userEmail)}</p>
  <p style="margin:0 0 16px;">${escapeHtml(venueLabelZh(params.venueKind))}</p>
  <p style="font-weight:600;">已釋出</p>
  <ul style="padding-left:20px;">${releasedLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
  ${
    !params.requestCancelled && remainingLines.length > 0
      ? `<p style="font-weight:600;">仍保留</p><ul style="padding-left:20px;">${remainingLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
      : ""
  }
</body>
</html>`;

  const officeSubject = `【使用者取消時段】${params.greetingName}｜${params.requestId.slice(0, 8)}`;
  for (const to of defaultOfficeNotifyEmails()) {
    await sendResendTo({
      userId: params.userId,
      toEmail: to,
      templateKey: "booking_user_cancel_office",
      subject: officeSubject,
      text: officeText,
      html: officeHtml,
      payload: { requestId: params.requestId, office: true },
    });
  }
}
