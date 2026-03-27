"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import {
  PENDING_REFERRAL_SESSION_KEY,
  ambassadorIntroStorageKey,
  isValidReferralCodeParam,
} from "@/lib/referral/constants";
import { ReferralAmbassadorDialog } from "@/components/referral-ambassador-dialog";

export function ReferralAmbassadorHost() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const raw = refParam?.trim().toLowerCase() ?? "";
    if (!isValidReferralCodeParam(raw)) return;

    try {
      sessionStorage.setItem(PENDING_REFERRAL_SESSION_KEY, raw);
    } catch {
      /* ignore */
    }

    let cancelled = false;

    (async () => {
      await fetch(withBasePath("/api/v1/referral/track"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code: raw }),
      }).catch(() => {});

      if (cancelled) return;

      try {
        if (typeof localStorage !== "undefined") {
          if (localStorage.getItem(ambassadorIntroStorageKey(raw))) return;
        }
      } catch {
        /* ignore */
      }

      const pres = await fetch(
        `${withBasePath("/api/v1/referral/preview")}?code=${encodeURIComponent(raw)}`,
        { credentials: "same-origin" }
      ).catch(() => null);

      if (cancelled || !pres?.ok) return;

      const data = (await pres.json().catch(() => null)) as { ambassadorNameZh?: string } | null;
      const nm = typeof data?.ambassadorNameZh === "string" ? data.ambassadorNameZh.trim() : "";
      if (!nm) return;

      setCode(raw);
      setName(nm);
      setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, refParam]);

  if (!open || !code || !name) return null;

  return (
    <ReferralAmbassadorDialog
      ambassadorNameZh={name}
      onClose={() => {
        try {
          localStorage.setItem(ambassadorIntroStorageKey(code), "1");
        } catch {
          /* ignore */
        }
        setOpen(false);
      }}
    />
  );
}
