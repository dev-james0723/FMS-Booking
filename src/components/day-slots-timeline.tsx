"use client";

import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  clipSlotToTimeline,
  formatHkRange,
} from "@/lib/booking/day-timeline";
import { useTranslation } from "@/lib/i18n/use-translation";
import { HK_TZ } from "@/lib/time";

export type TimelineSlotInput = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  capacityTotal: number;
  isOpen: boolean;
  venueLabel?: string | null;
  /** Piano-room calendar holds: grey block, not “full” red. */
  studioHoldNotApplicable?: boolean;
  /** Admin timeline: booker emails to show inside each slot cell. */
  bookerEmails?: string[];
};

function hkDateKeyFromIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function hourTickLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function DaySlotsTimeline({
  dateKey,
  slots,
  variant = "user",
}: {
  dateKey: string;
  slots: TimelineSlotInput[];
  variant?: "user" | "admin";
}) {
  const { t } = useTranslation();
  const daySlots = slots.filter((s) => hkDateKeyFromIso(s.startsAt) === dateKey);

  const hourTicks: number[] = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    hourTicks.push(h);
  }

  const isAdmin = variant === "admin";
  const labelCls = isAdmin ? "text-slate-400" : "text-stone-500 dark:text-stone-500";
  const trackBorder = isAdmin ? "border-slate-600 bg-slate-900/40" : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80";
  const gridLine = isAdmin ? "border-slate-600/90" : "border-stone-200 dark:border-stone-700/90";

  const trackMinPx = 720;

  return (
    <div className="flex gap-3">
      <div
        className={`flex w-12 shrink-0 flex-col justify-between pt-1 text-right text-xs ${labelCls}`}
        style={{ minHeight: trackMinPx }}
        aria-hidden
      >
        {hourTicks.map((h) => (
          <span key={h}>{hourTickLabel(h)}</span>
        ))}
      </div>
      <div
        className={`relative flex-1 rounded-lg border ${trackBorder}`}
        style={{ minHeight: trackMinPx }}
      >
        {hourTicks.map((h, i) => (
          <div
            key={h}
            className={`pointer-events-none absolute left-0 right-0 border-t ${gridLine}`}
            style={{
              top: `${(i / (hourTicks.length - 1)) * 100}%`,
            }}
          />
        ))}
        {daySlots.map((s) => {
          const clip = clipSlotToTimeline(
            dateKey,
            new Date(s.startsAt),
            new Date(s.endsAt),
            TIMELINE_START_HOUR
          );
          if (!clip) return null;
          const fullRange = formatHkRange(new Date(s.startsAt), new Date(s.endsAt));
          let bg: string;
          let border: string;
          let text: string;
          const hold = Boolean(s.studioHoldNotApplicable);
          const unavailable = !s.isOpen || s.remaining <= 0;
          if (hold) {
            bg = isAdmin
              ? "bg-stone-600/88"
              : "bg-stone-500/88 dark:bg-stone-600/90";
            border = isAdmin ? "border-stone-500" : "border-stone-600 dark:border-stone-500";
            text = "text-white";
          } else if (unavailable) {
            bg = "bg-red-500/90";
            border = "border-red-700";
            text = "text-white";
          } else {
            bg = "bg-emerald-500/85";
            border = "border-emerald-700";
            text = "text-white";
          }
          const statusLabel = hold
            ? t("booking.timeline.studioHoldCaption")
            : !s.isOpen
              ? t("booking.timeline.statusClosed")
              : s.remaining <= 0
                ? t("booking.timeline.statusFull")
                : t("booking.timeline.statusOpen");
          const used = Math.max(0, s.capacityTotal - s.remaining);
          const emails = s.bookerEmails?.filter((e) => e.trim() !== "") ?? [];
          const titleExtra =
            isAdmin && emails.length > 0 ? ` · ${emails.join(" · ")}` : "";
          return (
            <div
              key={s.id}
              className={`absolute left-1 right-1 flex flex-col justify-center overflow-hidden rounded-md border px-1.5 py-1 text-xs leading-snug shadow-sm sm:text-sm ${bg} ${border} ${text}`}
              style={{
                top: `${clip.topPct}%`,
                height: `${clip.heightPct}%`,
              }}
              title={`${fullRange} · ${statusLabel}${
                isAdmin ? ` · 名額 ${used}/${s.capacityTotal}` : ""
              }${titleExtra}`}
            >
              {hold ? (
                <div className="flex w-full min-w-0 flex-row items-center justify-between gap-x-1.5 gap-y-0 font-semibold">
                  <span className="shrink-0 tabular-nums">{fullRange}</span>
                  <span
                    className="min-w-0 shrink text-right text-[9px] font-medium leading-tight opacity-95 [overflow-wrap:anywhere] sm:text-[10px]"
                    title={t("booking.timeline.studioHoldCaption")}
                  >
                    （{t("booking.timeline.studioHoldCaption")}）
                  </span>
                </div>
              ) : (
                <div className="shrink-0 text-center font-semibold tabular-nums">{fullRange}</div>
              )}
              {isAdmin && (
                <div className="shrink-0 text-center text-[10px] font-medium tabular-nums opacity-95 sm:text-[11px]">
                  名額 {used}/{s.capacityTotal}
                </div>
              )}
              {s.venueLabel && (
                <div className="shrink-0 truncate text-center text-[10px] opacity-90 sm:text-[11px]">
                  {s.venueLabel}
                </div>
              )}
              {isAdmin && emails.length > 0 && (
                <div className="mt-0.5 min-h-0 max-h-[4.5rem] flex-1 overflow-y-auto overscroll-contain text-center text-[9px] leading-tight opacity-95 sm:text-[10px]">
                  {emails.map((em, i) => (
                    <div key={`${s.id}-em-${i}`} className="truncate px-0.5" title={em}>
                      {em}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function summarizeDaySlotsText(
  dateKey: string,
  slots: TimelineSlotInput[],
  options?: { studioHoldCaption?: string }
): { bookedLines: string[]; availableLines: string[]; closedLines: string[] } {
  const daySlots = slots
    .filter((s) => hkDateKeyFromIso(s.startsAt) === dateKey)
    .slice()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const bookedLines: string[] = [];
  const availableLines: string[] = [];
  const closedLines: string[] = [];
  const cap = options?.studioHoldCaption;

  for (const s of daySlots) {
    const range = formatHkRange(new Date(s.startsAt), new Date(s.endsAt));
    if (!s.isOpen) {
      closedLines.push(
        s.studioHoldNotApplicable && cap ? `${range} — ${cap}` : range
      );
    } else if (s.remaining <= 0) {
      bookedLines.push(range);
    } else {
      availableLines.push(range);
    }
  }

  return { bookedLines, availableLines, closedLines };
}
