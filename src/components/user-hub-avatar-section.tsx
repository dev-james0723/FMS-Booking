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
  const [pickerOpen, setPickerOpen] = useState(!isAvatarAnimal(initialAnimal));

  const displayAnimal = isAvatarAnimal(animal) ? animal : null;
  const shownUrl =
    imageUrl ??
    (displayAnimal ? fallbackAvatarDataUrl(displayAnimal) : null);

  async function selectAnimalAndGenerate(a: AvatarAnimal) {
    setBusy(true);
    setMsg(null);
    const patchRes = await fetch(withBasePath("/api/v1/account/avatar"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animal: a }),
    });
    const patchData = await patchRes.json().catch(() => ({}));
    if (!patchRes.ok) {
      setBusy(false);
      const apiMsg =
        typeof patchData?.error?.message === "string"
          ? patchData.error.message
          : null;
      setMsg(apiMsg ?? "無法儲存選擇");
      return;
    }

    setAnimal(a);
    setImageUrl(fallbackAvatarDataUrl(a));

    const genRes = await fetch(withBasePath("/api/v1/account/avatar/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animal: a }),
    });
    const genData = await genRes.json().catch(() => ({}));
    setBusy(false);

    if (!genRes.ok) {
      const apiMsg =
        typeof genData?.error?.message === "string" ? genData.error.message : null;
      setMsg(apiMsg ?? "生成失敗");
      return;
    }
    if (typeof genData.avatarImageDataUrl === "string") {
      setImageUrl(genData.avatarImageDataUrl);
    }
    if (genData.source === "fallback" || genData.source === "fallback_no_api_key") {
      setMsg("圖像暫未能自動生成，已顯示預設插畫。");
    } else {
      setMsg(null);
    }
    setPickerOpen(false);
  }

  const showPicker = !displayAnimal || pickerOpen;

  return (
    <section className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6 shadow-sm">
      <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">頭像設定</h2>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg ring-2 ring-violet-200">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/35 text-sm font-medium text-white backdrop-blur-[2px]">
              處理中…
            </div>
          ) : null}
        </div>

        {displayAnimal ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen((o) => !o)}
            className="rounded-full bg-violet-700 px-6 py-2 text-sm font-medium text-white shadow hover:bg-violet-800 disabled:opacity-50"
          >
            更換動物
          </button>
        ) : null}

        {showPicker ? (
          <div className="grid w-full max-w-xs grid-cols-4 gap-2">
            {AVATAR_ANIMALS.map((a) => (
              <button
                key={a}
                type="button"
                disabled={busy}
                onClick={() => void selectAnimalAndGenerate(a)}
                className="aspect-square overflow-hidden rounded-xl border-2 border-violet-200 bg-surface shadow-sm transition hover:border-violet-500 hover:ring-2 hover:ring-violet-200 disabled:opacity-50"
                aria-label={`選擇${AVATAR_ANIMAL_LABELS[a]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fallbackAvatarDataUrl(a)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {msg && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{msg}</p>
      )}
    </section>
  );
}
