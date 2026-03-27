import { fromZonedTime } from "date-fns-tz";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
} from "@/lib/booking/campaign-constants";
import { bookableStartHourForCampaignDateKey } from "@/lib/booking/day-timeline";
import { addDaysToDateKey } from "@/lib/hk-calendar-client";
import { HK_TZ } from "@/lib/time";

const PREVIEW_SLOT_MS = 30 * 60 * 1000;

/** Matches seeded slot capacity; timeline treats remaining > 0 as “available” (green). */
export const PREVIEW_SLOT_TIMELINE_CAPACITY = 2;
export const PREVIEW_SLOT_TIMELINE_REMAINING = 2;

export type PreviewSlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
};

/** Shape returned by calendar overview API / used by `DaySlotsTimeline`. */
export type OverviewTimelineSlotPayload = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  capacityTotal: number;
  isOpen: boolean;
  venueLabel: string | null;
};

/**
 * Synthetic slots for UX preview before `booking_opens_at`.
 * Matches campaign bookable hours (first day 11:00–20:00; other days 06:00–20:00).
 */
export function buildPreviewSlotsForHkDay(dateKey: string): PreviewSlotRow[] {
  const startHour = bookableStartHourForCampaignDateKey(dateKey);
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
      remaining: PREVIEW_SLOT_TIMELINE_REMAINING,
      venueLabel: null,
    });
    t = ends;
  }
  return out;
}

/**
 * Full campaign-range synthetic slots for calendar overview while booking is still closed.
 * Every in-range day gets 30-minute rows from bookable start through 20:00 HKT, all “available”.
 */
export function buildCampaignPreviewTimelineSlots(): OverviewTimelineSlotPayload[] {
  const out: OverviewTimelineSlotPayload[] = [];
  let dk = CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY;
  for (;;) {
    for (const row of buildPreviewSlotsForHkDay(dk)) {
      out.push({
        id: row.id,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        remaining: PREVIEW_SLOT_TIMELINE_REMAINING,
        capacityTotal: PREVIEW_SLOT_TIMELINE_CAPACITY,
        isOpen: true,
        venueLabel: row.venueLabel,
      });
    }
    if (dk === CAMPAIGN_EXPERIENCE_LAST_DAY_KEY) break;
    dk = addDaysToDateKey(dk, 1);
  }
  return out;
}
