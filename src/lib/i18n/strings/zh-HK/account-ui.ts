export const accountZhHK = {
  pageTitle: "使用者介面",
  limitsTitle: "預約節數上限（30 分鐘 = 1 節）",
  limitsIntro:
    "你的分類：{tier}。同一日最多 {dailyMax} 節；任何連續 3 個香港曆日內最多 {rollingMax} 節。",
  tierExtended: "延伸配額（教學／學生或導師相關身份）",
  tierGeneral: "一般使用者",
  todayUsed: "今日（{todayKey}）已用：{n} 節",
  todayRemaining: "今日尚可預約（同日上限內）：{n} 節",
  rollingUsedLine:
    "目前「滑動 3 日」* 合計已用：{used} / {rollingMax} 節（提交新預約時系統會再連同新選時段驗證）",
  rollingFootnote:
    "備註：「滑動 3 日」指以香港曆日計算，系統會檢視任意連續三個曆日（例如 4 月 5、6、7 日）內已預約節數的總和；上列數字為所有此類三日區間中的最大合計。隨著日期向前推進，適用的三日範圍亦會跟著更替，故稱「滑動」，並非固定某三天（例如固定週一至週三）。提交新預約時會連同新選時段一併驗證。",
  exampleTitle: "例子（陳小明）",
  exampleName: "陳小明",
  exampleIntro:
    "— 以下以你目前帳戶分類為準：單日最多 {dailyMax} 節，任何連續三曆日最多 {rollingMax} 節。",
  labelCannot: "不能預約：",
  labelCan: "可以預約：",
  labelSlide: "「滑動」的含意：",
  storyFail:
    "{name} 在 {d0}、{d1}、{d2} 三日（依序）已有 {t0}、{t1}、{t2} 節，合計剛好 {rollingMax} 節。若他再選一段落在 {extraDay}，系統檢視「4/5–4/7」這個連續三日窗口，合計變成 {nextExpr} = {sumAfter} 節，超過 {rollingMax} 節，故無法提交。此例重點在於：「滑動三日」總和一旦已滿，即使加選當日於單日上限內仍有空位，系統仍會擋下（提交時「滑動三日」與「單日上限」會一併驗證）。",
  storyPass:
    "若改為 {d0} {a0} 節、{d1} {a1} 節、{d2} {a2} 節（三日先合共 {preSum} 節），再於 {d2} 加 1 節，窗口變成 {tri1Expr} = {sumAfter} 節，不高於 {rollingMax} 節，且第三日僅 {thirdDay} 節，亦未超單日 {dailyMax} 節，即可通過。",
  storySlide:
    "當較早的預約日已過或他改到較後的日期，系統改以 4/6–4/8、4/7–4/9 等較新的連續三日重算；因此未必永遠被同一組「4/5–4/7」卡住——只要每一個連續三日窗口的節數加總都不超 {rollingMax} 即可。",
  genericCannot:
    "當某一組連續三日內，已批核／待審核的節數加總已達 {rollingMax}，再於這三天中的任何一日加選新節，都會令至少一個三日窗口超標，系統即會拒絕。",
  genericCan:
    "只要每一個連續三日窗口的加總都不超過 {rollingMax} 節，且每一日亦不多於 {dailyMax} 節，即可提交。",
  genericSlide:
    "隨日期推進，系統會改以較新的連續三日（例如 4/6–4/8）重算，而非固定週一至週三；故限制會「跟住日曆滑動」。",
  sectionContact: "個人及聯絡",
  dtEmail: "電郵",
  dtPhone: "電話",
  dtIdentity: "身份標籤",
  sectionPrefs: "預約偏好（登記時填寫）",
  dtPreferredDates: "希望使用日期",
  dtPreferredTimes: "希望使用時段",
  dtConsecutive: "偏好連續時段",
  prefsConsecutiveYes: "希望盡量連續",
  prefsConsecutiveNo: "不必連續",
  sectionBookings: "預約紀錄（已合併連續時段）",
  downloadIcs: "下載 .ics（匯入 Google 日曆）",
  icsNote:
    "日曆內容會附帶地址、守則連結、密碼與入場須知（請於 .env 設定 VENUE_* 變數）。亦可以逐段按下方「加入 Google 日曆」。",
  emptyBookings: "暫未有預約紀錄。",
  statusLine: "狀態：{status}",
  requestedAtLine: "預約時間：{time}",
  sessionsVenue: "（{sessions} 節 · {venue}）",
  addGoogleCal: "加入 Google 日曆（此段）",
  gcalTitle: "{brand} · Room No.2｜{sessions} 節",
  gcalLineId: "預約編號：{id}",
  gcalLineStatus: "狀態：{status}",
  shortcuts: "捷徑",
  goBooking: "前往預約時段",
  bookingLocked: "預約未開放或須先更改密碼",
  managePasskeys: "管理通行密鑰",
  textHistory: "文字版預約紀錄",
  backHome: "返回主頁",
  dash: "—",
  identity: {
    student: "學生",
    performer: "個人演奏者",
    freelancer: "自由工作者",
    private_teacher: "私人老師",
    music_tutor: "音樂導師",
    other: "其他",
  },
};
