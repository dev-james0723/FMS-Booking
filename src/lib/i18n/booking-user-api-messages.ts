import type { BookingRuleError } from "@/lib/booking/booking-errors";
import type { UserBookingMutationError } from "@/lib/booking/user-booking-mutations";
import type { Locale } from "@/lib/i18n/types";

function slotSuffix(locale: Locale, slotId: string | undefined): string {
  if (!slotId) return "";
  const p = slotId.slice(0, 8);
  return locale === "en" ? ` (ref ${p}…)` : `（slot ${p}…）`;
}

function asRecord(d: unknown): Record<string, unknown> | null {
  return d && typeof d === "object" ? (d as Record<string, unknown>) : null;
}

function strField(r: Record<string, unknown> | null, k: string): string | undefined {
  const v = r?.[k];
  return typeof v === "string" ? v : undefined;
}

function numField(r: Record<string, unknown> | null, k: string): number | undefined {
  const v = r?.[k];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** User-facing API message for `BookingRuleError` (new booking). */
export function bookingRuleErrorUserMessage(locale: Locale, e: BookingRuleError): string {
  const d = asRecord(e.details);
  const slotId = strField(d, "slotId");
  const slotDate = strField(d, "slotDate");
  const date = strField(d, "date");
  const count = numField(d, "count");
  const rollingMax = numField(d, "rollingMax");
  const isEn = locale === "en";

  switch (e.code) {
    case "BOOKING_NOT_OPEN":
      return isEn ? "Booking is not open yet." : "預約系統尚未開放";
    case "MUST_CHANGE_PASSWORD":
      return isEn ? "Please change your temporary password first." : "請先更改臨時密碼";
    case "REGISTRATION_INCOMPLETE":
      if (e.message.includes("帳戶未設定有效預約身份")) {
        return isEn
          ? "Your account has no valid booking identity on file — please contact the organiser."
          : "帳戶未設定有效預約身份，請聯絡主辦方。";
      }
      return isEn ? "Please complete registration first." : "請先完成登記";
    case "ACCOUNT_NOT_ACTIVE":
      return isEn ? "Your account cannot book in its current state." : "帳戶狀態未能預約";
    case "CAMERA_RENTAL_INCOMPLETE":
      return isEn
        ? "You opted in for camera rental — please confirm how you will pay before submitting."
        : "已選擇租用攝錄機，請完成付款方式確認後再提交。";
    case "VALIDATION_ERROR":
      return isEn ? "Camera rental options are inconsistent." : "相機租用資料不一致";
    case "NO_SLOTS":
      return isEn ? "Please select at least one time slot." : "請選擇至少一個時段";
    case "CAMPAIGN_DATE_INVALID":
      if (e.message.includes("已過去")) {
        return isEn
          ? `You cannot choose a slot in the past.${slotSuffix(locale, slotId)}`
          : `不可選擇已過去的時段${slotSuffix(locale, slotId)}`;
      }
      if (slotId) {
        return isEn
          ? `That slot is outside the campaign dates.${slotSuffix(locale, slotId)}`
          : `時段不在活動有效期內${slotSuffix(locale, slotId)}`;
      }
      return isEn ? "Campaign dates are not configured." : "活動日期未設定";
    case "BOOKING_VENUE_MIXED":
      return isEn
        ? "All selected slots must belong to the same booking system (studio room or open space)."
        : "所選時段必須屬於同一預約系統（琴房或開放空間）";
    case "BOOKING_VENUE_MISMATCH":
      return isEn
        ? "This account may only book Open Space slots — use the large-instrument / open-space booking page. Studio registrants may book either channel (shared session cap)."
        : "此帳戶僅可預約開放空間時段；請使用大型樂器／開放空間預約頁面。琴室通道登記者可於琴室或開放空間預約（節數上限共用）。";
    case "SLOT_CLOSED":
      return isEn ? `This slot is closed.${slotSuffix(locale, slotId)}` : `時段已關閉${slotSuffix(locale, slotId)}`;
    case "BOOKING_OUTSIDE_ROLLING_WINDOW":
      return isEn
        ? `You can only book slots within the next 3 Hong Kong calendar days.${slotSuffix(locale, slotId)}${slotDate && isEn ? ` (${slotDate})` : ""}`
        : `你目前只可預約未來 3 日內之時段。${slotSuffix(locale, slotId)}`;
    case "SLOT_FULL":
      return isEn
        ? `That slot is fully booked — please pick another time.${slotSuffix(locale, slotId)}`
        : `該時段已被預約，請選擇其他時間。${slotSuffix(locale, slotId)}`;
    case "SLOT_OVERLAP":
      return isEn
        ? "The slots overlap with each other or an existing booking."
        : "所選時段與現有預約重疊或彼此重疊";
    case "BOOKING_LIMIT_DAILY":
      return isEn
        ? `You have reached your daily booking limit${date ? ` on ${date}` : ""}${typeof count === "number" ? ` (${count} sessions).` : "."}`
        : "你今日的可預約時段已達上限。";
    case "BOOKING_LIMIT_ROLLING_3D":
      return isEn
        ? `You have reached the rolling 3-day session limit${typeof rollingMax === "number" ? ` (max ${rollingMax} sessions).` : "."}`
        : "你於連續 3 日內的可預約時段已達上限。";
    case "BONUS_INVALID":
      return isEn ? "That bonus slot is invalid or already used." : "Bonus 時段無效或已用盡";
    case "BOOKING_IDENTITY_INELIGIBLE":
      return isEn ? "You are not eligible for the identity type you selected." : "你未具備所選身份類別的預約資格。";
    case "BOOKING_IDENTITY_REQUIRED":
      return isEn ? "Please choose which identity type applies to this booking." : "請選擇今次預約所使用之身份類別。";
    case "BOOKING_COOLDOWN_ACTIVE":
      return isEn
        ? "You recently submitted a booking — please wait 3 hours before submitting another."
        : "你剛完成預約，請於 3 小時後再提交新的預約。";
    default:
      return e.message;
  }
}

/** User-facing API message for reschedule / release / cancel-slot flows. */
export function userBookingMutationUserMessage(locale: Locale, e: UserBookingMutationError): string {
  const isEn = locale === "en";
  const d = e.details;
  const slotId = d?.slotId ?? extractSlotIdFromMessage(e.message);
  const day = d?.day;
  const dailyMax = d?.dailyMax;
  const rollingMax = d?.rollingMax;

  switch (e.code) {
    case "WITHIN_CUTOFF":
      return isEn
        ? "These slots start in less than 15 hours — contact the organiser via WhatsApp to change or cancel."
        : "所選時段距開始不足 15 小時，請聯絡主辦方以 WhatsApp 協助更改或取消。";
    case "NO_CHANGE":
      return isEn
        ? "Choose slot(s) to release and/or replacement slot(s) to add."
        : "請選擇要釋放的時段和／或要新增的替換時段";
    case "NOT_FOUND":
      return isEn ? "Booking not found." : "預約不存在";
    case "FORBIDDEN":
      if (d?.reason === "no_profile") {
        return isEn ? "We could not load your profile for this booking." : "無法處理此預約";
      }
      if (d?.reason === "booking_channel") {
        return isEn
          ? "This account cannot modify bookings in this channel."
          : "此帳戶不可修改此通道的預約";
      }
      return e.message;
    case "INVALID_STATUS":
      if (e.message.includes("取消")) {
        return isEn ? "This booking’s status cannot be changed for cancellation." : "此預約狀態無法取消時段";
      }
      return isEn ? "This booking’s status cannot be rescheduled." : "此預約狀態無法更改時段";
    case "INVALID_REMOVE":
      if (e.message.includes("該日")) {
        return isEn ? "No cancellable slots on that date." : "該日沒有可取消的時段";
      }
      return isEn
        ? `The slot to remove is not part of this booking.${slotSuffix(locale, slotId)}`
        : `所選釋放時段不屬於此預約${slotSuffix(locale, slotId)}`;
    case "DUPLICATE_SLOT":
      return isEn
        ? `New slot duplicates one you are keeping.${slotSuffix(locale, slotId)}`
        : `新時段與保留時段重複${slotSuffix(locale, slotId)}`;
    case "EMPTY_RESULT":
      return isEn ? "You must keep at least one slot after the change." : "更改後須至少保留一個時段";
    case "SETTINGS":
      return isEn ? "Campaign dates are not set — rescheduling is unavailable." : "活動日期未設定，無法更改時段";
    case "SLOT_NOT_FOUND":
      return isEn ? "Some replacement slots were not found." : "部分替換時段不存在";
    case "VENUE_MISMATCH":
      return isEn ? "Replacement slots must be in the same venue system as the booking." : "替換時段必須與原預約屬同一場地系統";
    case "SLOT_CLOSED":
      return isEn ? `That slot is closed.${slotSuffix(locale, slotId)}` : `時段已關閉${slotSuffix(locale, slotId)}`;
    case "CAMPAIGN_DATE_INVALID":
      return isEn
        ? `That slot is outside the campaign dates.${slotSuffix(locale, slotId)}`
        : `時段不在活動有效期內${slotSuffix(locale, slotId)}`;
    case "BOOKING_OUTSIDE_ROLLING_WINDOW":
      return isEn
        ? "Self-service changes are limited to available slots within the next 3 Hong Kong calendar days (same window as new bookings)."
        : "自行更改時段只可選未來 3 個香港曆日內之可用時段（與新預約相同之滾動窗口）。";
    case "INTERNAL":
      return isEn ? "Slot data is inconsistent. Please try again." : "時段資料不一致";
    case "SLOT_FULL":
      return isEn
        ? `That slot is full — cannot complete the change.${slotSuffix(locale, slotId)}`
        : `時段已滿，無法完成更改${slotSuffix(locale, slotId)}`;
    case "BOOKING_LIMIT_DAILY":
      if (day != null && dailyMax != null) {
        return isEn
          ? `This change would exceed your daily limit (${dailyMax} sessions) on ${day}.`
          : `此更改會令你於 ${day} 超出每日節數上限（${dailyMax} 節）。`;
      }
      return isEn
        ? "This change would exceed your daily session limit."
        : "此更改會令你超出每日節數上限。";
    case "BOOKING_LIMIT_ROLLING_3D":
      if (rollingMax != null) {
        return isEn
          ? `This change would exceed your rolling 3-day limit (${rollingMax} sessions).`
          : `此更改會令你超出連續三個曆日之節數上限（${rollingMax} 節）。`;
      }
      return isEn
        ? "This change would exceed your rolling 3-day session limit."
        : "此更改會令你超出連續三個曆日之節數上限。";
    case "VALIDATION_ERROR":
      return isEn ? "Please choose slot(s) or a date to cancel." : "請選擇要取消的時段或日期";
    default:
      return e.message;
  }
}

function extractSlotIdFromMessage(msg: string): string | undefined {
  const m = msg.match(/slot\s+([a-f0-9]{8})/i);
  return m?.[1];
}
