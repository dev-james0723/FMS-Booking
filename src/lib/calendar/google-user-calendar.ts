import { formatInTimeZone } from "date-fns-tz";
import { SignJWT, jwtVerify } from "jose";
import { google } from "googleapis";
import {
  bookingCalendarTitlePrefix,
  loadUserCalendarMergedBlocks,
  type UserCalendarMergedBlock,
} from "@/lib/booking/user-calendar-blocks";
import { prisma } from "@/lib/prisma";
import { sessionCountWithHoursPack, sessionHoursParenZh } from "@/lib/i18n/session-hours";
import { HK_TZ } from "@/lib/time";
import { buildBookingCalendarDescription, getVenueCalendarEnv } from "@/lib/venue-calendar";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";

const OAUTH_STATE_TYP = "gcal_oauth";
const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function isGoogleCalendarUserOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET?.trim()
  );
}

export function createUserCalendarOAuth2Client(redirectUri: string) {
  const id = process.env.GOOGLE_CALENDAR_OAUTH_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("Google Calendar OAuth client is not configured");
  }
  return new google.auth.OAuth2(id, secret, redirectUri);
}

export async function signGoogleCalendarOAuthState(userId: string): Promise<string> {
  return new SignJWT({ typ: OAUTH_STATE_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtSecretKeyBytes());
}

export async function verifyGoogleCalendarOAuthState(
  state: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(state, jwtSecretKeyBytes());
    if (payload.typ !== OAUTH_STATE_TYP) return null;
    const sub = String(payload.sub ?? "");
    if (!sub) return null;
    return { userId: sub };
  } catch {
    return null;
  }
}

function statusLabelZh(status: string): string {
  switch (status) {
    case "pending":
      return "待審核";
    case "approved":
      return "已批核";
    case "waitlisted":
      return "後補";
    case "rejected":
      return "已拒絕";
    case "cancelled":
      return "已取消";
    case "no_show":
      return "缺席";
    case "completed":
      return "已完成";
    default:
      return status;
  }
}

function buildEventBody(block: UserCalendarMergedBlock) {
  const prefix = bookingCalendarTitlePrefix(block.requestStatus, block.venueKind);
  const summary = `${prefix}｜${sessionCountWithHoursPack("zh-HK", block.sessionCount)}（每節 30 分鐘）`;
  const startStr = formatInTimeZone(block.mergedStart, HK_TZ, "yyyy-MM-dd'T'HH:mm:ss");
  const endStr = formatInTimeZone(block.mergedEnd, HK_TZ, "yyyy-MM-dd'T'HH:mm:ss");
  const venueBlock = buildBookingCalendarDescription();
  const slotLine = `${formatInTimeZone(block.mergedStart, HK_TZ, "yyyy-MM-dd HH:mm")} – ${formatInTimeZone(block.mergedEnd, HK_TZ, "yyyy-MM-dd HH:mm")}`;
  const head = [
    `預約編號：${block.bookingId}`,
    `狀態：${statusLabelZh(block.requestStatus)}`,
    block.venueLabel ? `場地：${block.venueLabel}` : "",
    `時段（香港時間）：${slotLine}`,
    `節數：${block.sessionCount}${sessionHoursParenZh(block.sessionCount)}`,
  ]
    .filter(Boolean)
    .join("\n");
  const description = [head, "", venueBlock].join("\n");
  const location = getVenueCalendarEnv().address;
  const syncKey = `${block.bookingId}:${block.mergedStart.getTime()}`;
  return {
    summary,
    description,
    location,
    start: { dateTime: startStr, timeZone: HK_TZ },
    end: { dateTime: endStr, timeZone: HK_TZ },
    extendedProperties: {
      private: {
        fmsSyncKey: syncKey,
      },
    },
    iCalUID: `fms-${syncKey.replace(/:/g, "-")}@fms-booking`,
  };
}

type SyncStats = { created: number; updated: number; removed: number };

export async function syncUserBookingsToGoogleCalendar(
  userId: string,
  oauthRedirectUri: string
): Promise<
  | { ok: true } & SyncStats
  | { ok: false; code: "NOT_LINKED" | "NOT_CONFIGURED" | "GOOGLE_API"; message: string }
> {
  if (!isGoogleCalendarUserOAuthConfigured()) {
    return { ok: false, code: "NOT_CONFIGURED", message: "Google Calendar OAuth is not configured" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  const refresh = user?.googleCalendarRefreshToken?.trim();
  if (!user?.profile || !refresh) {
    return { ok: false, code: "NOT_LINKED", message: "Google Calendar is not connected" };
  }

  const venueKind = user.profile.bookingVenueKind;
  const blocks = await loadUserCalendarMergedBlocks(userId, venueKind);

  const oauth2 = createUserCalendarOAuth2Client(oauthRedirectUri);
  oauth2.setCredentials({ refresh_token: refresh });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const mirrors = await prisma.googleCalendarSyncedBlock.findMany({
    where: { userId },
  });

  const desiredKeys = new Set(
    blocks.map((b) => `${b.bookingId}:${b.mergedStart.getTime()}`)
  );

  let removed = 0;
  for (const row of mirrors) {
    const k = `${row.bookingRequestId}:${row.mergedStartsAt.getTime()}`;
    if (desiredKeys.has(k)) continue;
    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: row.googleEventId,
      });
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code !== 404) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, code: "GOOGLE_API", message: msg };
      }
    }
    await prisma.googleCalendarSyncedBlock.delete({ where: { id: row.id } });
    removed += 1;
  }

  let created = 0;
  let updated = 0;

  for (const b of blocks) {
    const body = buildEventBody(b);
    const existing = await prisma.googleCalendarSyncedBlock.findUnique({
      where: {
        userId_bookingRequestId_mergedStartsAt: {
          userId,
          bookingRequestId: b.bookingId,
          mergedStartsAt: b.mergedStart,
        },
      },
    });

    if (existing) {
      try {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: existing.googleEventId,
          requestBody: body,
        });
        updated += 1;
      } catch (e: unknown) {
        const err = e as { code?: number };
        if (err.code !== 404) {
          const msg = e instanceof Error ? e.message : String(e);
          return { ok: false, code: "GOOGLE_API", message: msg };
        }
        const ins = await calendar.events.insert({
          calendarId: "primary",
          requestBody: body,
        });
        const newId = ins.data.id;
        if (!newId) {
          return { ok: false, code: "GOOGLE_API", message: "Insert returned no event id" };
        }
        await prisma.googleCalendarSyncedBlock.update({
          where: { id: existing.id },
          data: { googleEventId: newId },
        });
        updated += 1;
      }
    } else {
      const ins = await calendar.events.insert({
        calendarId: "primary",
        requestBody: body,
      });
      const newId = ins.data.id;
      if (!newId) {
        return { ok: false, code: "GOOGLE_API", message: "Insert returned no event id" };
      }
      await prisma.googleCalendarSyncedBlock.create({
        data: {
          userId,
          bookingRequestId: b.bookingId,
          mergedStartsAt: b.mergedStart,
          googleEventId: newId,
        },
      });
      created += 1;
    }
  }

  return { ok: true, created, updated, removed };
}
