"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SOCIAL_FOLLOW_ACCOUNTS,
  SOCIAL_FOLLOW_LINK_KEYS,
  getSocialFollowUrl,
  type SocialFollowLinkKey,
} from "@/lib/social-follow";
import { withBasePath } from "@/lib/base-path";

type ApiClicks = Partial<Record<SocialFollowLinkKey, boolean>>;

type Props = {
  token: string;
};

export function SocialFollowSetupPanel({ token }: Props) {
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
          setError(data?.error?.message ?? "無法更新進度");
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
        setError("網絡錯誤，請稍後再試。");
      } finally {
        setPendingKey(null);
        if (!linkKey) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void sync();
  }, [sync]);

  function openAndRecord(linkKey: SocialFollowLinkKey) {
    const url = getSocialFollowUrl(linkKey);
    if (!url) {
      setError("此連結尚未設定，請聯絡主辦方或稍後再試。");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    void sync(linkKey);
  }

  if (verified) {
    return (
      <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-6 text-left">
        <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">追蹤步驟已完成</h2>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
          你已透過本頁開啟全部六個官方帳戶連結；系統已記錄你完成登記時承諾之「追蹤指定社交媒體帳號」步驟。此舉不會帶來額外預約時段；免費體驗之名額與批核仍依活動條款及主辦安排為準。
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-violet-200 bg-violet-50/50 px-4 py-6 text-left">
      <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">追蹤官方帳戶（登記承諾）</h2>
      <p className="mt-2 text-sm font-medium text-stone-800 dark:text-stone-200">
        參與本免費體驗須於 Instagram 及 Facebook 追蹤下列官方帳戶；完成本步驟不會獲得任何額外預約時段。
      </p>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        請點擊下列六個按鈕各一次；會在新分頁開啟對應官方頁面並於此頁記錄進度。重複點擊同一按鈕不會重複計算；六個都曾點擊即視為完成追蹤承諾之系統記錄。
      </p>
      {missingUrlCount > 0 && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          有 {missingUrlCount} 個官方連結未能載入，對應按鈕暫時無法使用。請稍後再試或聯絡主辦方。
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">
        進度：{loading ? "…" : `${progress} / 6`}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {SOCIAL_FOLLOW_ACCOUNTS.map((col) => (
          <div
            key={col.columnTitle}
            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-3 py-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold leading-snug text-stone-900 dark:text-stone-50">{col.columnTitle}</h3>
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
      <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
        請在電腦瀏覽器完成此步驟效果最佳。若你曾清除瀏覽器資料或更換裝置，請登入後聯絡主辦方協助。
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
  return (
    <button
      type="button"
      disabled={disabled || busy || done}
      onClick={onPress}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm font-medium text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 dark:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {done ? (
        <>
          <span className="text-emerald-600">✓</span> 已開啟 {label}
        </>
      ) : busy ? (
        <>處理中…</>
      ) : (
        <>前往 {label}</>
      )}
    </button>
  );
}
