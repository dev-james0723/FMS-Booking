/**
 * Piano room (studio_room) only: closes slots (is_open = false) for 2026-04-05 and 2026-04-06,
 * Hong Kong 15:00–17:00 (four 30-minute cells). Open space slots for the same times are forced
 * open so large-instrument users can still book.
 *
 * Usage (repo root, DATABASE_URL in .env):
 *   npx tsx scripts/apply-apr-5-6-slot-holds.ts
 * Undo (re-open piano slots for those cells only):
 *   npx tsx scripts/apply-apr-5-6-slot-holds.ts --undo
 */
import { BookingVenueKind, PrismaClient } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { hkDayStartUtc, hkDayEndUtc } from "../src/lib/booking/hk-dates";
import { HK_TZ } from "../src/lib/time";

const prisma = new PrismaClient();

const DATE_KEYS = ["2026-04-05", "2026-04-06"] as const;
const HELD_START_HK = new Set(["15:00", "15:30", "16:00", "16:30"]);

async function main() {
  const undo = process.argv.includes("--undo");
  let studioTouched = 0;
  let openSpaceTouched = 0;

  for (const dk of DATE_KEYS) {
    const rows = await prisma.bookingSlot.findMany({
      where: {
        startsAt: { gte: hkDayStartUtc(dk), lte: hkDayEndUtc(dk) },
      },
    });

    for (const s of rows) {
      const hm = formatInTimeZone(s.startsAt, HK_TZ, "HH:mm");
      if (!HELD_START_HK.has(hm)) continue;

      if (undo) {
        if (s.venueKind === BookingVenueKind.studio_room) {
          await prisma.bookingSlot.update({
            where: { id: s.id },
            data: { isOpen: true },
          });
          studioTouched++;
        }
        continue;
      }

      if (s.venueKind === BookingVenueKind.studio_room) {
        await prisma.bookingSlot.update({
          where: { id: s.id },
          data: { isOpen: false },
        });
        studioTouched++;
      } else if (s.venueKind === BookingVenueKind.open_space) {
        await prisma.bookingSlot.update({
          where: { id: s.id },
          data: { isOpen: true },
        });
        openSpaceTouched++;
      }
    }
  }

  if (undo) {
    console.log(
      `Re-opened ${studioTouched} piano-room slot row(s) (2026-04-05 & 2026-04-06, 15:00–17:00 HKT).`
    );
  } else {
    console.log(
      `Closed ${studioTouched} piano-room slot row(s); ensured ${openSpaceTouched} open-space row(s) open (same dates & times).`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
