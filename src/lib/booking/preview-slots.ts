import { fromZonedTime } from "date-fns-tz";
import { CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY } from "@/lib/booking/campaign-constants";
import { HK_TZ } from "@/lib/time";

const PREVIEW_SLOT_MS = 30 * 60 * 1000;

export type PreviewSlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
};

/**
 * Synthetic slots for UX preview before `booking_opens_at`.
 * Matches campaign rules: first activity day 11:00–20:00 HKT, others 06:00–20:00.
 */
export function buildPreviewSlotsForHkDay(dateKey: string): PreviewSlotRow[] {
  const startHour = dateKey === CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY ? 11 : 6;
  let t = fromZonedTime(
    `${dateKey}T${String(startHour).padStart(2, "0")}:00:00`,
    HK_TZ
  );
  const dayEnd = fromZonedTime(`${dateKey}T20:00:00`, HK_TZ);
  const out: PreviewSlotRow[] = [];
  while (t.getTime() + PREVIEW_SLOT_MS <= dayEnd.getTime()) {
    const ends = new Date(t.getTime() + PREVIEW_SLOT_MS);
    out.push({
      id: `preview:${dateKey}:${t.getTime()}`,
      startsAt: t.toISOString(),
      endsAt: ends.toISOString(),
      remaining: 0,
      venueLabel: null,
    });
    t = ends;
  }
  return out;
}
