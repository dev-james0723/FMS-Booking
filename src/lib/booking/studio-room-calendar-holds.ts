import { formatInTimeZone } from "date-fns-tz";
import { HK_TZ } from "@/lib/time";

/** Piano-room-only calendar holds (does not apply to open_space). */
export const STUDIO_ROOM_CALENDAR_HOLD_DATE_KEYS = ["2026-04-05", "2026-04-06"] as const;

const HOLD_DATE_SET = new Set<string>(STUDIO_ROOM_CALENDAR_HOLD_DATE_KEYS);

/** Hong Kong wall-clock start times (HH:mm) for held 30-minute cells: 15:00–17:00. */
export const STUDIO_ROOM_CALENDAR_HOLD_START_HK = new Set([
  "15:00",
  "15:30",
  "16:00",
  "16:30",
]);

export function slotStartsAtMatchesStudioRoomCalendarHold(startsAtIso: string): boolean {
  const dk = new Date(startsAtIso).toLocaleDateString("en-CA", { timeZone: HK_TZ });
  if (!HOLD_DATE_SET.has(dk)) return false;
  const hm = formatInTimeZone(new Date(startsAtIso), HK_TZ, "HH:mm");
  return STUDIO_ROOM_CALENDAR_HOLD_START_HK.has(hm);
}

type SlotLike = {
  startsAt: string;
  isOpen: boolean;
  remaining: number;
};

/**
 * Piano-room calendar overview only. Preview: always grey out holds. Live: grey only when the
 * slot is already closed in DB (so booking page stays consistent).
 */
export function applyStudioRoomCalendarHoldsToTimelineSlots<T extends SlotLike>(
  venueKind: "studio_room" | "open_space",
  slots: T[],
  mode: "preview" | "live"
): Array<T & { studioHoldNotApplicable?: boolean }> {
  if (venueKind !== "studio_room") return slots;

  return slots.map((s) => {
    if (!slotStartsAtMatchesStudioRoomCalendarHold(s.startsAt)) return s;

    if (mode === "preview") {
      return {
        ...s,
        isOpen: false,
        remaining: 0,
        studioHoldNotApplicable: true,
      };
    }

    const dbClosed = !s.isOpen || s.remaining <= 0;
    if (!dbClosed) return s;

    return {
      ...s,
      isOpen: false,
      remaining: 0,
      studioHoldNotApplicable: true,
    };
  });
}
