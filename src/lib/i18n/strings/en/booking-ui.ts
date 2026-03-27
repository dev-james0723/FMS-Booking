export const bookingEn = {
  status: {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Not available",
    waitlisted: "Waitlisted",
    cancelled: "Cancelled",
    no_show: "No-show",
    completed: "Completed",
  },
  portal: {
    title: "Booking",
    intro:
      "Choose slots and submit a request. All bookings are reviewed by the organiser and are not confirmed automatically.",
    linkCalendar: "Calendar overview (timeline)",
    linkHistory: "Booking history",
    linkAccount: "My account",
    linkHome: "Home",
  },
  historyPage: {
    title: "Booking history",
    note: "Status is updated by the organiser; contact support if you have questions.",
    back: "Back to booking",
  },
  calendarPage: {
    title: "Booking calendar overview",
    intro:
      "See 3 April – 3 May 2026 at a glance on the calendar and timeline (first day from 11:00, other days from 06:00, Hong Kong time). Full slots are red; available slots are green.",
    backBooking: "Back to booking",
    linkHistory: "Booking history",
    linkAccount: "My account",
  },
  historyPanel: {
    loadError: "Could not load",
    empty: "No bookings yet.",
    submittedAt: "Submitted: ",
    bonusSlot: "Bonus slot",
  },
  request: {
    loadSlotsError: "Could not load slots",
    dailyCapHint:
      "On {dayKey} you have reached your daily cap for your tier: up to {dailyMax} slots (30 minutes each); you cannot add another.",
    submitError: "Submit failed",
    notOpenBanner:
      "Booking is not open yet. Tap a day within the campaign to preview 30-minute slots; slots stay locked until opening and cannot be selected or submitted.",
    bookingOpensLine: "Booking opens (Hong Kong): {time}",
    campaignLine:
      "Campaign days (Hong Kong): {range} · book up to {maxAdvance} calendar days ahead · 30-minute slots",
    refresh: "Refresh",
    submitted:
      "Request submitted (reference: {id}). You will be notified by email after review.",
    viewHistory: "View history",
    linkCalendarOverview: "Calendar overview (timeline)",
    limitsTitle: "Session usage (Hong Kong dates)",
    limitsToday:
      "Today ({todayKey}): {committed} sessions used, {remaining} left (daily cap {dailyMax}). Tier: {tier}.",
    tierExtended: "Teaching / extended",
    tierGeneral: "General",
    limitsPickHint:
      "Your daily selection cap is {dailyMax} slots (30 minutes each). If a day is full, further picks show a red hint and cannot be added.",
    wouldExceedTitle: "Current selection would exceed limits:",
    exceedDaily: "More than {dailyMax} sessions on one day{datePart}.",
    exceedDailyDate: " ({date})",
    exceedRolling:
      "{rollingSum} sessions in any rolling 3 calendar days, over the cap of {rollingMax}.",
    monthTitle: "{year} / {month} (Hong Kong)",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    dotTitle: "{n} slots available",
    fullLabel: "Full",
    hintPickDayLive:
      "Pick a day first; a green dot means slots are still available. You can book within {maxAdvance} calendar days from today, and not after {lastDay}.",
    hintPickDayPreview:
      "Before booking opens, tap any day in the campaign ({range}) to preview that day’s slots (same rhythm as when live, but not selectable). After opening, only days within {maxAdvance} calendar days from today and on or before {lastDay} can be chosen.",
    slotsTitleLive: "{day} · available slots",
    slotsTitlePreview: "{day} · slot preview (not selectable yet)",
    slotsTitleNone: "Choose a day on the calendar above",
    loadingSlots: "Loading slots…",
    emptyHintLive: "After you pick a date, remaining bookable slots for that day appear here.",
    emptyHintPreview:
      "After you pick a campaign day, a preview of 30-minute slots (06:00–20:00, 11:00–20:00 on the first day) appears here for practice only.",
    noSlotsDay: "No bookable slots for this day (or all full).",
    previewSlotSuffix: "Preview (not open)",
    remainingSlots: "{n} left",
    notOpenYet: "Booking has not started yet; watch for the opening time{suffix}.",
    notOpenFallback: " (as announced by the organiser)",
    submitting: "Submitting…",
    submitWithCount: "Submit request ({n} sessions)",
    linkHistory: "Booking history",
    footnote:
      "General users: up to 3 slots (1.5 hours) per day; teaching / eligible extended: up to 8 slots (4 hours). Rolling 3-day caps also apply (see “Session usage” above). Approval depends on availability and the organiser.",
    dash: "—",
  },
  cal: {
    overviewTitle: "{range} · overview",
    overviewIntro:
      "Tap a day to see its timeline: 3 April is 11:00–20:00; other campaign days are 6:00–20:00 (Hong Kong time). Green means available, red means full or taken, grey means closed or outside the campaign.",
    refresh: "Refresh",
    loading: "Loading…",
    loadError: "Could not load calendar data",
    monthApr: "April 2026",
    monthMay: "May 2026 (end of campaign)",
    leaveOverview: "Leave calendar overview",
    legend:
      "Green: still has bookable slots · Red: all open slots full · Grey: no slots or outside free experience dates",
    selectedDate: "Selected date: {date} (Hong Kong time)",
    timelineRange: "Timeline: {start}:00 – {end}:00 (Hong Kong time)",
    textListTitle: "Slots (text list)",
    sectionBooked: "Full / taken",
    sectionAvailable: "Available",
    sectionClosed: "Closed",
    noSlotData: "No slot data for this day.",
    ctaBooking: "Go to booking to choose slots and submit",
    summaryLineClosed: "{range} (closed)",
    summaryLineBooked: "{range} (full)",
    summaryLineAvailable: "{range} (available · {remaining}/{capacity} left)",
  },
  timeline: {
    statusClosed: "Closed",
    statusFull: "Full / taken",
    statusOpen: "Open",
    bookedThis: "This slot is taken",
    canBookRemaining: "Available · {remaining}/{capacity} left",
  },
};
