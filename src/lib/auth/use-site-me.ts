"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

const SiteMeServerUserContext = createContext<SiteMeUser | null | undefined>(undefined);

export function SiteMeProvider({
  initialUser,
  children,
}: {
  initialUser: SiteMeUser | null;
  children: ReactNode;
}) {
  return createElement(
    SiteMeServerUserContext.Provider,
    { value: initialUser },
    children,
  );
}

/**
 * Current session for public chrome (header, footer, home CTA).
 * Uses the server-verified session snapshot until `/api/v1/me` returns so logged-in users
 * never briefly see the logged-out login buttons after redirect.
 */
export function useSiteMe(): {
  user: SiteMeUser | null;
  bookingHref: string;
} {
  const serverUser = useContext(SiteMeServerUserContext);
  const [clientUser, setClientUser] = useState<SiteMeUser | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

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
            setClientUser({ email: u.email, bookingVenueKind: u.bookingVenueKind });
          } else {
            setClientUser(null);
          }
        } else {
          setClientUser(null);
        }
      } catch {
        if (!cancelled) setClientUser(null);
      } finally {
        if (!cancelled) setFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = fetchDone
    ? (clientUser ?? null)
    : serverUser !== undefined
      ? serverUser
      : null;
  const bookingHref = user ? bookingHrefForUser(user) : "/booking";

  return { user, bookingHref };
}
