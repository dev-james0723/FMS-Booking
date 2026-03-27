import type { BookingVenueKind } from "@prisma/client";

/** Admin list: how this user is classified for 琴房 vs 開放空間. */
export function adminUserInstrumentCategoryZh(
  bookingVenue: BookingVenueKind,
  instrumentField: string
): string {
  if (bookingVenue === "open_space") {
    return "大型樂器（開放空間預約系統）";
  }
  const t = instrumentField.trim();
  const low = t.toLowerCase();
  if (low === "piano" || t === "鋼琴" || t === "钢琴") {
    return "鋼琴（琴房預約系統）";
  }
  return "其他樂器（琴房預約系統）";
}
