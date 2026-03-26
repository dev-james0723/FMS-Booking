"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  AVATAR_ANIMALS,
  AVATAR_ANIMAL_LABELS,
  type AvatarAnimal,
  fallbackAvatarDataUrl,
  isAvatarAnimal,
} from "@/lib/avatar-fallback";

type Props = {
  initialAnimal: string | null;
  initialImageDataUrl: string | null;
};

export function UserHubAvatarSection({ initialAnimal, initialImageDataUrl }: Props) {
  const [animal, setAnimal] = useState<string | null>(initialAnimal);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageDataUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const displayAnimal = isAvatarAnimal(animal) ? animal : null;
  const shownUrl =
    imageUrl ??
    (displayAnimal ? fallbackAvatarDataUrl(displayAnimal) : null);

  async function pick(a: AvatarAnimal) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(withBasePath("/api/v1/account/avatar"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animal: a }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const apiMsg =
        typeof data?.error?.message === "string" ? data.error.message : null;
      setMsg(apiMsg ?? "無法儲存選擇");
      return;
    }
    setAnimal(a);
    setImageUrl(
      typeof data.avatarImageDataUrl === "string" ? data.avatarImageDataUrl : null
    );
  }

  async function generate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(withBasePath("/api/v1/account/avatar/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const apiMsg =
        typeof data?.error?.message === "string" ? data.error.message : null;
      setMsg(apiMsg ?? "生成失敗");
      return;
    }
    if (typeof data.avatarImageDataUrl === "string") {
      setImageUrl(data.avatarImageDataUrl);
    }
    if (data.source === "fallback" || data.source === "fallback_no_api_key") {
      setMsg(
        data.source === "fallback_no_api_key"
          ? "未偵測到 GEMINI_API_KEY，已套用內建插畫。"
          : "AI 暫時未能使用，已自動換上備用插畫。"
      );
    } else {
      setMsg("頭像已更新！");
    }
  }

  async function applyBuiltinAvatar() {
    if (!displayAnimal) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(withBasePath("/api/v1/account/avatar"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animal: displayAnimal, useFallbackOnly: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data?.error?.message ?? "無法更新");
      return;
    }
    if (typeof data.avatarImageDataUrl === "string") {
      setImageUrl(data.avatarImageDataUrl);
    }
      setMsg("已固定使用內建插畫。");
  }

  return (
    <section className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6 shadow-sm">
      <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">頭像設定</h2>

      {!displayAnimal && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-violet-900">
            您平時最喜歡哪一種動物？（請選擇一項）
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AVATAR_ANIMALS.map((a) => (
              <button
                key={a}
                type="button"
                disabled={busy}
                onClick={() => void pick(a)}
                className="rounded-xl border-2 border-violet-200 bg-surface px-3 py-4 text-center text-sm font-semibold text-violet-950 shadow-sm transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-50"
              >
                {AVATAR_ANIMAL_LABELS[a]}
              </button>
            ))}
          </div>
        </div>
      )}

      {displayAnimal && (
        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg ring-2 ring-violet-200">
            {shownUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex w-full max-w-md flex-col gap-2">
            <p className="text-sm text-stone-700 dark:text-stone-300">
              已選：<span className="font-semibold">{AVATAR_ANIMAL_LABELS[displayAnimal]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void generate()}
                className="rounded-full bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-800 disabled:opacity-50"
              >
                {busy ? "處理中…" : "✨ AI 生成彈琴頭像"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void applyBuiltinAvatar()}
                className="rounded-full border border-violet-300 bg-surface px-4 py-2 text-sm text-violet-900 hover:bg-violet-50 disabled:opacity-50"
              >
                使用內建插畫
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              提示：設定 GEMINI_API_KEY 可啟用 Google Gemini 圖像生成；否則將自動以內建插畫代替。
            </p>
            <div className="flex flex-wrap gap-2 border-t border-violet-100 pt-3">
              <span className="w-full text-xs text-stone-500 dark:text-stone-500">欲更換動物？</span>
              {AVATAR_ANIMALS.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={busy || a === displayAnimal}
                  onClick={() => void pick(a)}
                  className="rounded-full border border-stone-200 dark:border-stone-700 bg-surface px-3 py-1 text-xs text-stone-700 dark:text-stone-300 hover:border-violet-400 disabled:opacity-40"
                >
                  {AVATAR_ANIMAL_LABELS[a]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{msg}</p>
      )}
    </section>
  );
}
