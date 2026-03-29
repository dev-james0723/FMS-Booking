export const bookingEn = {
  status: {
    pending: "Confirmed",
    approved: "Confirmed",
    rejected: "Not available",
    waitlisted: "Waitlisted",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    no_show: "No-show",
    completed: "Completed",
  },
  portal: {
    title: "Booking",
    introBeforeQuotaLink:
      "Pick slots and submit a request. Booking always opens on a rolling basis: you may only book available slots within the next 3 calendar days (inclusive); session limits (30 minutes = 0.5 hour each) use a single ",
    introQuotaLinkLabel: "quota tier",
    introAfterQuotaLink:
      " per account; after each successful submission you must wait 3 hours before submitting again. When your submission succeeds, the slots you picked are confirmed.",
    linkCalendar: "Calendar overview (timeline)",
    linkHistory: "Booking history",
    linkAccount: "My account",
    linkHome: "Home",
    linkOpenSpace: "Book Open Space instead (no extra registration)",
    openSpaceCalloutTitle: "Another way to find a time",
    openSpacePoolStudioLabel: "Studio room",
    openSpacePoolStudioSub: "Book on this page · soundproof room",
    openSpacePoolOpenLabel: "Open Space",
    openSpacePoolOpenSub: "Separate slot pool",
    openSpacePoolDivider: "Other pool",
    openSpacePoolCaption: "Two independent pools—Open Space may offer more slots.",
    openSpaceFlowStep1: "Studio slots don’t work, or your instrument isn’t piano?",
    openSpaceFlowStep2: "Open Space uses a different pool of bookable times.",
    openSpaceFlowStep3: "Use the button below with the same account (no extra sign-up).",
    openSpaceQuotaPrefix: "Session limits are still shared with studio bookings; see",
    openSpaceQuotaLinkLabel: "My Account",
    openSpaceQuotaSuffix: "for quota details.",
  },
  openSpacePortal: {
    title: "Fantasia Music Space — Open Space sessions",
    intro:
      "These slots are from the Open Space inventory, separate from the soundproof studio room pool. If you registered via the studio-room channel, Open Space and studio bookings share the same session caps (daily and rolling 3-day)—there is no second quota. If you registered via the large-instrument / Open Space channel, you may only book here. Please read the venue notes below before choosing times.",
    linkCalendar: "Calendar overview (timeline)",
    linkHistory: "Booking history",
    linkAccount: "My account",
    linkHome: "Home",
    imageEntranceAlt: "Open Space near the Fantasia Music Space entrance",
    imageCorridorAlt: "Open Space in the Fantasia Music Space corridor",
  },
  openSpace: {
    infoCardAudienceIcon: "🎻",
    infoCardAudienceTitle: "Who this is for",
    infoCardAudienceBody:
      "The Open Space is mainly for players of larger instruments (for example, larger than a cello) booking practice time. Other non-piano instruments (such as violin, clarinet, oboe, etc.) may also use this Open Space, especially when studio room bookings are fully taken.",
    infoCardVenueIcon: "🚪",
    infoCardVenueTitle: "Where you practise",
    infoCardVenueBody:
      "Because space is limited, larger instruments must be used in the Open Space, not inside the soundproof piano studio.",
    infoCardAreasIcon: "📍",
    infoCardAreasTitle: "What counts as Open Space",
    infoCardAreasBody:
      "Two physical areas: (1) near the Fantasia Music Space studio entrance; (2) the interior corridor walkway.",
    infoCardRuleIcon: "👤",
    infoCardRuleTitle: "Usage rules",
    infoCardRuleBody:
      "Both areas are one booking zone: they cannot be used at the same time. Each slot is for one user or one group under the same booking only.",
    infoCardNoticeIcon: "⚠️",
    infoCardNoticeTitle: "Noise and foot traffic",
    infoCardNoticeBody:
      "Expect some movement and sound at the main door and along the corridor, which may affect quietness and privacy. If you are sensitive to noise or foot traffic, please decide carefully before booking.",
    infoPageLead:
      "This is the same information linked from the site menu under “Open Space booking info”. Accounts registered for the Open Space programme should use the Open Space booking entry after login.",
    ctaRegister: "Register for Open Space (new account)",
    ctaBooking: "Open Space booking (logged in)",
  },
  historyPage: {
    titleStudioRoom: "Piano studio booking history",
    titleOpenSpace: "Large instruments / Open Space booking history",
    back: "Back to booking",
  },
  calendarPage: {
    titleStudioRoom: "Piano studio booking — calendar overview",
    titleOpenSpace: "Large instruments / Open Space booking — calendar overview",
    intro: "",
    backBooking: "Back to booking",
    linkHistory: "Booking history",
    linkAccount: "My account",
  },
  historyPanel: {
    loadError: "Could not load",
    empty: "No bookings yet.",
    submittedAt: "Submitted: ",
    bonusSlot: "Bonus slot",
    syncToGoogleCalendar: "Sync to Google Calendar",
    filterByDateLabel: "Jump to a booked day",
    filterByDateAll: "All days",
    filterSituationLabel: "Booking status",
    filterSituationAll: "All statuses",
    noRowsForFilters: "No bookings match your filters.",
  },
  request: {
    loadSlotsError: "Could not load slots",
    dailyCapHint:
      "On {dayKey} you have reached your daily cap for your tier: up to {dailyMax} slots{dailyMaxH} (30 minutes each); you cannot add another.",
    submitError: "Submit failed",
    notOpenBanner:
      "Booking is not open yet. Tap a day within the campaign to preview 30-minute slots; slots stay locked until opening and cannot be selected or submitted.",
    bookingOpensLine: "Booking opens (Hong Kong): {time}",
    campaignLine:
      "Campaign days (Hong Kong): {range} · rolling booking — only the next {windowDays} calendar days (inclusive) are selectable · 30-minute slots",
    rulesAtAGlance: "Quick guide",
    ruleCardRollingTitle: "Rolling bookable dates",
    ruleCardRollingSummary:
      "You may only book slots in the next {windowDays} calendar days from today (inclusive).",
    ruleRollingExpand: "Examples & diagram",
    ruleRollingIntro1: "Booking always opens on a rolling basis.",
    ruleRollingIntro2:
      "You may only book slots within the next {windowDays} calendar days in Hong Kong time (including today).",
    ruleRollingVisTitle: "Diagram: 3-day rolling window",
    ruleRollingVisSchematicCaption:
      "Whatever day is “today”, you can always pick three consecutive calendar days starting from today.",
    ruleRollingVisRollHint: "Each new day, the window shifts forward by one.",
    ruleRollingVisDay0: "Today",
    ruleRollingVisDay1: "+1 day",
    ruleRollingVisDay2: "+2 days",
    ruleRollingLabelToday: "Today",
    ruleRollingLabelBookable: "Bookable",
    ruleRollingLabelBlocked: "Not bookable",
    ruleRollingExamplesTitle: "Examples (fixed dates)",
    ruleRollingEx1Caption: "If today is 1 April 2026",
    ruleRollingEx2Caption: "If today is 2 April 2026",
    ruleCardSlotTitle: "Session length",
    ruleCardSlotSummary: "Each slot is 30 minutes (one pick = one session).",
    ruleCardIndividualTitle: "Individual quota tier",
    ruleCardIndividualSummary:
      "Personal practice / general individual users — up to 5 sessions per day (2.5 hours); up to 7 in any 3 consecutive calendar days (3.5 hours).",
    ruleCardTeacherReferredTitle: "Teacher-referred student quota tier",
    ruleCardTeacherReferredSummary:
      "Accounts registered as teacher-referred (teacher details on sign-up) use the same session caps as the individual tier — up to 5 per day (2.5 hours); up to 7 in any 3 consecutive calendar days (3.5 hours).",
    ruleCardTeachingTitle: "Teaching quota tier",
    ruleCardTeachingSummary:
      "Teaching or with-students only (account is teaching-eligible but not individual-eligible) — up to 8 per day (4 hours); up to 16 in any 3 consecutive calendar days (8 hours).",
    ruleCardDualQuotaTitle: "Dual-eligibility quota tier",
    ruleCardDualQuotaSummary:
      "If your account has both individual practice and teaching/with-students eligibility, the quota tier is the teaching tier — up to 8 per day (4 hours); up to 16 in any 3 consecutive calendar days (8 hours). Sessions are not counted in two separate pools by identity.",
    ruleCardCooldownTitle: "Submission cooldown",
    ruleCardCooldownSummary: "After each successful submission, wait 3 hours before submitting again.",
    ruleCardIdentityTitle: "Dual eligibility",
    ruleCardIdentitySummary:
      "If you have both individual and teaching eligibility, pick which identity applies to this booking (for the organiser and reporting).",
    ruleCardBucketTitle: "One cap per account",
    ruleCardBucketSummary:
      "Even with dual eligibility, all sessions count toward a single quota tier — limits are not doubled.",
    ruleSlotLen: "Each slot is 30 minutes.",
    ruleQuotaIndividual:
      "Individual users and teacher-referred students (individual quota tier): up to 5 sessions per day (2.5 hours); up to 7 sessions in any 3 consecutive calendar days (3.5 hours).",
    ruleQuotaTeaching:
      "Teaching / with-students users (teaching quota tier): up to 8 sessions per day (4 hours); up to 16 sessions in any 3 consecutive calendar days (8 hours).",
    ruleQuotaDual:
      "Users with both teaching and practice needs (teaching quota tier on the account): up to 8 sessions per day (4 hours); up to 16 sessions in any 3 consecutive calendar days (8 hours).",
    ruleCooldown: "After each successful booking submission, wait 3 hours before submitting another.",
    ruleDualPick:
      "If you have both individual and teaching eligibility, pick which applies to this booking (for the organiser and reporting).",
    ruleSingleQuota:
      "Even with dual eligibility, all sessions count toward one quota tier — limits are not doubled.",
    refresh: "Refresh",
    submitted:
      "Booking confirmed (reference: {id}). A confirmation email has been sent to your inbox.",
    confirmModalTitle: "Booking confirmed",
    confirmModalRefLabel: "Reference",
    confirmModalEmailHint: "A confirmation email has been sent to your inbox.",
    confirmModalRefUnknown: "You can see the full reference under “View history”.",
    confirmModalDismiss: "Close",
    viewHistory: "View history",
    linkCalendarOverviewStudioRoom:
      "Current piano studio booking status — calendar overview (timeline)",
    linkCalendarOverviewOpenSpace:
      "Current large-instrument / Open Space booking status — calendar overview (timeline)",
    limitsTitle: "Session usage (Hong Kong dates; 30 min = 0.5 hr each)",
    limitsToday:
      "Today ({todayKey}): {committed} sessions{committedH} used, {remaining} sessions{remainingH} left (daily cap {dailyMax} sessions{dailyMaxH}). Quota tier: {tier}.",
    limitsCardToday: "Today",
    limitsCardRolling: "Rolling 3 calendar days",
    limitsUsedLabel: "Used",
    limitsLeftLabel: "Left",
    limitsSessionsUnit: "sessions",
    limitsDailyCapShort: "Daily cap",
    limitsRollingCapShort: "Window cap",
    limitsWindowLabel: "Bookable dates (Hong Kong)",
    limitsEligibilityLabel: "Eligibility",
    limitsEligibilityIndividual: "Individual",
    limitsEligibilityTeaching: "Teaching",
    limitsMeterAriaToday:
      "Hong Kong date {date}: {used} sessions{usedH} used, daily cap {max} sessions{maxH}, {remaining} sessions{remainingH} remaining.",
    limitsMeterAriaRolling:
      "Rolling three calendar days: {used} sessions{usedH} counted, cap {max} sessions{maxH}, {remaining} sessions{remainingH} remaining.",
    tierTeachingQuota: "Teaching quota tier",
    tierIndividualQuota: "Individual quota tier",
    limitsRollingCommitted:
      "Rolling 3-day window: {sum} sessions{sumH} of {max} sessions{maxH2} counted.",
    limitsRollingWindow: "Current rolling bookable range (HK dates): {start} – {end}.",
    limitsEligibility: "Eligibility — individual: {ind} · teaching: {tea}",
    yes: "Yes",
    no: "No",
    cooldownLine: "Booking cooldown active — you can submit again after {until} (Hong Kong time).",
    limitsPickHint:
      "30 minutes per slot. After {dailyMax} picks{dailyMaxH} on one day, further picks show a red hint and cannot be added.",
    wouldExceedTitle: "Current selection would exceed limits:",
    exceedDaily: "More than {dailyMax} sessions{dailyMaxH} on one day{datePart}.",
    exceedDailyDate: " ({date})",
    exceedRolling:
      "{rollingSum} sessions{rollingSumH} in any rolling 3 calendar days, over the cap of {rollingMax} sessions{rollingMaxH}.",
    monthTitle: "{year} / {month} (Hong Kong)",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    dotTitle: "{n} slots{nH} available",
    fullLabel: "Full",
    noInventoryLabel: "No slots",
    notYetOpenLabel: "Not open",
    hintPickDayLive:
      "Pick a day first; a green dot means slots are still available. Live booking: only the next {windowDays} calendar days from today (inclusive), not after {lastDay}.",
    hintPickDayTestMode:
      "Test mode: same live rules (rolling {windowDays} days). Pick a day first; a green dot means slots remain; “Not open” means that calendar day is outside the rolling window.",
    hintPickDayPreview:
      "Before booking opens, tap any day in the campaign ({range}) to preview. After opening, only the next {windowDays} calendar days (inclusive), not after {lastDay}.",
    slotsTitleLive: "{day} · available slots",
    slotsTitlePreview: "{day} · slot preview (not selectable yet)",
    slotsTitleNone: "Choose a day on the calendar above",
    loadingSlots: "Loading slots…",
    emptyHintLive:
      "After you pick a date, every slot for that day is listed here. Booked slots show with a red border and cannot be selected.",
    emptyHintPreview:
      "After you pick a campaign day, a preview of 30-minute bookable slots appears here (06:00–20:00 Hong Kong time each day), for practice only.",
    noSlotsDay: "No bookable slots for this day (or all full).",
    previewSlotSuffix: "Preview (not open)",
    remainingSlots: "{n} left{nH}",
    notOpenYet: "Booking has not started yet; watch for the opening time{suffix}.",
    notOpenFallback: " (as announced by the organiser)",
    submitting: "Submitting…",
    submitWithCount: "Submit request ({n} sessions{nH})",
    submitDisabledCamera:
      "Choose whether you need camera rental and complete the on-screen payment option first.",
    submitDisabledCooldown: "Booking cooldown is active; please try again later.",
    submitDisabledDaily:
      "Your selection exceeds the per-day limit; reduce slots on one day or spread them across dates.",
    submitDisabledRolling:
      "Your selection exceeds the rolling three-calendar-day limit; reduce slots before submitting.",
    dailyCapModalTitle: "Daily slot limit",
    dailyCapModalBodyIndividual:
      "Individual quota tier: at most 5 half-hour slots (2.5 hours) per Hong Kong calendar day. Selecting another would go over the limit.",
    dailyCapModalBodyTeaching:
      "Teaching quota tier: at most 8 half-hour slots (4 hours) per Hong Kong calendar day. Selecting another would go over the limit.",
    dailyCapModalOk: "OK",
    linkHistory: "Booking history",
    footnote:
      "Quotas follow the guide above; slots are first-come, first-served and confirmed when the system accepts your submission.",
    thisBookingIdentityTitle: "Identity for this booking (required)",
    identityIndividual: "Individual (practice / personal use)",
    identityTeaching: "Teaching / with students",
    dash: "—",
    cameraSectionTitle: "Camcorder rental",
    cameraQuestion: "Would you like to rent a Sony 4K camcorder for HK$99?",
    cameraNeed: "Yes, I need it",
    cameraNoNeed: "No",
    cameraHeroAlt: "Sony FDR-AX53 4K camcorder",
    cameraPayModalTitle: "Camcorder payment (HK$99)",
    cameraPayInstruction:
      "Renting the Sony 4K camcorder costs HK$99. Pay via the Stripe link below or scan the QR code. After paying, tick “Yes, I have paid”.",
    cameraPayLinkLabel: "Open Stripe checkout",
    cameraQrAlt: "Stripe payment QR code",
    cameraPaidPrompt: "Have you completed payment?",
    cameraPaidYes: "Yes, I have paid",
    cameraPaidNo: "Not yet",
    cameraModalConfirm: "Continue",
    cameraModalCancel: "Cancel",
    cameraOpenGuideButton: "How to use the camcorder (Google Drive)",
    cameraPayFirstButton: "Pay now",
    cameraPayAfterButton: "I will pay after booking",
    cameraSubmitPickRentalHint: "Please choose whether you need the Sony 4K camcorder rental.",
    cameraSubmitCompletePaymentFlowHint:
      "You chose camcorder rental — please confirm payment (paid, or pay after booking) before submitting.",
  },
  cal: {
    overviewTitleStudioRoom: "{range} · studio room slots",
    overviewTitleOpenSpace: "{range} · large instruments / Open Space slots",
    overviewIntro: "",
    refresh: "Refresh",
    loading: "Loading…",
    loadError: "Could not load calendar data",
    monthApr: "April 2026",
    monthMay: "May 2026 (end of campaign)",
    leaveOverview: "Leave calendar overview",
    legend:
      "Green: still has bookable slots · Red: no bookable slots left (full or closed) · Grey: no slots or outside free experience dates",
    legendStudioHold:
      "(Piano room calendar only) Grey blocks on the timeline are not available for booking (open space is unaffected).",
    selectedDate: "Selected date: {date} (Hong Kong time)",
    timelineRange: "Timeline: {start}:00 – {end}:00 (Hong Kong time)",
    textListTitle: "Slots today",
    sectionBooked: "Booked",
    sectionAvailable: "Available",
    sectionClosed: "Closed",
    noSlotData: "No slot data for this day.",
    ctaBooking: "Go to booking to choose slots and submit",
  },
  timeline: {
    statusClosed: "Closed",
    statusFull: "Booked",
    statusOpen: "Open",
    studioHoldCaption: "This time slot is not available for booking",
    bookedThis: "This slot is taken",
    canBookRemaining: "Available · {remaining}/{capacity} left",
  },
};
