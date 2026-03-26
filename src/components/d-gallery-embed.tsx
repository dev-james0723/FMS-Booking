"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * D-Gallery runs as a same-origin iframe so the original embed script can execute unchanged.
 * Height follows content (incl. “Fill More”) via ResizeObserver on the iframe document body.
 */
export function DGalleryEmbed({
  showPageFillMore = false,
}: {
  /** Renders a host-page “Fill More” control that triggers the iframe’s load-more action. */
  showPageFillMore?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const detachResizeObserver = useCallback(() => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
  }, []);

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      const root = doc?.documentElement;
      if (!root) return;
      const h = Math.max(root.scrollHeight, 400);
      iframe.style.height = `${h}px`;
    } catch {
      /* ignore */
    }
  }, []);

  const onIframeLoad = useCallback(() => {
    detachResizeObserver();
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!body) return;
      syncIframeHeight();
      const ro = new ResizeObserver(() => syncIframeHeight());
      resizeObserverRef.current = ro;
      ro.observe(body);
    } catch {
      syncIframeHeight();
    }
  }, [detachResizeObserver, syncIframeHeight]);

  useEffect(() => () => detachResizeObserver(), [detachResizeObserver]);

  const triggerIframeFillMore = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      iframe.contentDocument?.getElementById("dgViewMore")?.click();
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        src="/d-gallery-widget.html"
        title="D-Gallery 圖片庫"
        className="mx-auto block w-full max-w-[1100px] border-0 bg-transparent"
        style={{ minHeight: 480 }}
        onLoad={onIframeLoad}
      />
      {showPageFillMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={triggerIframeFillMore}
            className="rounded-full border border-white/25 bg-white/5 px-8 py-2.5 text-sm font-medium tracking-wide text-white/95 shadow-sm backdrop-blur-sm transition hover:border-[#c9a227]/60 hover:bg-white/10 hover:text-white"
          >
            Fill More
          </button>
        </div>
      ) : null}
    </div>
  );
}
