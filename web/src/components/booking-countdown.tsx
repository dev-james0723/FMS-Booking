"use client";

import { useEffect, useState } from "react";

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
      <p className="text-sm text-stone-600">預約開放時間請留意主辦方公布。</p>
    );
  }

  const target = new Date(bookingOpensAtIso).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        預約申請已開放（須先完成登記及更改臨時密碼）。請登入後進入預約系統。
      </p>
    );
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-center">
      <p className="text-sm font-medium text-amber-950">預約系統正式開放倒數（香港時間）</p>
      <p className="mt-2 font-mono text-2xl tracking-widest text-amber-950">
        {days > 0 ? `${days} 日 ` : ""}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </p>
      <p className="mt-2 text-xs text-amber-900/80">
        開放時間：{bookingOpensAtLabel ?? bookingOpensAtIso}
      </p>
    </div>
  );
}
