import type { BookingVenueKind } from "@prisma/client";

/** Query `venue=studio_room` | `venue=open_space`. Defaults to 琴房 when omitted. */
export function parseBookingVenueQuery(raw: string | null | undefined): BookingVenueKind {
  if (raw === "open_space") return "open_space";
  return "studio_room";
}

/**
 * Registration channel: `studio_room` users may book both studio and open-space slots (one shared quota).
 * `open_space`-only registrants may book open space only.
 */
export function userMayAccessBookingVenue(
  profileVenueKind: BookingVenueKind,
  requestedVenueKind: BookingVenueKind
): boolean {
  if (profileVenueKind === "open_space") {
    return requestedVenueKind === "open_space";
  }
  return requestedVenueKind === "studio_room" || requestedVenueKind === "open_space";
}
