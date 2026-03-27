"use client";

import {
  TIMELINE_END_HOUR,
  clipSlotToTimeline,
  formatHkRange,
  timelineStartHourForHkDateKey,
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
  const { t, tr } = useTranslation();
  const daySlots = slots.filter((s) => hkDateKeyFromIso(s.startsAt) === dateKey);

  const windowStartHour = timelineStartHourForHkDateKey(dateKey);
  const hourTicks: number[] = [];
  for (let h = windowStartHour; h <= TIMELINE_END_HOUR; h++) {
    hourTicks.push(h);
  }

  const isAdmin = variant === "admin";
  const labelCls = isAdmin ? "text-slate-400" : "text-stone-500 dark:text-stone-500";
  const trackBorder = isAdmin ? "border-slate-600 bg-slate-900/40" : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80";
  const gridLine = isAdmin ? "border-slate-600/90" : "border-stone-200 dark:border-stone-700/90";

  return (
    <div className="flex gap-3">
      <div
        className={`flex w-11 shrink-0 flex-col justify-between pt-1 text-right text-xs ${labelCls}`}
        style={{ minHeight: 320 }}
        aria-hidden
      >
        {hourTicks.map((h) => (
          <span key={h}>{hourTickLabel(h)}</span>
        ))}
      </div>
      <div className={`relative min-h-[320px] flex-1 rounded-lg border ${trackBorder}`}>
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
            windowStartHour
          );
          if (!clip) return null;
          const fullRange = formatHkRange(new Date(s.startsAt), new Date(s.endsAt));
          let bg: string;
          let border: string;
          let text: string;
          if (!s.isOpen) {
            bg = "bg-slate-400/85";
            border = "border-slate-500";
            text = "text-white";
          } else if (s.remaining <= 0) {
            bg = "bg-red-500/90";
            border = "border-red-700";
            text = "text-white";
          } else {
            bg = "bg-emerald-500/85";
            border = "border-emerald-700";
            text = "text-white";
          }
          const statusLabel = !s.isOpen
            ? t("booking.timeline.statusClosed")
            : s.remaining <= 0
              ? t("booking.timeline.statusFull")
              : t("booking.timeline.statusOpen");
          return (
            <div
              key={s.id}
              className={`absolute left-1 right-1 overflow-hidden rounded-md border px-1 py-0.5 text-[10px] leading-tight shadow-sm sm:text-xs ${bg} ${border} ${text}`}
              style={{
                top: `${clip.topPct}%`,
                height: `${Math.max(clip.heightPct, 2.2)}%`,
              }}
              title={`${fullRange} · ${statusLabel}`}
            >
              <div className="font-semibold">{fullRange}</div>
              {variant === "user" && s.remaining <= 0 && s.isOpen && (
                <div className="opacity-95">{t("booking.timeline.bookedThis")}</div>
              )}
              {variant === "user" && s.remaining > 0 && s.isOpen && (
                <div className="opacity-95">
                  {tr("booking.timeline.canBookRemaining", {
                    remaining: String(s.remaining),
                    capacity: String(s.capacityTotal),
                  })}
                </div>
              )}
              {s.venueLabel && (
                <div className="truncate opacity-90">{s.venueLabel}</div>
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
  lineTr?: (path: string, vars: Record<string, string>) => string
): { bookedLines: string[]; availableLines: string[]; closedLines: string[] } {
  const daySlots = slots
    .filter((s) => hkDateKeyFromIso(s.startsAt) === dateKey)
    .slice()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const bookedLines: string[] = [];
  const availableLines: string[] = [];
  const closedLines: string[] = [];

  for (const s of daySlots) {
    const range = formatHkRange(new Date(s.startsAt), new Date(s.endsAt));
    if (!s.isOpen) {
      closedLines.push(
        lineTr
          ? lineTr("booking.cal.summaryLineClosed", { range })
          : `${range}（時段已關閉）`
      );
    } else if (s.remaining <= 0) {
      bookedLines.push(
        lineTr
          ? lineTr("booking.cal.summaryLineBooked", { range })
          : `${range}（已滿／已被預約）`
      );
    } else {
      availableLines.push(
        lineTr
          ? lineTr("booking.cal.summaryLineAvailable", {
              range,
              remaining: String(s.remaining),
              capacity: String(s.capacityTotal),
            })
          : `${range}（可預約 · 剩餘 ${s.remaining}/${s.capacityTotal}）`
      );
    }
  }

  return { bookedLines, availableLines, closedLines };
}
