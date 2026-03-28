"use client";

import Link from "next/link";
import { useSiteMe } from "@/lib/auth/use-site-me";
import { useTranslation } from "@/lib/i18n/use-translation";

const linkClass =
  "text-stone-900 underline decoration-stone-400 underline-offset-2 dark:text-stone-50";

function Sep() {
  return (
    <span className="text-stone-400" aria-hidden>
      ·
    </span>
  );
}

/** FAQ footer row: register, booking entry (login pair or book slots when signed in), home. */
export function FaqAuthInlineLinks() {
  const { t } = useTranslation();
  const { user: meUser, bookingHref } = useSiteMe();

  return (
    <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      <Link href="/register" className={linkClass}>
        {t("nav.registerCta")}
      </Link>
      <Sep />
      {meUser ? (
        <Link href={bookingHref} className={linkClass}>
          {t("nav.bookingSlots")}
        </Link>
      ) : (
        <>
          <Link href="/login?next=/booking" className={linkClass}>
            {t("nav.loginBookingPianoStudio")}
          </Link>
          <Sep />
          <Link href="/login?next=/booking/open-space" className={linkClass}>
            {t("nav.loginBookingOpenSpace")}
          </Link>
        </>
      )}
      <Sep />
      <Link href="/" className={linkClass}>
        {t("footer.home")}
      </Link>
    </p>
  );
}
