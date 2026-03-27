export const bookingZhHK = {
  status: {
    pending: "待審核",
    approved: "已批核",
    rejected: "未能安排",
    waitlisted: "後補",
    cancelled: "已取消",
    no_show: "缺席",
    completed: "已完成",
  },
  portal: {
    title: "預約系統",
    intro:
      "請選擇時段後提交預約。所有預約均需主辦方審核，並非自動確認。",
    linkCalendar: "月曆總覽（時間軸）",
    linkHistory: "預約紀錄",
    linkAccount: "我的帳戶",
    linkHome: "主頁",
  },
  historyPage: {
    title: "預約紀錄",
    note: "狀態由主辦方更新；如有疑問請聯絡客服。",
    back: "返回預約系統",
  },
  calendarPage: {
    title: "預約月曆總覽",
    intro:
      "以月曆與時間軸一目了然查看 2026 年 4 月 3 日至 5 月 3 日各日時段（首日 11:00 起，其餘日 06:00 起）：已滿與仍可預約時段以紅／綠標示（香港時間）。",
    backBooking: "返回預約",
    linkHistory: "預約紀錄",
    linkAccount: "我的帳戶",
  },
  historyPanel: {
    loadError: "無法載入",
    empty: "暫未有預約紀錄。",
    submittedAt: "提交時間：",
    bonusSlot: "使用 bonus 時段",
  },
  request: {
    loadSlotsError: "無法載入時段",
    dailyCapHint:
      "此日（{dayKey}）已達您身分類別之每日上限：最多 {dailyMax} 格（每格 30 分鐘），無法再多選一格。",
    submitError: "提交失敗",
    notOpenBanner:
      "預約尚未正式開放。請先於月曆點選活動期內日子，預覽 30 分鐘一格的時段版面；時段在開放前會鎖定，無法選取或提交。",
    bookingOpensLine: "正式開始預約時間（香港）：{time}",
    campaignLine:
      "活動日（香港）：{range} · 最多提前 {maxAdvance} 個曆日預約 · 每隔 30 分鐘",
    refresh: "重新整理",
    submitted: "預約已提交（參考編號：{id}）。主辦方審核後將以電郵通知。",
    viewHistory: "查看紀錄",
    linkCalendarOverview: "月曆總覽（時間軸）",
    limitsTitle: "節數追蹤（香港日期）",
    limitsToday:
      "今日（{todayKey}）已用 {committed} 節，尚可 {remaining} 節（每日上限 {dailyMax}）。身份層級：{tier}。",
    tierExtended: "教學／延伸",
    tierGeneral: "一般",
    limitsPickHint:
      "您帳戶目前的每日選取上限為 {dailyMax} 格（每格 30 分鐘）。若於同一日已選滿上限後再選，將顯示紅色提示並無法加入。",
    wouldExceedTitle: "目前所選時段會超出上限：",
    exceedDaily: "同一日超過 {dailyMax} 節{datePart}。",
    exceedDailyDate: "（{date}）",
    exceedRolling:
      "連續 3 個曆日內合計 {rollingSum} 節，超過上限 {rollingMax} 節。",
    monthTitle: "{year} 年 {month} 月（香港）",
    prevMonth: "上一個月",
    nextMonth: "下一個月",
    dotTitle: "尚有 {n} 格可預約",
    fullLabel: "滿",
    hintPickDayLive:
      "請先選擇一日；綠點代表該日仍有可預約時段。可預約範圍：由今日起計最多 {maxAdvance} 個曆日內，且不晚於 {lastDay}。",
    hintPickDayPreview:
      "開放預約前，可點選活動期（{range}）內任何一日，預覽該日時段（版面與正式開放後相同節奏，但不可選取）。正式開放後，僅可選擇由今日起計最多 {maxAdvance} 個曆日內、且不晚於 {lastDay} 的日子。",
    slotsTitleLive: "{day} 可選時段",
    slotsTitlePreview: "{day} 時段預覽（尚未開放選取）",
    slotsTitleNone: "請在上面的月曆上選擇一日",
    loadingSlots: "載入時段中…",
    emptyHintLive: "選擇日期後，此處將列出該日所有仍可預約的時段。",
    emptyHintPreview:
      "選擇活動日後，將列出該日 06:00–20:00（首日為 11:00–20:00）的 30 分鐘時段預覽，僅供體驗操作。",
    noSlotsDay: "此日暫無可預約時段（或已全部滿額）。",
    previewSlotSuffix: "預覽（未開放）",
    remainingSlots: "剩 {n}",
    notOpenYet: "而家尚未開始預約，請留意正式開放時間{suffix}。",
    notOpenFallback: "（請以主辦公布為準）",
    submitting: "提交中…",
    submitWithCount: "提交預約（已選 {n} 節）",
    linkHistory: "預約紀錄",
    footnote:
      "一般使用者：每日最多 3 格（1.5 小時）；教學／合資格延伸：每日最多 8 格（4 小時）。任何連續 3 個曆日亦有總節數上限（見上方「節數追蹤」）。實際批核視乎供應及主辦安排。",
    dash: "—",
  },
  cal: {
    overviewTitle: "{range} · 總覽",
    overviewIntro:
      "點選日子查看當日時間軸：4 月 3 日為 11:00–20:00，其餘活動日為 6:00–20:00（香港時間）。綠色為仍可預約，紅色為已滿／已被預約，灰色為已關閉或不在活動期內。",
    refresh: "重新整理",
    loading: "載入中…",
    loadError: "無法載入月曆資料",
    monthApr: "2026 年 4 月",
    monthMay: "2026 年 5 月（活動尾段）",
    leaveOverview: "離開月曆總覽",
    legend:
      "綠底：當日仍有可預約時段 · 紅底：當日開放時段均已滿 · 灰底：未有時段或不在免費體驗期內",
    selectedDate: "已選日期：{date}（香港時間）",
    timelineRange:
      "時間軸範圍：{start}:00 – {end}:00（香港時間）",
    textListTitle: "當日時段（文字列表）",
    sectionBooked: "已滿／已被預約",
    sectionAvailable: "仍可預約（Available）",
    sectionClosed: "已關閉",
    noSlotData: "此日沒有時段資料。",
    ctaBooking: "前往預約版面，立即選擇時段並提交預約",
    summaryLineClosed: "{range}（時段已關閉）",
    summaryLineBooked: "{range}（已滿／已被預約）",
    summaryLineAvailable: "{range}（可預約 · 剩餘 {remaining}/{capacity}）",
  },
  timeline: {
    statusClosed: "已關閉",
    statusFull: "已滿／已被預約",
    statusOpen: "尚有名額",
    bookedThis: "此節已被預約",
    canBookRemaining: "可預約 · 剩 {remaining}/{capacity} 名額",
  },
};
