"use client";

import { useMemo } from "react";
import { CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH } from "@/lib/booking/campaign-constants";
import {
  buildGoogleCalendarCreateUrl,
  buildOutlookCalendarComposeUrl,
  buildPublicEventIcsCalendar,
} from "@/lib/venue-calendar";

const REMINDER_TITLE = "幻樂空間免費琴室體驗｜預約系統開放";
const REMINDER_DESCRIPTION = `請登入預約系統，預約幻樂空間琴室免費體驗時段。活動日為 ${CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH}（香港時間）。`;

type Props = {
  bookingOpensAtIso: string | null;
  bookingLive: boolean;
  venueAddressZh: string;
};

function AppleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083 43.595 20 42 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function OutlookCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0078D4"
        d="M19 4H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
      />
      <path
        fill="#fff"
        d="M14.5 8.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zm0 1.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z"
      />
      <path fill="#fff" d="M7 17h10v1.5H7V17z" opacity=".85" />
    </svg>
  );
}

const btnClass =
  "flex aspect-square min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-surface p-2 text-center text-[0.65rem] font-medium leading-tight text-stone-800 shadow-sm transition hover:border-amber-400/60 hover:bg-amber-50/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-stone-700 dark:text-stone-200 dark:hover:border-amber-600/35 dark:hover:bg-amber-950/30";

export function BookingOpensCalendarReminder({
  bookingOpensAtIso,
  bookingLive,
  venueAddressZh,
}: Props) {
  const start = useMemo(() => {
    if (!bookingOpensAtIso) return null;
    const d = new Date(bookingOpensAtIso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [bookingOpensAtIso]);

  const end = useMemo(() => {
    if (!start) return null;
    return new Date(start.getTime() + 60 * 60 * 1000);
  }, [start]);

  const googleUrl = useMemo(() => {
    if (!start || !end) return null;
    return buildGoogleCalendarCreateUrl({
      title: REMINDER_TITLE,
      start,
      end,
      description: REMINDER_DESCRIPTION,
      location: venueAddressZh,
    });
  }, [start, end, venueAddressZh]);

  const outlookUrl = useMemo(() => {
    if (!start || !end) return null;
    return buildOutlookCalendarComposeUrl({
      title: REMINDER_TITLE,
      start,
      end,
      description: REMINDER_DESCRIPTION,
      location: venueAddressZh,
    });
  }, [start, end, venueAddressZh]);

  const appleHref = useMemo(() => {
    if (!start || !end) return null;
    const ics = buildPublicEventIcsCalendar({
      uid: "booking-portal-opens",
      title: REMINDER_TITLE,
      start,
      end,
      description: REMINDER_DESCRIPTION,
      location: venueAddressZh,
    });
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }, [start, end, venueAddressZh]);

  if (bookingLive || !start || !end || !googleUrl || !outlookUrl || !appleHref) {
    return null;
  }

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-4 py-4 shadow-sm">
      <p className="text-center text-sm font-medium text-stone-900 dark:text-stone-50">日曆提醒</p>
      <p className="mt-1 text-center text-xs text-stone-500 dark:text-stone-500">
        於預約系統正式開放時間（香港時間）加入 1 小時日程，提醒您登入並預約幻樂空間琴室時段。
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <a
          href={appleHref}
          className={btnClass}
          aria-label="加入 Apple 日曆"
        >
          <AppleCalendarIcon className="h-8 w-8 shrink-0 text-stone-900 dark:text-stone-50" />
          <span>Apple 日曆</span>
        </a>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="加入 Google 日曆"
        >
          <GoogleCalendarIcon className="h-8 w-8 shrink-0" />
          <span>Google 日曆</span>
        </a>
        <a
          href={outlookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="加入 Outlook 日曆"
        >
          <OutlookCalendarIcon className="h-8 w-8 shrink-0 rounded-md" />
          <span>Outlook</span>
        </a>
      </div>
    </div>
  );
}
