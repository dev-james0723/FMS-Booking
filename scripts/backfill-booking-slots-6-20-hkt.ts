/**
 * Idempotently ensures every campaign day has 30-minute booking rows from 06:00–20:00 HKT
 * (last slot 19:30–20:00) for both studio_room and open_space, without removing existing slots.
 *
 * Run after changing slot hours: `npx tsx scripts/backfill-booking-slots-6-20-hkt.ts`
 */
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { BookingVenueKind, PrismaClient } from "@prisma/client";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
} from "../src/lib/booking/campaign-constants";
import { addDaysToDateKey } from "../src/lib/hk-calendar-client";
import { TIMELINE_START_HOUR } from "../src/lib/booking/day-timeline";

const HK = "Asia/Hong_Kong";
const prisma = new PrismaClient();

function slotKey(ms: number, venue: BookingVenueKind) {
  return `${ms}:${venue}`;
}

async function main() {
  const existing = await prisma.bookingSlot.findMany({
    select: { startsAt: true, venueKind: true },
  });
  const seen = new Set(existing.map((r) => slotKey(r.startsAt.getTime(), r.venueKind)));

  type Row = {
    startsAt: Date;
    endsAt: Date;
    capacityTotal: number;
    isOpen: boolean;
    venueLabel: string | null;
    venueKind: BookingVenueKind;
  };

  const rows: Row[] = [];
  let dayKey = CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY;
  for (;;) {
    for (let h = TIMELINE_START_HOUR; h <= 19; h++) {
      for (const mm of [0, 30] as const) {
        const hm = `${String(h).padStart(2, "0")}:${mm === 0 ? "00" : "30"}:00`;
        const startsAt = fromZonedTime(`${dayKey}T${hm}`, HK);
        const endsAt = addMinutes(startsAt, 30);

        for (const [venueKind, capacityTotal, label] of [
          [BookingVenueKind.studio_room, 1, "幻樂空間 · Room No.2"] as const,
          [BookingVenueKind.open_space, 1, "幻樂空間 · 開放空間（Open Space）"] as const,
        ]) {
          const k = slotKey(startsAt.getTime(), venueKind);
          if (seen.has(k)) continue;
          seen.add(k);
          rows.push({
            startsAt,
            endsAt,
            capacityTotal,
            isOpen: true,
            venueLabel: label,
            venueKind,
          });
        }
      }
    }
    if (dayKey === CAMPAIGN_EXPERIENCE_LAST_DAY_KEY) break;
    dayKey = addDaysToDateKey(dayKey, 1);
  }

  if (rows.length === 0) {
    console.log("No missing slots; database already has full 06:00–20:00 HKT coverage.");
    return;
  }

  await prisma.bookingSlot.createMany({ data: rows });
  console.log("Inserted booking_slots:", rows.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
