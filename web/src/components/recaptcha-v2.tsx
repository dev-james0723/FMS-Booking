"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId: number) => void;
    };
  }
}

export type RecaptchaV2Handle = {
  reset: () => void;
};

type Props = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

export const RecaptchaV2 = forwardRef<RecaptchaV2Handle, Props>(
  function RecaptchaV2({ siteKey, onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const onTokenChangeRef = useRef(onTokenChange);

    useEffect(() => {
      onTokenChangeRef.current = onTokenChange;
    }, [onTokenChange]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current != null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        onTokenChangeRef.current(null);
      },
    }));

    useEffect(() => {
      if (!siteKey || !containerRef.current) return;

      let cancelled = false;

      const mountWidget = () => {
        if (cancelled || !containerRef.current || widgetIdRef.current != null) return;
        window.grecaptcha!.ready(() => {
          if (cancelled || !containerRef.current || widgetIdRef.current != null) return;
          containerRef.current.innerHTML = "";
          widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onTokenChangeRef.current(token),
            "expired-callback": () => onTokenChangeRef.current(null),
            "error-callback": () => onTokenChangeRef.current(null),
          });
        });
      };

      const cleanupDom = () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        widgetIdRef.current = null;
      };

      if (window.grecaptcha?.ready) {
        mountWidget();
        return () => {
          cancelled = true;
          cleanupDom();
        };
      } else {
        const src = "https://www.google.com/recaptcha/api.js";
        let script = document.querySelector<HTMLScriptElement>(
          `script[src="${src}"]`
        );
        if (!script) {
          script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
        script.addEventListener("load", mountWidget);
        return () => {
          cancelled = true;
          script?.removeEventListener("load", mountWidget);
          cleanupDom();
        };
      }
    }, [siteKey]);

    if (!siteKey) return null;

    return <div ref={containerRef} className="min-h-[78px]" />;
  }
);
