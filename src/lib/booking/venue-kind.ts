import type { BookingVenueKind } from "@prisma/client";

/** Query `venue=studio_room` | `venue=open_space`. Defaults to 琴房 when omitted. */
export function parseBookingVenueQuery(raw: string | null | undefined): BookingVenueKind {
  if (raw === "open_space") return "open_space";
  return "studio_room";
}
