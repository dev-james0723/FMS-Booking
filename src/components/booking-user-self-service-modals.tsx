"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  ADVANCE_DAYS_INDIVIDUAL_WEEKDAY,
  ADVANCE_DAYS_INDIVIDUAL_WEEKEND,
} from "@/lib/booking/booking-constants";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import { buildMonthGrid, daysInCalendarMonth, slotStartsAtToHkDateKey } from "@/lib/hk-calendar-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/types";
import { HK_TZ } from "@/lib/time";

export const WHATSAPP_BOOKING_HELP_URL = "https://wa.link/g1ngfh";

export type SelfServiceSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  venueLabel: string | null;
};

type AvailSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  isOpen: boolean;
  venueLabel: string | null;
};

function hkTodayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function monthRangeKeys(year: number, month1: number): { from: string; to: string } {
  const padM = String(month1).padStart(2, "0");
  const last = daysInCalendarMonth(year, month1);
  return {
    from: `${year}-${padM}-01`,
    to: `${year}-${padM}-${String(last).padStart(2, "0")}`,
  };
}

function selfServiceSlotsResetSignature(slots: SelfServiceSlot[]): string {
  return slots.map((s) => s.id).join("\0");
}

function selfServiceSlotDatesSignature(slots: SelfServiceSlot[]): string {
  const s = new Set<string>();
  for (const x of slots) {
    s.add(slotStartsAtToHkDateKey(x.startsAt));
  }
  return [...s].sort().join("\0");
}

function initialMonthFromSlots(slots: SelfServiceSlot[]): { year: number; month1: number } {
  if (slots.length === 0) {
    const t = hkTodayKey();
    const [y, m] = t.split("-").map(Number);
    return { year: y!, month1: m! };
  }
  const key = slotStartsAtToHkDateKey(slots[0]!.startsAt);
  const [y, m] = key.split("-").map(Number);
  return { year: y!, month1: m! };
}

function ModalDismissIconButton(props: { onClick: () => void; ariaLabel: string }) {
  const { onClick, ariaLabel } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/15 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export function BookingContactOrganizerModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-600 bg-stone-950 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-50">{t("booking.historyPanel.selfService.contactTitle")}</h2>
          <ModalDismissIconButton onClick={onClose} ariaLabel={t("booking.historyPanel.selfService.contactClose")} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">{t("booking.historyPanel.selfService.contactBody1")}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">{t("booking.historyPanel.selfService.contactBody2")}</p>
        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">{t("booking.historyPanel.selfService.contactBody3")}</p>

        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-stone-700 bg-stone-900/60 p-4">
          <Image
            src={withBasePath("/whatsapp-booking-contact-qr.png")}
            alt="WhatsApp QR"
            width={200}
            height={200}
            className="rounded-md bg-white p-2"
            unoptimized
          />
          <a
            href={WHATSAPP_BOOKING_HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-400 underline hover:text-sky-300"
          >
            {t("booking.historyPanel.selfService.contactWhatsappCta")}
          </a>
          <p className="break-all text-center text-[11px] text-stone-500">{WHATSAPP_BOOKING_HELP_URL}</p>
        </div>
      </div>
    </div>
  );
}

type UserBookingRescheduleModalProps = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  venueKind: "studio_room" | "open_space";
  currentSlots: SelfServiceSlot[];
  onApplied: () => void;
  onWithinCutoff?: () => void;
};

export function UserBookingRescheduleModal(props: UserBookingRescheduleModalProps) {
  if (!props.open) return null;
  const sig = selfServiceSlotsResetSignature(props.currentSlots);
  return (
    <UserBookingRescheduleModalOpen
      key={`${props.bookingId}-${sig}`}
      onClose={props.onClose}
      bookingId={props.bookingId}
      venueKind={props.venueKind}
      currentSlots={props.currentSlots}
      onApplied={props.onApplied}
      onWithinCutoff={props.onWithinCutoff}
    />
  );
}

