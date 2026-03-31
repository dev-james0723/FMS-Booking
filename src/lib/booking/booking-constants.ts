/**
 * @deprecated Only used for the **quota** "any 3 consecutive calendar days" display.
 * For booking horizon (how far ahead a user can book), use the ADVANCE_DAYS_* constants below.
 */
export const ROLLING_WINDOW_CALENDAR_DAYS = 3;

/** Booking horizon: teaching / dual-eligible accounts, weekday (Mon–Fri) slots. */
export const ADVANCE_DAYS_TEACHING_WEEKDAY = 14;
/** Booking horizon: teaching / dual-eligible accounts, weekend (Sat–Sun HK) slots. */
export const ADVANCE_DAYS_TEACHING_WEEKEND = 7;
/** Booking horizon: individual / teacher-referred accounts, weekday (Mon–Fri) slots. */
export const ADVANCE_DAYS_INDIVIDUAL_WEEKDAY = 7;
/** Booking horizon: individual / teacher-referred accounts, weekend (Sat–Sun HK) slots. */
export const ADVANCE_DAYS_INDIVIDUAL_WEEKEND = 3;

export const BOOKING_COOLDOWN_MS = 3 * 60 * 60 * 1000;
