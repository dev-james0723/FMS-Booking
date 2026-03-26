"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const BGM_SRC =
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/69487b9fc2b44a8b69cb031b_claireeee.mp3";

export function FestivalBackgroundMusic() {
  const uid = useId().replace(/:/g, "");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;

    let cancelled = false;
    void (async () => {
      try {
        await audio.play();
      } catch {
        if (cancelled) return;
        setMuted(true);
        try {
          await audio.play();
        } catch {
          /* ignore */
        }
      }
    })();

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  useEffect(() => {
    const nudge = async () => {
      const audio = audioRef.current;
      if (!audio?.paused) return;
      try {
        await audio.play();
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("pointerdown", nudge, { once: true });
    document.addEventListener("touchstart", nudge, { once: true });
    document.addEventListener("keydown", nudge, { once: true });
    return () => {
      document.removeEventListener("pointerdown", nudge);
      document.removeEventListener("touchstart", nudge);
      document.removeEventListener("keydown", nudge);
    };
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    audio.muted = next;
    if (!next) {
      try {
        await audio.play();
      } catch {
        /* ignore */
      }
    }
  }, [muted]);

  return (
    <>
      <audio
        id={`fs-bgm-audio-${uid}`}
        ref={audioRef}
        src={BGM_SRC}
        loop
        preload="auto"
        playsInline
        muted={muted}
      />
      <button
        id={`fs-bgm-toggle-${uid}`}
        type="button"
        aria-label={muted ? "開啟背景音樂" : "關閉背景音樂"}
        title={muted ? "開啟" : "關閉"}
        data-muted={String(muted)}
        className="fs-bgm-toggle fixed bottom-3 left-3 z-[99999] inline-flex h-10 w-10 max-[420px]:bottom-3 max-[420px]:left-3 cursor-pointer select-none items-center justify-center rounded-full border border-white/20 bg-[rgba(15,15,18,0.55)] p-0 shadow-[0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur-[10px] transition hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-[3px] focus:ring-white/20 min-[421px]:bottom-4 min-[421px]:left-4 min-[421px]:h-11 min-[421px]:w-11"
        onClick={() => void toggle()}
      >
        <span
          className="fs-bgm-icon inline-block h-[18px] w-[18px] bg-contain bg-center bg-no-repeat min-[421px]:h-5 min-[421px]:w-5"
          style={{
            backgroundImage: muted
              ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M11 5L6.5 9H3v6h3.5L11 19V5Z' stroke='%23ffffff' stroke-width='1.8' stroke-linejoin='round'/%3E%3Cpath d='M15 9l6 6' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M21 9l-6 6' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")`
              : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M11 5L6.5 9H3v6h3.5L11 19V5Z' stroke='%23ffffff' stroke-width='1.8' stroke-linejoin='round'/%3E%3Cpath d='M15.5 8.5c1 .9 1.5 2.1 1.5 3.5s-.5 2.6-1.5 3.5' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M18.5 6c1.9 1.7 3 3.8 3 6s-1.1 4.3-3 6' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
      </button>
    </>
  );
}