function UserBookingRescheduleModalOpen(
  props: Omit<UserBookingRescheduleModalProps, "open">,
) {
  const { onClose, bookingId, venueKind, currentSlots, onApplied, onWithinCutoff } = props;
  const { t, tr, locale } = useTranslation();

  const [{ year, month1 }, setYm] = useState(() => initialMonthFromSlots(currentSlots));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [removeIds, setRemoveIds] = useState<Set<string>>(() => new Set());
  const [addIds, setAddIds] = useState<Set<string>>(() => new Set());
  const [avail, setAvail] = useState<AvailSlot[]>([]);
  const [bookableDateRange, setBookableDateRange] = useState<{ from: string; to: string } | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const weekdays = useMemo(
    () =>
      locale === "en"
        ? (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)
        : (["日", "一", "二", "三", "四", "五", "六"] as const),
    [locale]
  );

  const loadAvail = useCallback(async () => {
    setLoadError(null);
    const { from, to } = monthRangeKeys(year, month1);
    const params = new URLSearchParams();
    params.set("venue", venueKind);
    params.set("from", from);
    params.set("to", to);
    params.set("excludeRequestId", bookingId);
    const res = await fetch(withBasePath(`/api/v1/booking/reschedule-availability?${params}`), {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(data?.error?.message ?? t("booking.historyPanel.selfService.rescheduleLoadError"));
      setAvail([]);
      setBookableDateRange(null);
      return;
    }
    const range = data.bookableDateRange as { from?: unknown; to?: unknown } | undefined;
    if (
      range &&
      typeof range === "object" &&
      typeof range.from === "string" &&
      typeof range.to === "string"
    ) {
      setBookableDateRange({ from: range.from, to: range.to });
    } else {
      setBookableDateRange(null);
    }
    setAvail(data.slots ?? []);
  }, [year, month1, venueKind, bookingId, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAvail(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAvail]);

  const effectiveSelectedDayKey = useMemo(() => {
    if (!selectedDayKey) return null;
    if (!bookableDateRange || bookableDateRange.from > bookableDateRange.to) return selectedDayKey;
    if (selectedDayKey < bookableDateRange.from || selectedDayKey > bookableDateRange.to) {
      return null;
    }
    return selectedDayKey;
  }, [bookableDateRange, selectedDayKey]);

  const currentIdSet = useMemo(() => new Set(currentSlots.map((s) => s.id)), [currentSlots]);

  const keptIds = useMemo(() => {
    const k = new Set<string>();
    for (const id of currentIdSet) {
      if (!removeIds.has(id)) k.add(id);
    }
    return k;
  }, [currentIdSet, removeIds]);

  const finalCount = useMemo(() => {
    let n = keptIds.size;
    for (const addId of addIds) {
      if (!keptIds.has(addId)) n++;
    }
    return n;
  }, [keptIds, addIds]);

  const daySlots = useMemo(() => {
    if (!effectiveSelectedDayKey) return [];
    return avail.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === effectiveSelectedDayKey);
  }, [avail, effectiveSelectedDayKey]);

  async function submit() {
    if (finalCount < 1) {
      window.alert(t("booking.historyPanel.selfService.rescheduleNeedOne"));
      return;
    }
    if (removeIds.size === 0 && addIds.size === 0) {
      window.alert(t("booking.historyPanel.selfService.rescheduleNeedChange"));
      return;
    }
    setBusy(true);
    const q = new URLSearchParams({ venue: venueKind });
    const res = await fetch(
      withBasePath(`/api/v1/booking/requests/${bookingId}/reschedule?${q}`),
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removeSlotIds: [...removeIds],
          addSlotIds: [...addIds],
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (data?.error?.code === "WITHIN_CUTOFF" && onWithinCutoff) {
        onClose();
        onWithinCutoff();
        return;
      }
      window.alert(data?.error?.message ?? t("booking.historyPanel.selfService.rescheduleFail"));
      return;
    }
    onApplied();
    onClose();
  }

  const title =
    locale === "en"
      ? `${year}-${String(month1).padStart(2, "0")}`
      : `${year} 年 ${month1} 月`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-950 p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-reschedule-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
          <div>
            <h2 id="user-reschedule-title" className="text-lg font-semibold text-white">
              {t("booking.historyPanel.selfService.rescheduleTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {tr("booking.historyPanel.selfService.rescheduleIntro", {
                weekdayDays: String(ADVANCE_DAYS_INDIVIDUAL_WEEKDAY),
                weekendDays: String(ADVANCE_DAYS_INDIVIDUAL_WEEKEND),
              })}
            </p>
          </div>
          <ModalDismissIconButton onClick={onClose} ariaLabel={t("booking.historyPanel.selfService.contactClose")} />
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <p className="mb-2 text-sm font-medium text-slate-200">
              {t("booking.historyPanel.selfService.rescheduleOriginalLabel")}
            </p>
            <ul className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              {currentSlots.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={removeIds.has(s.id)}
                      onChange={(e) => {
                        const next = new Set(removeIds);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setRemoveIds(next);
                      }}
                      className="rounded border-slate-500"
                    />
                    <span>
                      {formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}
                      {s.venueLabel != null && s.venueLabel !== ""
                        ? ` · ${displayVenueLabel(s.venueLabel)}`
                        : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setYm((prev) => {
                    if (prev.month1 <= 1) return { year: prev.year - 1, month1: 12 };
                    return { year: prev.year, month1: prev.month1 - 1 };
                  })
                }
              >
                {t("booking.historyPanel.selfService.reschedulePrevMonth")}
              </button>
              <span className="text-sm text-slate-200">{title}</span>
              <button
                type="button"
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setYm((prev) => {
                    if (prev.month1 >= 12) return { year: prev.year + 1, month1: 1 };
                    return { year: prev.year, month1: prev.month1 + 1 };
                  })
                }
              >
                {t("booking.historyPanel.selfService.rescheduleNextMonth")}
              </button>
            </div>
            {loadError && <p className="text-xs text-red-400">{loadError}</p>}
          </div>

          <div className="rounded-lg border border-slate-700 p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
              {weekdays.map((w) => (
                <div key={w} className="py-1 font-medium">
                  {w}
                </div>
              ))}
              {buildMonthGrid(year, month1).map((cell, idx) => {
                if (!cell.dateKey) {
                  return <div key={`pad-${idx}`} />;
                }
                const key = cell.dateKey;
                const inRollingPickWindow =
                  bookableDateRange != null &&
                  bookableDateRange.from <= bookableDateRange.to &&
                  key >= bookableDateRange.from &&
                  key <= bookableDateRange.to;
                const dayList = avail.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === key);
                const pickable = dayList.filter(
                  (s) => !keptIds.has(s.id) && s.isOpen && s.remaining > 0
                ).length;
                const selected = effectiveSelectedDayKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!inRollingPickWindow}
                    onClick={() => {
                      if (inRollingPickWindow) setSelectedDayKey(key);
                    }}
                    className={`rounded py-1.5 text-xs ${
                      !inRollingPickWindow
                        ? "cursor-not-allowed border border-transparent bg-slate-900/50 text-slate-600"
                        : selected
                          ? "bg-sky-700 text-white"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>{Number(key.slice(8, 10))}</div>
                    {inRollingPickWindow && dayList.length > 0 && (
                      <div className="text-[9px] text-slate-400">
                        {pickable > 0 ? `${pickable}` : "—"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {bookableDateRange && bookableDateRange.from <= bookableDateRange.to ? (
              <p className="mt-2 text-xs text-slate-500">
                {tr("booking.historyPanel.selfService.rescheduleRollingHint", {
                  from: bookableDateRange.from,
                  to: bookableDateRange.to,
                  weekdayDays: String(ADVANCE_DAYS_INDIVIDUAL_WEEKDAY),
                  weekendDays: String(ADVANCE_DAYS_INDIVIDUAL_WEEKEND),
                })}
              </p>
            ) : bookableDateRange && bookableDateRange.from > bookableDateRange.to ? (
              <p className="mt-2 text-xs text-amber-500/90">
                {t("booking.historyPanel.selfService.rescheduleNoRollingWindow")}
              </p>
            ) : null}
          </div>

          <section>
            <p className="mb-2 text-sm font-medium text-slate-200">
              {effectiveSelectedDayKey
                ? `${effectiveSelectedDayKey} · ${t("booking.historyPanel.selfService.rescheduleSlotsForDay")}`
                : t("booking.historyPanel.selfService.reschedulePickDay")}
            </p>
            {!effectiveSelectedDayKey ? (
              <p className="text-xs text-slate-500">{t("booking.historyPanel.selfService.reschedulePickDayHint")}</p>
            ) : daySlots.length === 0 ? (
              <p className="text-xs text-slate-500">{t("booking.historyPanel.selfService.rescheduleNoSlotsDay")}</p>
            ) : (
              <ul className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                {daySlots.map((s) => {
                  const isKept = keptIds.has(s.id);
                  const canPick = !isKept && s.isOpen && s.remaining > 0;
                  const chosen = addIds.has(s.id);
                  const line = formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt);
                  const v =
                    s.venueLabel != null && s.venueLabel !== ""
                      ? ` · ${displayVenueLabel(s.venueLabel)}`
                      : "";

                  if (isKept) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5">
                          {t("booking.historyPanel.selfService.rescheduleKept")}
                        </span>
                      </li>
                    );
                  }

                  if (!s.isOpen) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 text-amber-600/90">
                          {t("booking.historyPanel.selfService.rescheduleClosed")}
                        </span>
                      </li>
                    );
                  }

                  if (!canPick) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 text-red-400/90">{t("booking.historyPanel.selfService.rescheduleFull")}</span>
                      </li>
                    );
                  }

                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={chosen}
                          onChange={(e) => {
                            const next = new Set(addIds);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            setAddIds(next);
                          }}
                          className="rounded border-slate-500"
                        />
                        {line}
                        {v}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-xs text-slate-400">
            {tr("booking.historyPanel.selfService.rescheduleSummary", {
              remove: String(removeIds.size),
              add: String(addIds.size),
              total: String(finalCount),
            })}
          </p>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-700 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              {t("booking.historyPanel.selfService.rescheduleCancel")}
            </button>
            <button
              type="button"
              disabled={busy || finalCount < 1}
              onClick={() => void submit()}
              className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-600 disabled:opacity-40"
            >
              {busy ? t("booking.historyPanel.selfService.rescheduleBusy") : t("booking.historyPanel.selfService.rescheduleConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateKeyForDisplay(dateKey: string, locale: Locale): string {
  const [y, mo, da] = dateKey.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return dateKey;
  return new Date(y, mo - 1, da).toLocaleDateString(locale === "en" ? "en-HK" : "zh-HK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type UserBookingCancelModalProps = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  venueKind: "studio_room" | "open_space";
  currentSlots: SelfServiceSlot[];
  onApplied: () => void;
  onWithinCutoff?: () => void;
};

export function UserBookingCancelModal(props: UserBookingCancelModalProps) {
  if (!props.open) return null;
  const dk = selfServiceSlotDatesSignature(props.currentSlots);
  return (
    <UserBookingCancelModalOpen
      key={`${props.bookingId}-${dk}`}
      onClose={props.onClose}
      bookingId={props.bookingId}
      venueKind={props.venueKind}
      currentSlots={props.currentSlots}
      onApplied={props.onApplied}
      onWithinCutoff={props.onWithinCutoff}
    />
  );
}

function UserBookingCancelModalOpen(props: Omit<UserBookingCancelModalProps, "open">) {
  const { onClose, bookingId, venueKind, currentSlots, onApplied, onWithinCutoff } = props;
  const { t, locale } = useTranslation();

  const dates = useMemo(() => {
    const s = new Set<string>();
    for (const x of currentSlots) {
      s.add(slotStartsAtToHkDateKey(x.startsAt));
    }
    return [...s].sort();
  }, [currentSlots]);

  const [dateKey, setDateKey] = useState<string | null>(() => dates[0] ?? null);
  const [pickIds, setPickIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const slotsOnDay = useMemo(() => {
    if (!dateKey) return [];
    return currentSlots.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === dateKey);
  }, [currentSlots, dateKey]);

  async function submitAllDay() {
    if (!dateKey) return;
    setBusy(true);
    const q = new URLSearchParams({ venue: venueKind });
    const res = await fetch(withBasePath(`/api/v1/booking/requests/${bookingId}/release-slots?${q}`), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateKey }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (data?.error?.code === "WITHIN_CUTOFF" && onWithinCutoff) {
        onClose();
        onWithinCutoff();
        return;
      }
      window.alert(data?.error?.message ?? t("booking.historyPanel.selfService.cancelFail"));
      return;
    }
    onApplied();
    onClose();
  }

  async function submitPartial() {
    if (pickIds.size === 0) {
      window.alert(t("booking.historyPanel.selfService.cancelNeedPick"));
      return;
    }
    setBusy(true);
    const q = new URLSearchParams({ venue: venueKind });
    const res = await fetch(withBasePath(`/api/v1/booking/requests/${bookingId}/release-slots?${q}`), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotIds: [...pickIds] }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (data?.error?.code === "WITHIN_CUTOFF" && onWithinCutoff) {
        onClose();
        onWithinCutoff();
        return;
      }
      window.alert(data?.error?.message ?? t("booking.historyPanel.selfService.cancelFail"));
      return;
    }
    onApplied();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-950 p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-3">
          <h2 className="text-lg font-semibold text-white">{t("booking.historyPanel.selfService.cancelTitle")}</h2>
          <ModalDismissIconButton onClick={onClose} ariaLabel={t("booking.historyPanel.selfService.contactClose")} />
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">{t("booking.historyPanel.selfService.cancelPickDay")}</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={dateKey ?? ""}
              onChange={(e) => {
                setDateKey(e.target.value || null);
                setPickIds(new Set());
              }}
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateKeyForDisplay(d, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400">{t("booking.historyPanel.selfService.cancelPickSlots")}</p>
            <ul className="mt-2 space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              {slotsOnDay.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={pickIds.has(s.id)}
                      onChange={(e) => {
                        const next = new Set(pickIds);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setPickIds(next);
                      }}
                      className="rounded border-slate-500"
                    />
                    {formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}
                    {s.venueLabel ? ` · ${displayVenueLabel(s.venueLabel)}` : ""}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled={busy || !dateKey}
            onClick={() => void submitAllDay()}
            className="w-full rounded-lg border border-amber-700/80 bg-amber-950/40 py-2 text-sm text-amber-100 hover:bg-amber-950/60 disabled:opacity-40"
          >
            {t("booking.historyPanel.selfService.cancelAllDay")}
          </button>

          <div className="flex justify-end gap-2 border-t border-slate-700 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              {t("booking.historyPanel.selfService.rescheduleCancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitPartial()}
              className="rounded bg-rose-800 px-3 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-40"
            >
              {busy ? t("booking.historyPanel.selfService.cancelBusy") : t("booking.historyPanel.selfService.cancelSubmit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
