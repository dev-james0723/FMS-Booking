"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  BRANDING_RGBA_ASSETS,
  type BrandingRgbaSlug,
} from "@/lib/branding/rgba-assets";

type Props = {
  slug: BrandingRgbaSlug;
  /** Empty string = decorative (hidden from assistive tech). */
  alt: string;
  className?: string;
  priority?: boolean;
};

const MAX_DPR = 3;

/**
 * Renders branding from raw RGBA in `public/branding` via canvas (no PNG/WebP on disk).
 * Paints at device pixel ratio so downscaling stays sharp on HiDPI screens.
 */
export function BrandingRgbaImage({ slug, alt, className, priority }: Props) {
  const meta = BRANDING_RGBA_ASSETS[slug];
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const decorative = alt === "";

  useEffect(() => {
    const ac = new AbortController();
    sourceRef.current = null;

    const url = withBasePath(`/branding/${meta.file}`);
    const init: RequestInit = { signal: ac.signal };
    if (priority) {
      Object.assign(init, { priority: "high" as const });
    }

    fetch(url, init)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (ac.signal.aborted) return;
        const expected = meta.width * meta.height * 4;
        if (buf.byteLength !== expected) {
          throw new Error(`expected ${expected} bytes, got ${buf.byteLength}`);
        }
        const off = document.createElement("canvas");
        off.width = meta.width;
        off.height = meta.height;
        const sctx = off.getContext("2d");
        if (!sctx) throw new Error("no 2d context");
        const data = new Uint8ClampedArray(buf, 0, expected);
        sctx.putImageData(
          new ImageData(data, meta.width, meta.height),
          0,
          0,
        );
        sourceRef.current = off;
        if (!ac.signal.aborted) setReady(true);
      })
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });

    return () => ac.abort();
  }, [meta, priority, slug]);

  useLayoutEffect(() => {
    if (!ready) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
      return;
    }

    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!wrapper || !canvas || !source) return;

    const paint = () => {
      const w = Math.max(1, Math.round(wrapper.clientWidth));
      const h = Math.max(1, Math.round(wrapper.clientHeight));
      if (w < 1 || h < 1) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const bw = Math.max(1, Math.round(w * dpr));
      const bh = Math.max(1, Math.round(h * dpr));

      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, bw, bh);
      ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, bw, bh);
    };

    paint();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(paint);
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [ready, slug]);

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={{ aspectRatio: `${meta.width} / ${meta.height}` }}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? true : undefined}
    >
      {!failed ? (
        <canvas
          ref={canvasRef}
          className="block h-full w-full max-h-full max-w-full bg-transparent object-contain"
          aria-hidden
        />
      ) : null}
      {failed && !decorative ? (
        <span className="sr-only">{alt}</span>
      ) : null}
    </span>
  );
}
