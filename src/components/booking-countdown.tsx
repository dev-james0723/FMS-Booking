"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  bookingOpensAtIso: string | null;
  /** Formatted on the server only — avoids zh-HK locale spacing differing between Node and browser. */
  bookingOpensAtLabel?: string | null;
  /** Server snapshot of "now" so first paint matches SSR; client syncs in useEffect. */
  initialNowMs: number;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function BookingCountdown({
  bookingOpensAtIso,
  bookingOpensAtLabel,
  initialNowMs,
}: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => initialNowMs);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, []);

  if (!bookingOpensAtIso) {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-400">{t("countdown.tba")}</p>
    );
  }

  const target = new Date(bookingOpensAtIso).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-5 sm:px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
        {t("countdown.live")}
      </p>
    );
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-5 sm:px-4 py-4 text-center dark:border-amber-700/50 dark:bg-amber-950/40">
      <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
        {t("countdown.heading")}
      </p>
      <p className="mt-2 font-mono text-2xl tracking-widest text-amber-950 dark:text-amber-50">
        {days > 0 ? `${days} ${t("countdown.dayUnit")} ` : ""}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </p>
      <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-200/80">
        {t("countdown.opensAt")}
        {bookingOpensAtLabel ?? bookingOpensAtIso}
      </p>
    </div>
  );
}
