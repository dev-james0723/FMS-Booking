export const accountEn = {
  pageTitle: "My account",
  limitsTitle: "Booking limits (30 minutes = 1 session)",
  limitsIntro:
    "Your category: {tier}. Up to {dailyMax} sessions on the same day; up to {rollingMax} within any 3 consecutive Hong Kong calendar days.",
  tierExtended: "Extended quota (teaching / student or teacher-related)",
  tierGeneral: "General user",
  todayUsed: "Today ({todayKey}) used: {n} sessions",
  todayRemaining: "Still bookable today (within daily cap): {n} sessions",
  rollingUsedLine:
    "Rolling 3-day total used so far: {used} / {rollingMax} sessions (new picks are checked together when you submit)",
  rollingFootnote:
    "“Rolling 3 days” uses Hong Kong calendar days: the system checks every window of three consecutive days (e.g. 5–7 April) and sums booked sessions in that window; the figure above is the maximum over all such windows. As dates move forward, the window moves too—hence “rolling,” not a fixed Mon–Wed. Submitting a new request re-checks together with your new slots.",
  exampleTitle: "Example (Alex Chan)",
  exampleName: "Alex Chan",
  exampleIntro:
    "— Based on your current account category: up to {dailyMax} sessions per day, up to {rollingMax} in any three consecutive calendar days.",
  labelCannot: "Cannot book:",
  labelCan: "Can book:",
  labelSlide: "What “rolling” means:",
  storyFail:
    "{name} has {t0}, {t1}, and {t2} sessions on {d0}, {d1}, and {d2} (in order), totalling exactly {rollingMax}. Adding another session on {extraDay} makes the 5–7 Apr window {nextExpr} = {sumAfter} sessions, over the cap of {rollingMax}, so the request is blocked. Even if that day is still under the daily cap, a full rolling window blocks the booking—daily and rolling limits are checked together on submit.",
  storyPass:
    "If instead {d0} has {a0}, {d1} has {a1}, and {d2} has {a2} ({preSum} total across the three days), then add one more on {d2}, the window becomes {tri1Expr} = {sumAfter}, which is within {rollingMax}, the third day is only {thirdDay} sessions, and it stays within the daily cap of {dailyMax}, so it passes.",
  storySlide:
    "When earlier dates pass or bookings move later, the system recalculates using newer 3-day windows (e.g. 6–8 Apr, 7–9 Apr). You are not stuck forever on one fixed window—as long as every 3-day window sums to at most {rollingMax}.",
  genericCannot:
    "If approved or pending sessions in some three consecutive days already total {rollingMax}, adding a session on any of those days would push at least one window over the limit, so the system rejects it.",
  genericCan:
    "You can submit if every 3-day window totals at most {rollingMax} sessions and each single day is at most {dailyMax} sessions.",
  genericSlide:
    "As dates advance, the system uses newer consecutive triples (e.g. 6–8 Apr) instead of a fixed Mon–Wed—the limit “slides” with the calendar.",
  sectionContact: "Profile & contact",
  dtEmail: "Email",
  dtPhone: "Phone",
  dtIdentity: "Identity tags",
  sectionPrefs: "Booking preferences (from registration)",
  dtPreferredDates: "Preferred dates",
  dtPreferredTimes: "Preferred time bands",
  dtConsecutive: "Consecutive slots",
  prefsConsecutiveYes: "Prefer back-to-back where possible",
  prefsConsecutiveNo: "No need to be consecutive",
  sectionBookings: "Bookings (merged consecutive slots)",
  downloadIcs: "Download .ics (Google Calendar)",
  icsNote:
    "The calendar file can include address, rules link, access code and entry notes (configure VENUE_* in .env). You can also add each block to Google Calendar below.",
  emptyBookings: "No bookings yet.",
  statusLine: "Status: {status}",
  requestedAtLine: "Requested: {time}",
  sessionsVenue: "({sessions} sessions · {venue})",
  addGoogleCal: "Add to Google Calendar (this block)",
  gcalTitle: "{brand} · Room No.2｜{sessions} sessions",
  gcalLineId: "Booking ref: {id}",
  gcalLineStatus: "Status: {status}",
  shortcuts: "Shortcuts",
  goBooking: "Go to booking",
  bookingLocked: "Booking not open yet or password change required",
  managePasskeys: "Manage passkeys",
  textHistory: "Text booking history",
  backHome: "Back to home",
  dash: "—",
  identity: {
    student: "Student",
    performer: "Performer",
    freelancer: "Freelancer",
    private_teacher: "Private teacher",
    music_tutor: "Music tutor",
    other: "Other",
  },
};
