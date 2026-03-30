"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SOCIAL_FOLLOW_ACCOUNTS,
  SOCIAL_FOLLOW_LINK_KEYS,
  getSocialFollowUrl,
  type SocialFollowLinkKey,
} from "@/lib/social-follow";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

type ApiClicks = Partial<Record<SocialFollowLinkKey, boolean>>;

type Props = {
  token: string;
};

export function SocialFollowSetupPanel({ token }: Props) {
  const { t, tr } = useTranslation();
  const missingUrlCount = SOCIAL_FOLLOW_LINK_KEYS.filter((k) => !getSocialFollowUrl(k)).length;

  const [clicks, setClicks] = useState<ApiClicks>({});
  const [verified, setVerified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<SocialFollowLinkKey | null>(null);

  const sync = useCallback(
    async (linkKey?: SocialFollowLinkKey) => {
      setError(null);
      if (linkKey) setPendingKey(linkKey);
      else setLoading(true);
      try {
        const res = await fetch(withBasePath("/api/v1/registration/social-follow-intent"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(linkKey ? { token, linkKey } : { token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            typeof data?.error?.message === "string" && data.error.message.trim()
              ? data.error.message
              : t("reg.socialFollowSetup.progressUpdateFail")
          );
          return;
        }
        if (data?.clicks && typeof data.clicks === "object") {
          setClicks(data.clicks as ApiClicks);
        }
        if (data?.verified === true) {
          setVerified(true);
          setProgress(6);
        } else if (typeof data?.progress === "number") {
          setProgress(data.progress);
          setVerified(false);
        }
      } catch {
        setError(t("reg.socialFollowSetup.networkError"));
      } finally {
        setPendingKey(null);
        if (!linkKey) setLoading(false);
      }
    },
    [token, t]
  );

  useEffect(() => {
    void sync();
  }, [sync]);

  function openAndRecord(linkKey: SocialFollowLinkKey) {
    const url = getSocialFollowUrl(linkKey);
    if (!url) {
      setError(t("reg.socialFollowSetup.linkNotConfigured"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    void sync(linkKey);
  }

  if (verified) {
    return (
      <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 sm:px-4 py-6 text-left">
        <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
          {t("reg.socialFollowSetup.completedTitle")}
        </h2>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
          {t("reg.socialFollowSetup.completedBody")}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-violet-200 bg-violet-50/50 px-5 sm:px-4 py-6 text-left">
      <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
        {t("reg.socialFollowSetup.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("reg.socialFollowSetup.intro")}
      </p>
      {missingUrlCount > 0 && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {tr("reg.socialFollowSetup.missingUrls", { count: String(missingUrlCount) })}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("reg.socialFollowSetup.progressLabel")}
        {loading ? t("reg.socialFollowSetup.progressLoading") : `${progress} / 6`}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {SOCIAL_FOLLOW_ACCOUNTS.map((col) => (
          <div
            key={col.columnTitle}
            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-3 py-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold leading-snug text-stone-900 dark:text-stone-50">
              {col.columnTitle}
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <FollowButton
                label="Instagram"
                done={!!clicks[col.keys.ig]}
                busy={pendingKey === col.keys.ig}
                disabled={loading || !getSocialFollowUrl(col.keys.ig)}
                onPress={() => openAndRecord(col.keys.ig)}
              />
              <FollowButton
                label="Facebook"
                done={!!clicks[col.keys.fb]}
                busy={pendingKey === col.keys.fb}
                disabled={loading || !getSocialFollowUrl(col.keys.fb)}
                onPress={() => openAndRecord(col.keys.fb)}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-medium text-amber-900 dark:text-amber-200">
        {t("reg.socialFollowSetup.desktopHint")}
      </p>
    </section>
  );
}

function FollowButton({
  label,
  done,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  done: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t, tr } = useTranslation();
  return (
    <button
      type="button"
      disabled={disabled || busy || done}
      onClick={onPress}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm font-medium text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {done ? (
        <>
          <span className="text-emerald-600">✓</span> {tr("reg.socialFollowSetup.followed", { label })}
        </>
      ) : busy ? (
        <>{t("reg.socialFollowSetup.processing")}</>
      ) : (
        <>{tr("reg.socialFollowSetup.goTo", { label })}</>
      )}
    </button>
  );
}
