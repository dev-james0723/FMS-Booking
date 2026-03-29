import {
  BookingRequestStatus,
  type BookingVenueKind,
} from "@prisma/client";
import { COUNTED_REQUEST_STATUS } from "@/lib/booking/day-counts";
import { mergeConsecutiveSlots } from "@/lib/booking/merge-slots";
import { prisma } from "@/lib/prisma";

export function bookingCalendarTitlePrefix(
  status: BookingRequestStatus,
  venueKind: BookingVenueKind
): string {
  const place =
    venueKind === "open_space" ? "幻樂空間 · 開放空間" : "幻樂空間 · 琴室";
  switch (status) {
    case "approved":
    case "pending":
      return place;
    case "waitlisted":
      return `【後補】${place}`;
    default:
      return place;
  }
}

export type UserCalendarMergedBlock = {
  bookingId: string;
  requestStatus: BookingRequestStatus;
  venueKind: BookingVenueKind;
  mergedStart: Date;
  mergedEnd: Date;
  sessionCount: number;
  venueLabel: string | null;
};

/** Bookings that count toward quota, with consecutive slots merged (same rules as former .ics export). */
export async function loadUserCalendarMergedBlocks(
  userId: string,
  venueKind: BookingVenueKind
): Promise<UserCalendarMergedBlock[]> {
  const rows = await prisma.bookingRequest.findMany({
    where: {
      userId,
      venueKind,
      status: { in: COUNTED_REQUEST_STATUS },
    },
    orderBy: { requestedAt: "desc" },
    include: {
      allocations: {
        where: { status: { in: ["pending", "approved"] } },
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
    },
  });

  const out: UserCalendarMergedBlock[] = [];
  for (const r of rows) {
    const slots = r.allocations.map((a) => ({
      startsAt: a.slot.startsAt,
      endsAt: a.slot.endsAt,
      venueLabel: a.slot.venueLabel,
    }));
    const merged = mergeConsecutiveSlots(slots);
    for (const m of merged) {
      out.push({
        bookingId: r.id,
        requestStatus: r.status,
        venueKind: r.venueKind,
        mergedStart: m.start,
        mergedEnd: m.end,
        sessionCount: m.sessionCount,
        venueLabel: m.venueLabel,
      });
    }
  }
  return out;
}

/** Studio-channel accounts may have both venue kinds; sync all quota-counted bookings to Google Calendar. */
export async function loadUserCalendarMergedBlocksForProfile(
  userId: string,
  profileVenueKind: BookingVenueKind
): Promise<UserCalendarMergedBlock[]> {
  const kinds: BookingVenueKind[] =
    profileVenueKind === "studio_room" ? ["studio_room", "open_space"] : ["open_space"];
  const parts = await Promise.all(kinds.map((k) => loadUserCalendarMergedBlocks(userId, k)));
  return parts.flat().sort((a, b) => a.mergedStart.getTime() - b.mergedStart.getTime());
}
