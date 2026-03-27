export type BookingGateErrorCode =
  | "BOOKING_NOT_OPEN"
  | "MUST_CHANGE_PASSWORD"
  | "REGISTRATION_INCOMPLETE"
  | "ACCOUNT_NOT_ACTIVE"
  | "VALIDATION_ERROR"
  | "SLOT_NOT_FOUND"
  | "SLOT_CLOSED"
  | "SLOT_FULL"
  | "CAMPAIGN_DATE_INVALID"
  | "BOOKING_TOO_FAR_ADVANCE"
  | "BOOKING_OUTSIDE_ROLLING_WINDOW"
  | "BOOKING_LIMIT_DAILY"
  | "BOOKING_LIMIT_ROLLING_3D"
  | "SLOT_OVERLAP"
  | "BONUS_INVALID"
  | "NO_SLOTS"
  | "BOOKING_COOLDOWN_ACTIVE"
  | "BOOKING_IDENTITY_REQUIRED"
  | "BOOKING_IDENTITY_INELIGIBLE"
  | "BOOKING_VENUE_MISMATCH"
  | "BOOKING_VENUE_MIXED";

export class BookingRuleError extends Error {
  constructor(
    public code: BookingGateErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "BookingRuleError";
  }
}
