"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { sessionHoursParen } from "@/lib/i18n/session-hours";
import type { AmbassadorReferralPayload } from "@/lib/referral/ambassador-referral-payload";

function statFromJson(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return 0;
}

/** Accepts API payloads where stats may be loose (e.g. null after JSON NaN). */
function normalizeOptedInPayload(raw: unknown): AmbassadorReferralPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  if (j.optedIn !== true) return null;
  if (typeof j.code !== "string" || typeof j.shareUrl !== "string") return null;
  const st = j.stats;
  if (!st || typeof st !== "object") return null;
  const s = st as Record<string, unknown>;
  return {
    code: j.code,
    shareUrl: j.shareUrl,
    stats: {
      linkOpens: Math.max(0, statFromJson(s.linkOpens)),
      registrations: Math.max(0, statFromJson(s.registrations)),
      rewardTimes: Math.max(0, statFromJson(s.rewardTimes)),
      rewardBonusSlotsTotal: Math.max(0, statFromJson(s.rewardBonusSlotsTotal)),
    },
  };
}

const REFERRAL_FETCH_RETRIES = 3;

async function fetchReferralPayloadWithRetries(): Promise<AmbassadorReferralPayload | null> {
  for (let attempt = 0; attempt < REFERRAL_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(withBasePath("/api/v1/account/referral"), {
        credentials: "same-origin",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        /* empty */
      } else {
        const payload = normalizeOptedInPayload(json);
        if (payload) return payload;
      }
    } catch {
      /* retry */
    }
    if (attempt < REFERRAL_FETCH_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  return null;
}

export function AccountAmbassadorReferralSection(props: {
  wantsAmbassador: boolean;
  /** When opted in: server payload, or `null` if the server could not load (client retries). */
  initialReferral?: AmbassadorReferralPayload | null;
}) {
  const { t, tr, locale } = useTranslation();
  const optedInAtRegistration = props.wantsAmbassador === true;

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AmbassadorReferralPayload | null>(() => {
    if (!optedInAtRegistration) return null;
    return props.initialReferral ?? null;
  });
  const [showOptIn, setShowOptIn] = useState(!optedInAtRegistration);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => {
    if (!optedInAtRegistration) return false;
    return props.initialReferral == null;
  });
  const [optInBusy, setOptInBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tRef = useRef(t);
  tRef.current = t;

  const preloadKey =
    !optedInAtRegistration
      ? "off"
      : props.initialReferral == null
        ? "missing"
        : props.initialReferral.code;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!optedInAtRegistration) {
      setShowOptIn(true);
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setShowOptIn(false);

    if (props.initialReferral != null) {
      setData(props.initialReferral);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    void (async () => {
      const payload = await fetchReferralPayloadWithRetries();
      if (cancelled) return;
      if (payload) {
        setData(payload);
        setError(null);
      } else {
        let keepExisting = false;
        setData((prev) => {
          if (prev != null) {
            keepExisting = true;
            return prev;
          }
          return null;
        });
        if (!keepExisting) {
          setError(tRef.current("account.ambassadorError"));
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, optedInAtRegistration, preloadKey, props.initialReferral]);

  useEffect(() => {
    if (!data?.shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(data.shareUrl, { margin: 2, width: 200, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data?.shareUrl]);

  const joinAmbassador = useCallback(async () => {
    setOptInBusy(true);
    setError(null);
    try {
      const res = await fetch(withBasePath("/api/v1/account/referral"), {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      const payload = res.ok ? normalizeOptedInPayload(json) : null;
      if (!payload) {
        setError(t("account.ambassadorError"));
        return;
      }
      setShowOptIn(false);
      setData(payload);
    } catch {
      setError(t("account.ambassadorError"));
    } finally {
      setOptInBusy(false);
    }
  }, [t]);

  const copyLink = useCallback(async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [data]);

  if (!mounted) {
    return (
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
          {t("account.ambassadorPlanTitle")}
        </h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t("account.ambassadorLoading")}</p>
      </section>
    );
  }

  if (showOptIn && !data) {
    return (
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
          {t("account.ambassadorPlanTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {t("account.ambassadorOptInIntro")}
        </p>
        {error ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        <button
          type="button"
          disabled={optInBusy}
          onClick={() => void joinAmbassador()}
          className="mt-4 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {optInBusy ? t("account.ambassadorOptInBusy") : t("account.ambassadorOptInButton")}
        </button>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
          {t("account.ambassadorPlanTitle")}
        </h2>
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      </section>
    );
  }

  if (loading || !data) {
    return (
      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
          {t("account.ambassadorPlanTitle")}
        </h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t("account.ambassadorLoading")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
      <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.ambassadorPlanTitle")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("account.ambassadorSectionIntro")}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
        {t("account.ambassadorRewardRules")}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-500">
            {t("account.ambassadorShareLink")}
          </p>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-600 dark:bg-stone-900/50">
            <p className="break-all px-3 py-2 font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-200">
              {data.shareUrl}
            </p>
            <div className="flex justify-end px-2 pb-2 pt-0">
              <button
                type="button"
                onClick={copyLink}
                className="motion-safe:animate-ambassador-copy-wobble origin-center shrink-0 rounded-full bg-stone-900 px-5 py-2 text-sm text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                {copied ? t("account.ambassadorLinkCopied") : t("account.ambassadorCopyLink")}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
            <img src={qrDataUrl} alt="" className="h-44 w-44 rounded-lg border border-stone-200 bg-white p-2 dark:border-stone-600" />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-dashed border-stone-300 text-xs text-stone-500 dark:border-stone-600">
              {t("account.ambassadorQrLoading")}
            </div>
          )}
          <span className="text-center text-[11px] text-stone-500 dark:text-stone-500">
            {t("account.ambassadorQrCaption")}
          </span>
        </div>
      </div>

      <dl className="mt-8 grid gap-3 border-t border-stone-100 pt-6 dark:border-stone-800 sm:grid-cols-3">
        <div className="rounded-xl bg-stone-50/90 px-4 py-3 dark:bg-stone-900/50">
          <dt className="text-xs text-stone-500 dark:text-stone-500">{t("account.ambassadorStatOpens")}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
            {data.stats.linkOpens}
          </dd>
        </div>
        <div className="rounded-xl bg-stone-50/90 px-4 py-3 dark:bg-stone-900/50">
          <dt className="text-xs text-stone-500 dark:text-stone-500">{t("account.ambassadorStatRegisters")}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
            {data.stats.registrations}
          </dd>
        </div>
        <div className="rounded-xl bg-stone-50/90 px-4 py-3 dark:bg-stone-900/50">
          <dt className="text-xs text-stone-500 dark:text-stone-500">{t("account.ambassadorStatRewards")}</dt>
          <dd className="mt-1 text-lg font-semibold leading-snug text-stone-900 dark:text-stone-50">
            {tr("account.ambassadorStatRewardsValue", {
              times: String(data.stats.rewardTimes),
              slots: String(data.stats.rewardBonusSlotsTotal),
              slotsH: sessionHoursParen(locale, data.stats.rewardBonusSlotsTotal),
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
