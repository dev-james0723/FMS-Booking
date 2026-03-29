import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import {
  bookingIdentityTypeLabelZh,
  identityFlagsToZh,
  userCategoryLabelZh,
} from "@/lib/identity-labels";
import { formatHkRange } from "@/lib/booking/day-timeline";
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

  const slots = [...booking.allocations]
    .sort((a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime())
    .map((a) =>
      formatHkRange(a.slot.startsAt, a.slot.endsAt)
    );

  const subject = `【新預約】${p?.nameZh ?? booking.user.email}｜${sessionCountWithHoursPack("zh-HK", slots.length)}｜${booking.id.slice(0, 8)}`;

  const venueLine =
    booking.venueKind === "open_space"
      ? "場地系統：開放空間（大型樂器）"
      : "場地系統：琴室（房間內）";

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
    `預約編號：${booking.id}`,
    `預約狀態：${booking.status}`,
    venueLine,
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
    `—— 時段 ——`,
    ...slots.map((s, i) => `${i + 1}. ${s}（香港時間）`),
    ``,
    `Bonus 時段：${booking.usesBonusSlot ? "是" : "否"}`,
  ];

  const text = lines.join("\n");

  const safe = (v: string) => escapeHtml(v);
  const html = `<!DOCTYPE html>
<html lang="zh-HK"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:20px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;color:#1c1917;">
  <h1 style="font-size:18px;margin:0 0 12px;">新預約</h1>
  <p style="margin:0 0 8px;">預約編號：<code>${safe(booking.id)}</code></p>
  <p style="margin:0 0 16px;">使用者類別：${safe(categoryZh)}</p>
  <table style="border-collapse:collapse;width:100%;max-width:520px;">
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;width:140px;">姓名</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.nameZh ?? "—")}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">Email</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(booking.user.email)}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">電話</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(p?.phone ?? "—")}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">IG 追蹤</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">${safe(igLine(p))}</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">性別</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;">未有記錄（登記表單未收集）</td></tr>
  </table>
  <p style="margin:16px 0 6px;font-weight:600;">時段（香港時間）</p>
  <ul style="margin:0;padding-left:20px;">${slots.map((s) => `<li>${safe(s)}</li>`).join("")}</ul>
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
