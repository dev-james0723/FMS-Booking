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

/**
 * Current session for public chrome (header, footer, home CTA). `undefined` while loading.
 */
export function useSiteMe(): {
  user: SiteMeUser | null | undefined;
  bookingHref: string;
} {
  const [user, setUser] = useState<SiteMeUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookingHref = user ? bookingHrefForUser(user) : "/booking";

  return { user, bookingHref };
}
