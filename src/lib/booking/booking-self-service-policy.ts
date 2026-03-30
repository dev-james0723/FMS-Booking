/** Hours before slot start after which users cannot self-serve change/cancel online. */
export const BOOKING_SELF_SERVICE_CUTOFF_HOURS = 15;

export const BOOKING_SELF_SERVICE_CUTOFF_MS =
  BOOKING_SELF_SERVICE_CUTOFF_HOURS * 60 * 60 * 1000;
