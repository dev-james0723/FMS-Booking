"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";

export type SiteMeUser = {
  email: string;
  bookingVenueKind?: string;
};

export function bookingHrefForUser(user: SiteMeUser | null): string {
  return user?.bookingVenueKind === "open_space" ? "/booking/open-space" : "/booking";
}

/** Label for logged-in “go book” nav: studio channel vs large-instrument / open-space channel. */
export function bookingNavEntryLabel(
  user: SiteMeUser,
  t: (key: string) => string,
): string {
  return user.bookingVenueKind === "open_space"
    ? t("nav.bookOpenSpaceSlots")
    : t("nav.bookPianoStudioSlots");
}

/**
 * Current session for public chrome (header, footer, home CTA).
 * Before the client `/api/v1/me` request finishes, `user` is always `null` so SSR and
 * the first client render match (avoids hydration mismatches on auth-dependent UI).
 */
export function useSiteMe(): {
  user: SiteMeUser | null;
  bookingHref: string;
} {
  const [user, setUser] = useState<SiteMeUser | null>(null);
  const [meReady, setMeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(withBasePath("/api/v1/me"), { credentials: "same-origin" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const u = data?.user as { email?: string; bookingVenueKind?: string } | undefined;
          if (u?.email) {
            setUser({ email: u.email, bookingVenueKind: u.bookingVenueKind });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setMeReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveUser = meReady ? user : null;
  const bookingHref = effectiveUser ? bookingHrefForUser(effectiveUser) : "/booking";

  return { user: effectiveUser, bookingHref };
}
