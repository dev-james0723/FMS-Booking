import { formatInTimeZone } from "date-fns-tz";
import { google } from "googleapis";
import { sessionCountWithHoursPack } from "@/lib/i18n/session-hours";
import { HK_TZ } from "@/lib/time";
import { identityFlagsToZh, userCategoryLabelZh } from "@/lib/identity-labels";
import type { BookingAllocation, BookingRequest, BookingSlot, User, UserProfile } from "@prisma/client";

type FullBooking = BookingRequest & {
  user: User & { profile: UserProfile | null; category: { code: string } | null };
  allocations: (BookingAllocation & { slot: BookingSlot })[];
};

function igLine(p: UserProfile | null): string {
  if (!p) return "—";
  if (p.socialFollowVerified) return "已核實追蹤官方 IG";
  if (p.socialFollowClaimed) return "已聲明完成追蹤（待核實）";
  return "未聲明／未完成";
}

/**
 * Creates one calendar event spanning the first slot start → last slot end.
 * Requires a Google Cloud service account with Calendar API enabled, and the
 * target calendar shared with the service account email (編輯活動權限).
 */
export async function syncBookingRequestToGoogleCalendar(
  booking: FullBooking
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const jsonStr = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON?.trim();
  if (!jsonStr) {
    console.info(
      "[google-calendar] GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON not set; skip Calendar sync"
    );
    return { ok: true, skipped: true };
  }

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(jsonStr) as { client_email: string; private_key: string };
  } catch {
    return { ok: false, error: "Invalid GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON" };
  }

  if (!creds.client_email || !creds.private_key) {
    return { ok: false, error: "Service account JSON missing client_email or private_key" };
  }

  const calendarId =
    process.env.GOOGLE_CALENDAR_ID?.trim() || "dfestival.office@gmail.com";

  const sorted = [...booking.allocations].sort(
    (a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime()
  );
  if (sorted.length === 0) {
    return { ok: true, skipped: true };
  }

  const p = booking.user.profile;
  const categoryCode =
    booking.userCategoryAtRequest || booking.user.category?.code || "";
  const categoryZh = userCategoryLabelZh(categoryCode);
  const identities = p ? identityFlagsToZh(p.identityFlags).join("、") : "—";

  const slotLines = sorted.map((a, i) => {
    const aStr = formatInTimeZone(
      a.slot.startsAt,
      HK_TZ,
      "yyyy-MM-dd HH:mm"
    );
    const bStr = formatInTimeZone(a.slot.endsAt, HK_TZ, "yyyy-MM-dd HH:mm");
    return `${i + 1}. ${aStr} – ${bStr}`;
  });

  const cameraLine = !booking.cameraRentalOptIn
    ? "Sony 4K 攝錄機租用：否"
    : booking.cameraRentalPaymentChoice === "paid_before_booking"
      ? "Sony 4K 攝錄機租用：是（先付款）"
      : booking.cameraRentalPaymentChoice === "pay_after_booking"
        ? "Sony 4K 攝錄機租用：是（預約後付款）"
        : "Sony 4K 攝錄機租用：是";

  const description = [
    `預約編號：${booking.id}`,
    cameraLine,
    `姓名：${p?.nameZh ?? "—"}`,
    `Email：${booking.user.email}`,
    `電話：${p?.phone ?? "—"}`,
    `類別：${categoryZh}`,
    `IG：${igLine(p)}`,
    `身份：${identities}`,
    `性別：未有記錄（登記未收集）`,
    ``,
    `時段（香港時間）：`,
    ...slotLines,
  ].join("\n");

  const start = sorted[0].slot.startsAt;
  const end = sorted[sorted.length - 1].slot.endsAt;
  const startStr = formatInTimeZone(start, HK_TZ, "yyyy-MM-dd'T'HH:mm:ss");
  const endStr = formatInTimeZone(end, HK_TZ, "yyyy-MM-dd'T'HH:mm:ss");

  const summary = `FMS 預約｜${p?.nameZh ?? booking.user.email}｜${sessionCountWithHoursPack("zh-HK", sorted.length)}`;

  try {
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        start: { dateTime: startStr, timeZone: HK_TZ },
        end: { dateTime: endStr, timeZone: HK_TZ },
      },
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[google-calendar] events.insert failed", msg);
    return { ok: false, error: msg };
  }
}
