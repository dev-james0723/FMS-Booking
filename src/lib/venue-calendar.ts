/**
 * Copy for calendar exports (.ics / Google). Prefer env; no secrets in client bundles.
 */
export function getVenueCalendarEnv(): {
  address: string;
  rulesUrl: string;
  doorCode: string;
  entryNotes: string;
} {
  return {
    address: process.env.VENUE_ADDRESS_ZH?.trim() ?? "（請於管理後台或活動電郵查閱幻樂空間地址）",
    rulesUrl: process.env.VENUE_RULES_URL?.trim() ?? "",
    doorCode: process.env.VENUE_DOOR_CODE?.trim() ?? "（請查閱批核電郵或場地通知）",
    entryNotes:
      process.env.VENUE_ENTRY_NOTES_ZH?.trim() ??
      "請依批核電郵及場地使用須知準時到場；愛護設施並保持環境整潔。",
  };
}

function icsEscapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function formatIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildBookingCalendarDescription(): string {
  const v = getVenueCalendarEnv();
  const lines = [
    `地點：${v.address}`,
    v.rulesUrl ? `使用守則：${v.rulesUrl}` : "",
    `密碼鎖：${v.doorCode}`,
    `入場／開門：${v.entryNotes}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function toGoogleCalendarUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** 單一時段「加入 Google 日曆」深連結（每個時段一條；多用戶可自行重複加入）。 */
export function buildGoogleCalendarCreateUrl(params: {
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
}): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${toGoogleCalendarUtc(params.start)}/${toGoogleCalendarUtc(params.end)}`,
    details: params.description,
    location: params.location ?? getVenueCalendarEnv().address,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Outlook on the web / Microsoft 365 — opens compose with prefilled event (UTC instants). */
export function buildOutlookCalendarComposeUrl(params: {
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
}): string {
  const stripMs = (iso: string) => iso.replace(/\.\d{3}Z$/, "Z");
  const q = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: params.title,
    startdt: stripMs(params.start.toISOString()),
    enddt: stripMs(params.end.toISOString()),
    body: params.description,
    location: params.location ?? getVenueCalendarEnv().address,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`;
}

/** Single public reminder (e.g. booking portal opens) — no door-code boilerplate. */
export function buildPublicEventIcsCalendar(params: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
}): string {
  const loc = params.location ?? getVenueCalendarEnv().address;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FMS Booking//ZH//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsEscapeText(params.uid)}@fms-booking`,
    `DTSTAMP:${formatIcsUtc(params.start)}`,
    `DTSTART:${formatIcsUtc(params.start)}`,
    `DTEND:${formatIcsUtc(params.end)}`,
    `SUMMARY:${icsEscapeText(params.title)}`,
    `DESCRIPTION:${icsEscapeText(params.description)}`,
    `LOCATION:${icsEscapeText(loc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildBookingsIcsCalendar(params: {
  events: { uid: string; title: string; start: Date; end: Date; description: string }[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FMS Booking//ZH//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const desc = buildBookingCalendarDescription();
  for (const ev of params.events) {
    const fullDesc = [ev.description, "", desc].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscapeText(ev.uid)}@fms-booking`,
      `DTSTAMP:${formatIcsUtc(new Date())}`,
      `DTSTART:${formatIcsUtc(ev.start)}`,
      `DTEND:${formatIcsUtc(ev.end)}`,
      `SUMMARY:${icsEscapeText(ev.title)}`,
      `DESCRIPTION:${icsEscapeText(fullDesc)}`,
      `LOCATION:${icsEscapeText(getVenueCalendarEnv().address)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
