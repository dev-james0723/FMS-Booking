"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

type SyncResponse = {
  created?: number;
  updated?: number;
  removed?: number;
  error?: { code?: string; message?: string };
};

export function AccountGoogleCalendarPanel({
  oauthReady,
  linked,
}: {
  oauthReady: boolean;
  linked: boolean;
}) {
  const { t, tr } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const connectHref = withBasePath("/api/v1/account/google-calendar/oauth/start");

  async function runSync() {
    setPhase("busy");
    setMessage(null);
    const res = await fetch(withBasePath("/api/v1/account/google-calendar/sync"), {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as SyncResponse;
    if (!res.ok) {
      setPhase("err");
      const code = data.error?.code;
      if (code === "NOT_LINKED") {
        setMessage(t("account.gcalSyncNeedConnect"));
      } else {
        setMessage(data.error?.message ?? t("account.gcalSyncError"));
      }
      return;
    }
    setPhase("ok");
    setMessage(
      tr("account.gcalSyncResult", {
        created: String(data.created ?? 0),
        updated: String(data.updated ?? 0),
        removed: String(data.removed ?? 0),
      })
    );
  }

  if (!oauthReady) {
    return (
      <p className="text-xs text-stone-500 dark:text-stone-500">{t("account.gcalNotConfigured")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {!linked ? (
          <a
            href={connectHref}
            className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-5 sm:px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            {t("account.gcalConnect")}
          </a>
        ) : (
          <button
            type="button"
            disabled={phase === "busy"}
            onClick={() => void runSync()}
            className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-5 sm:px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-60"
          >
            {phase === "busy" ? t("account.gcalSyncBusy") : t("account.gcalSync")}
          </button>
        )}
      </div>
      {message && (
        <p
          className={`text-xs ${
            phase === "err"
              ? "text-rose-600 dark:text-rose-400"
              : "text-stone-600 dark:text-stone-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
