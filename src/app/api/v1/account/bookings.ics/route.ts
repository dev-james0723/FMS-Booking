import { BookingRequestStatus } from "@prisma/client";
import { requireUserSession } from "@/lib/auth/require-session";
import { COUNTED_REQUEST_STATUS } from "@/lib/booking/day-counts";
import { mergeConsecutiveSlots } from "@/lib/booking/merge-slots";
import { buildBookingsIcsCalendar } from "@/lib/venue-calendar";
import { prisma } from "@/lib/prisma";

function statusPrefix(status: BookingRequestStatus): string {
  switch (status) {
    case "approved":
      return "幻樂空間 · Room No.2";
    case "pending":
      return "【待審核】幻樂空間 · Room No.2";
    case "waitlisted":
      return "【後補】幻樂空間 · Room No.2";
    default:
      return "幻樂空間 · Room No.2";
  }
}

export async function GET() {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const rows = await prisma.bookingRequest.findMany({
    where: {
      userId: auth.userId,
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

  const events: {
    uid: string;
    title: string;
    start: Date;
    end: Date;
    description: string;
  }[] = [];

  for (const r of rows) {
    const slots = r.allocations.map((a) => ({
      startsAt: a.slot.startsAt,
      endsAt: a.slot.endsAt,
      venueLabel: a.slot.venueLabel,
    }));
    const merged = mergeConsecutiveSlots(slots);
    let i = 0;
    for (const m of merged) {
      i += 1;
      const title = `${statusPrefix(r.status)}｜${m.sessionCount} 節（30 分鐘）`;
      const desc = [
        `預約編號：${r.id}`,
        `狀態：${r.status}`,
        m.venueLabel ? `場地：${m.venueLabel}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      events.push({
        uid: `${r.id}-${m.start.getTime()}-${i}`,
        title,
        start: m.start,
        end: m.end,
        description: desc,
      });
    }
  }

  const ics = buildBookingsIcsCalendar({ events });
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fms-bookings.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
