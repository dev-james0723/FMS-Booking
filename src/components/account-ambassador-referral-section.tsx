"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

type ReferralPayload = {
  code: string;
  shareUrl: string;
  stats: {
    linkOpens: number;
    registrations: number;
    rewardTimes: number;
    rewardBonusSlotsTotal: number;
  };
};

type ReferralApiJson =
  | { optedIn: false }
  | {
      optedIn: true;
      code: string;
      shareUrl: string;
      stats: ReferralPayload["stats"];
    };

function isOptedInPayload(j: ReferralApiJson | null): j is Extract<ReferralApiJson, { optedIn: true }> {
  return (
    j != null &&
    j.optedIn === true &&
    typeof j.code === "string" &&
    typeof j.shareUrl === "string" &&
    j.stats != null &&
    typeof j.stats.linkOpens === "number" &&
    typeof j.stats.registrations === "number" &&
    typeof j.stats.rewardTimes === "number" &&
    typeof j.stats.rewardBonusSlotsTotal === "number"
  );
}

export function AccountAmbassadorReferralSection(props: { wantsAmbassador: boolean }) {
  const { t, tr } = useTranslation();
  /** RSC payload can omit `false`; treat only strict `true` as opted-in (matches server page). */
  const optedInAtRegistration = props.wantsAmbassador === true;
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ReferralPayload | null>(null);
  const [showOptIn, setShowOptIn] = useState(!optedInAtRegistration);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(optedInAtRegistration);
  const [optInBusy, setOptInBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    setLoading(true);
    setShowOptIn(false);
    (async () => {
      try {
        const res = await fetch(withBasePath("/api/v1/account/referral"), {
          credentials: "same-origin",
        });
        const json = (await res.json().catch(() => null)) as ReferralApiJson | null;
        if (!res.ok || !isOptedInPayload(json)) {
          if (!cancelled) {
            setError(t("account.ambassadorError"));
            setData(null);
          }
          return;
        }
        if (!cancelled) {
          setData({
            code: json.code,
            shareUrl: json.shareUrl,
            stats: json.stats,
          });
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(t("account.ambassadorError"));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, optedInAtRegistration, t]);

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
      });
      const json = (await res.json().catch(() => null)) as ReferralApiJson | null;
      if (!res.ok || !isOptedInPayload(json)) {
        setError(t("account.ambassadorError"));
        return;
      }
      setShowOptIn(false);
      setData({
        code: json.code,
        shareUrl: json.shareUrl,
        stats: json.stats,
      });
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
          <p className="break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-800 dark:border-stone-600 dark:bg-stone-900/50 dark:text-stone-200">
            {data.shareUrl}
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full bg-stone-900 px-5 py-2 text-sm text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {copied ? t("account.ambassadorLinkCopied") : t("account.ambassadorCopyLink")}
          </button>
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
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
