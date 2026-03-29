"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
 * Uses the server-verified session snapshot while `/api/v1/me` is (re)loading for the
 * current route so the first paint matches SSR, then prefers the API result.
 *
 * Refetches on every pathname change because client navigations (e.g. login → /booking)
 * do not remount the provider: a one-time fetch would keep stale `null` after sign-in
 * until a full page reload.
 */
export function useSiteMe(): {
  user: SiteMeUser | null;
  bookingHref: string;
} {
  const serverUser = useContext(SiteMeServerUserContext);
  const pathname = usePathname();
  /** `undefined` = not yet resolved for this pathname; fall back to `serverUser`. */
  const [clientUser, setClientUser] = useState<SiteMeUser | null | undefined>(undefined);

  useLayoutEffect(() => {
    setClientUser(undefined);
  }, [pathname]);

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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const user =
    clientUser !== undefined
      ? clientUser
      : serverUser !== undefined
        ? serverUser
        : null;
  const bookingHref = user ? bookingHrefForUser(user) : "/booking";

  return { user, bookingHref };
}
