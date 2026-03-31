import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import {
  bookingIdentityTypeLabelZh,
  identityFlagsToZh,
  userCategoryLabelZh,
} from "@/lib/identity-labels";
import { formatBookingSlotsSummaryForMail } from "@/lib/email/booking-slots-summary";
import { sessionCountWithHoursPack } from "@/lib/i18n/session-hours";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import type { BookingAllocation, BookingRequest, BookingSlot, User, UserProfile } from "@prisma/client";

type FullBooking = BookingRequest & {
  user: User & { profile: UserProfile | null; category: { code: string } | null };
  allocations: (BookingAllocation & { slot: BookingSlot })[];
};

function defaultNotifyEmails(): string[] {
  const raw =
    process.env.BOOKING_ADMIN_NOTIFY_EMAIL?.trim() ||
    "dfestival.office@gmail.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function igLine(p: UserProfile | null): string {
  if (!p) return "—";
  if (p.socialFollowVerified) return "已核實追蹤官方 IG";
  if (p.socialFollowClaimed) return "已聲明完成追蹤（待核實）";
  return "未聲明／未完成";
}

export async function sendBookingAdminNotification(
  booking: FullBooking
): Promise<void> {
  const p = booking.user.profile;
  const toList = defaultNotifyEmails();
  const categoryCode =
    booking.userCategoryAtRequest || booking.user.category?.code || "";
  const categoryZh = userCategoryLabelZh(categoryCode);
  const identities = p ? identityFlagsToZh(p.identityFlags).join("、") : "—";

  const sortedAlloc = [...booking.allocations].sort(
    (a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime(),
  );
  const slotIntervals = sortedAlloc.map((a) => ({
    startsAt: a.slot.startsAt,
    endsAt: a.slot.endsAt,
  }));
  const timeSummary = formatBookingSlotsSummaryForMail("zh-HK", slotIntervals);
  const trimmedLabels = sortedAlloc
    .map((a) => a.slot.venueLabel?.trim())
    .filter((v): v is string => Boolean(v));
  const uniqueVenueLabels = [...new Set(trimmedLabels)];
  const roomSummaryZh =
    uniqueVenueLabels.length === 1
      ? `預約房間／空間：${displayVenueLabel(uniqueVenueLabels[0])}`
      : uniqueVenueLabels.length > 1
        ? `預約房間／空間：${uniqueVenueLabels.map((l) => displayVenueLabel(l)).join("、")}`
        : booking.venueKind === "open_space"
          ? "預約房間／空間：大型樂器／開放空間（時段未標示獨立場地編號）"
          : "預約房間／空間：琴室（時段未標示房間編號）";
  const perSlotLinesZh = sortedAlloc.map((a, i) => {
    const base = formatSlotListLineZhDateEnRange(a.slot.startsAt, a.slot.endsAt);
    const v = a.slot.venueLabel?.trim();
    const space = v
      ? displayVenueLabel(v)
      : booking.venueKind === "open_space"
        ? "大型樂器／開放空間"
        : "琴室";
    return `${i + 1}. ${base} · ${space}（香港時間）`;
  });
  const statusZh =
    booking.status === "approved"
      ? "已確認（系統即時通過）"
      : booking.status;

  const subject = `【新預約】${p?.nameZh ?? booking.user.email}｜${sessionCountWithHoursPack("zh-HK", perSlotLinesZh.length)}｜${booking.id.slice(0, 8)}`;

  const venueLine =
    booking.venueKind === "open_space"
      ? "預約系統類型：大型樂器／開放空間"
      : "預約系統類型：琴室";

  const cameraLine = !booking.cameraRentalOptIn
    ? "Sony 4K 攝錄機租用：否"
    : booking.cameraRentalPaymentChoice === "paid_before_booking"
      ? "Sony 4K 攝錄機租用：是（已表示先完成付款）"
      : booking.cameraRentalPaymentChoice === "pay_after_booking"
        ? "Sony 4K 攝錄機租用：是（預約後付款）"
        : "Sony 4K 攝錄機租用：是（付款方式未記錄）";

  const lines = [
    `有新的預約提交。`,
    ``,
    `預約節數：${sessionCountWithHoursPack("zh-HK", perSlotLinesZh.length)}`,
    `預約狀態：${statusZh}`,
    roomSummaryZh,
    venueLine,
    ``,
    `時段摘要（香港時間，按日期合併連續時段）：`,
    ...timeSummary.textLines.map((line) => `  ${line}`),
    ``,
    `預約編號：${booking.id}`,
    cameraLine,
    `使用者類別（提交當刻）：${categoryZh}`,
    `今次預約身份：${bookingIdentityTypeLabelZh(booking.bookingIdentityType)}`,
    ``,
    `—— 聯絡資料 ——`,
    `中文姓名：${p?.nameZh ?? "—"}`,
    `英文姓名：${p?.nameEn ?? "—"}`,
    `Email：${booking.user.email}`,
    `電話：${p?.phone ?? "—"}`,
    `年齡：${p?.age ?? "—"}`,
    `性別：未有記錄（登記表單未收集此欄位）`,
    ``,
    `—— 社群／身份 ——`,
    `IG 追蹤狀態：${igLine(p)}`,
    `身份標籤：${identities}`,
    `樂器／領域：${p?.instrumentField ?? "—"}`,
    ``,
    `—— 各節時段（含房間／空間）——`,
    ...perSlotLinesZh,
    ``,
    `Bonus 時段：${booking.usesBonusSlot ? "是" : "否"}`,
  ];

  const text = lines.join("\n");

  const safe = (v: string) => escapeHtml(v);
  const perSlotHtml = perSlotLinesZh
    .map((line) => `<li style="margin:0 0 4px;">${safe(line)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="zh-HK"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:20px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;color:#1c1917;">
  <h1 style="font-size:18px;margin:0 0 12px;">新預約</h1>
  <div style="margin:0 0 16px;padding:12px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:14px;line-height:1.55;color:#14532d;">
    <p style="margin:0 0 6px;"><strong>預約節數：</strong>${safe(sessionCountWithHoursPack("zh-HK", perSlotLinesZh.length))}</p>
    <p style="margin:0 0 8px;"><strong>預約狀態：</strong>${safe(statusZh)}</p>
    <p style="margin:0 0 8px;"><strong>${safe(roomSummaryZh)}</strong></p>
    <p style="margin:0 0 8px;">${safe(venueLine)}</p>
    <p style="margin:0 0 4px;font-weight:600;">時段摘要（香港時間，按日期合併連續時段）</p>
    ${timeSummary.htmlBlock}
  </div>
  <p style="margin:0 0 8px;">預約編號：<code>${safe(booking.id)}</code></p>
  <p style="margin:0 0 6px;">${safe(cameraLine)}</p>
  <p style="margin:0 0 16px;"><strong>使用者類別（提交當刻）：</strong>${safe(categoryZh)}<br />
  <strong>今次預約身份：</strong>${safe(bookingIdentityTypeLabelZh(booking.bookingIdentityType))}</p>
  <p style="margin:0 0 6px;font-weight:600;">聯絡及個人資料</p>
  <table style="border-collapse:collapse;width:100%;max-width:520px;">
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;width:140px;">中文姓名</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.nameZh ?? "—")}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">英文姓名</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.nameEn ?? "—")}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">Email</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(booking.user.email)}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">電話</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.phone ?? "—")}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">年齡</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(String(p?.age ?? "—"))}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">性別</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">未有記錄（登記表單未收集）</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">IG 追蹤</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(igLine(p))}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">身份標籤</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(identities)}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">樂器／領域</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.instrumentField ?? "—")}</td></tr>
  </table>
  <p style="margin:16px 0 6px;font-weight:600;">各節時段（香港時間，含房間／空間）</p>
  <ul style="margin:0;padding-left:20px;">${perSlotHtml}</ul>
  <p style="margin:16px 0 0;font-size:13px;color:#57534e;">Bonus 時段：${safe(booking.usesBonusSlot ? "是" : "否")}</p>
</body></html>`;

  if (process.env.NODE_ENV === "development") {
    console.info("[email:booking_admin_notify]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    for (const toEmail of toList) {
      await logEmail({
        userId: booking.userId,
        templateKey: "booking_admin_notify",
        toEmail,
        subject,
        payload: { bookingRequestId: booking.id, channel: "none" },
        status: EmailLogStatus.failed,
        error: "RESEND_API_KEY 未設定；管理員通知電郵未寄出。",
      });
    }
    return;
  }

  const resend = new Resend(apiKey);

  for (const toEmail of toList) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: [toEmail],
        subject,
        text,
        html,
      });

      if (error) {
        const msg = error.message ?? JSON.stringify(error);
        await logEmail({
          userId: booking.userId,
          templateKey: "booking_admin_notify",
          toEmail,
          subject,
          payload: { bookingRequestId: booking.id, channel: "resend" },
          status: EmailLogStatus.failed,
          error: msg,
        });
        continue;
      }

      await logEmail({
        userId: booking.userId,
        templateKey: "booking_admin_notify",
        toEmail,
        subject,
        payload: { bookingRequestId: booking.id, channel: "resend" },
        status: EmailLogStatus.sent,
        providerMessageId: data?.id,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logEmail({
        userId: booking.userId,
        templateKey: "booking_admin_notify",
        toEmail,
        subject,
        payload: { bookingRequestId: booking.id, channel: "resend" },
        status: EmailLogStatus.failed,
        error: msg,
      });
    }
  }
}
