export type BookingHistoryVenueFlag = "studio_room" | "open_space";

const KEY = "fms_booking_history_expect_v1";

/** Call after a successful booking submit so the history page can refetch if the first read is stale. */
export function markExpectFreshBookingHistory(venue: BookingHistoryVenueFlag): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ venue, t: Date.now() }));
  } catch {
    /* private mode / quota */
  }
}

/**
 * Returns true once: user just submitted a booking for this venue (within the last 15 minutes).
 * Clears the flag so normal visits are unaffected.
 */
export function consumeExpectFreshBookingHistory(venue: BookingHistoryVenueFlag): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { venue?: string; t?: number };
    sessionStorage.removeItem(KEY);
    if (parsed.venue !== venue || typeof parsed.t !== "number") return false;
    if (Date.now() - parsed.t > 15 * 60_000) return false;
    return true;
  } catch {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
}
