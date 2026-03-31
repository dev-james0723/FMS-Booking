"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandingRgbaImage } from "@/components/branding-rgba-image";
import { OFFICIAL_SITE_URL } from "@/lib/about-d-festival-env";
import { withBasePath } from "@/lib/base-path";
import {
  CONTACT_PHONE_E164,
  CONTACT_PUBLIC_EMAIL,
  CONTACT_WHATSAPP_URL,
  gmailComposeUrl,
} from "@/lib/contact-public";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getSocialFollowUrl } from "@/lib/social-follow";
import type { PartnershipInquiryInput } from "@/lib/validation/partnership-inquiry";

const contactLinkClass =
  "font-medium text-amber-700 underline decoration-amber-700/70 underline-offset-2 hover:text-amber-600 dark:text-amber-500 dark:decoration-amber-500/70 dark:hover:text-amber-400";

const socialBtnClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-300 bg-surface px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800";

/** Square tiles in a 2-col row; row `w-full` matches the primary CTA above. */
const dfSocialSquareClass =
  "flex aspect-square w-full min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-stone-300 bg-surface px-1 py-2 text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800 dark:focus-visible:outline-amber-500";

const cardClass =
  "rounded-2xl border border-stone-200 bg-surface p-6 shadow-sm dark:border-stone-700";

type FocusValue = PartnershipInquiryInput["focus"];

export function BusinessCollaborationPageMain() {
  const { t, locale } = useTranslation();
  const [focus, setFocus] = useState<FocusValue>("d-festival");
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partnershipKind, setPartnershipKind] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dfIg = getSocialFollowUrl("dfestival_ig");
  const dfFb = getSocialFollowUrl("dfestival_fb");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/public/partnership-inquiry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus,
          organizationName: organizationName.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          partnershipKind: partnershipKind.trim() || undefined,
          message: message.trim(),
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422) {
          setError(t("partnerships.errorValidation"));
        } else {
          setError(
            typeof data?.error?.message === "string"
              ? data.error.message
              : t("partnerships.errorSend"),
          );
        }
        setLoading(false);
        return;
      }
      setDone(true);
      setOrganizationName("");
      setName("");
      setEmail("");
      setPhone("");
      setPartnershipKind("");
      setMessage("");
    } catch {
      setError(t("partnerships.errorSend"));
    } finally {
      setLoading(false);
    }
  }

  const focusOptions: { value: FocusValue; label: string }[] = [
    { value: "d-festival", label: t("partnerships.focusDf") },
    { value: "fantasia-music-space", label: t("partnerships.focusFms") },
    { value: "both", label: t("partnerships.focusBoth") },
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
        {t("partnerships.title")}
      </h1>
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">{t("partnerships.intro")}</p>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        {t("partnerships.notBooking")}{" "}
        <Link
          href={withBasePath("/faq")}
          className={contactLinkClass}
        >
          {t("partnerships.faqLink")}
        </Link>
        {" · "}
        <Link
          href={withBasePath("/register")}
          className={contactLinkClass}
        >
          {t("partnerships.registerLink")}
        </Link>
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className={cardClass} aria-labelledby="partnerships-df-heading">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="partnerships-df-heading"
              className="min-w-0 flex-1 font-serif text-xl text-stone-900 dark:text-stone-50"
            >
              {t("partnerships.dfTitle")}
            </h2>
            <div className="shrink-0">
              <BrandingRgbaImage
                slug="d-festival-young-pianist"
                alt={t("partner.dfestivalAlt")}
                className="inline-flex h-10 w-auto max-w-[min(100%,9rem)] sm:h-11"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("partnerships.dfLead")}</p>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-stone-700 dark:text-stone-300">
            <li>{t("partnerships.dfP1")}</li>
            <li>{t("partnerships.dfP2")}</li>
            <li>{t("partnerships.dfP3")}</li>
            <li>{t("partnerships.dfP4")}</li>
            <li>{t("partnerships.dfP5")}</li>
          </ul>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href={OFFICIAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#1a3a5c] via-[#0f2844] to-[#0a1f36] px-4 py-3 text-center text-sm font-medium text-white shadow-sm ring-1 ring-white/10 transition hover:from-[#1e4268] hover:via-[#12304d] hover:to-[#0c2438] dark:ring-white/10`}
            >
              {t("partnerships.officialSite")}
            </a>
            <div
              className="grid w-full grid-cols-2 gap-2"
              role="group"
              aria-label={t("partnerships.dfSocialGroupAria")}
            >
              <a
                href={dfIg}
                target="_blank"
                rel="noopener noreferrer"
                className={dfSocialSquareClass}
                aria-label={t("partnerships.dfInstagram")}
              >
                <InstagramMark className="h-7 w-7 shrink-0" aria-hidden />
                <span className="text-center text-[10px] font-semibold leading-tight sm:text-xs">
                  {t("partnerships.dfInstagramShort")}
                </span>
              </a>
              <a
                href={dfFb}
                target="_blank"
                rel="noopener noreferrer"
                className={dfSocialSquareClass}
                aria-label={t("partnerships.dfFacebook")}
              >
                <FacebookMark className="h-7 w-7 shrink-0" aria-hidden />
                <span className="text-center text-[10px] font-semibold leading-tight sm:text-xs">
                  {t("partnerships.dfFacebookShort")}
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className={cardClass} aria-labelledby="partnerships-fms-heading">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="partnerships-fms-heading"
              className="min-w-0 flex-1 font-serif text-xl text-stone-900 dark:text-stone-50"
            >
              {t("partnerships.fmsTitle")}
            </h2>
            <div className="shrink-0">
              <BrandingRgbaImage
                slug="fantasia-music-space"
                alt={t("partner.fmsAlt")}
                className="inline-flex h-11 w-auto sm:h-12"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("partnerships.fmsLead")}</p>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-stone-700 dark:text-stone-300">
            <li>{t("partnerships.fmsP1")}</li>
            <li>{t("partnerships.fmsP2")}</li>
            <li>{t("partnerships.fmsP3")}</li>
            <li>{t("partnerships.fmsP4")}</li>
            <li>{t("partnerships.fmsP5")}</li>
          </ul>
          <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">{t("partnerships.fmsChannelsNote")}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {t("contact.phoneLabel")}
              </p>
              <a href={`tel:${CONTACT_PHONE_E164}`} className={`mt-1 inline-block ${contactLinkClass}`}>
                {t("contact.phoneDisplay")}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {t("contact.emailLabel")}
              </p>
              <a
                href={gmailComposeUrl(CONTACT_PUBLIC_EMAIL)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-1 inline-block break-all ${contactLinkClass}`}
              >
                {t("contact.emailDisplay")}
              </a>
            </div>
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={socialBtnClass}
            >
              {t("contact.whatsappButton")}
            </a>
          </div>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="partnerships-checklist-heading">
        <h2
          id="partnerships-checklist-heading"
          className="font-serif text-lg text-stone-900 dark:text-stone-50"
        >
          {t("partnerships.checklistTitle")}
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-400">
          <li>{t("partnerships.checklist1")}</li>
          <li>{t("partnerships.checklist2")}</li>
          <li>{t("partnerships.checklist3")}</li>
          <li>{t("partnerships.checklist4")}</li>
          <li>{t("partnerships.checklist5")}</li>
        </ul>
      </section>

      <h2 className="mt-12 font-serif text-xl text-stone-900 dark:text-stone-50">
        {t("partnerships.formTitle")}
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("partnerships.formIntro")}</p>

      {done ? (
        <div
          className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          <p>{t("partnerships.success")}</p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-emerald-50"
          >
            {t("partnerships.sendAnother")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-surface p-6 shadow-sm dark:border-stone-700"
        >
          {error && (
            <p className="text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <fieldset>
            <legend className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {t("partnerships.focusLabel")}
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {focusOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-stone-800 dark:text-stone-200"
                >
                  <input
                    type="radio"
                    name="focus"
                    value={opt.value}
                    checked={focus === opt.value}
                    onChange={() => setFocus(opt.value)}
                    className="h-4 w-4 border-stone-400 text-stone-900"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.orgLabel")}
            <input
              type="text"
              name="organizationName"
              required
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.nameLabel")}
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.emailLabel")}
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.phoneLabel")}
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.kindLabel")}
            <input
              type="text"
              name="partnershipKind"
              value={partnershipKind}
              onChange={(e) => setPartnershipKind(e.target.value)}
              placeholder={t("partnerships.kindPlaceholder")}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("partnerships.messageLabel")}
            <textarea
              name="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("partnerships.messagePlaceholder")}
              className="mt-1 w-full resize-y rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t("partnerships.privacyPrefix")}
            <Link href={withBasePath("/privacy")} className={contactLinkClass}>
              {t("partnerships.privacyLink")}
            </Link>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {loading ? t("partnerships.submitting") : t("partnerships.submit")}
          </button>
        </form>
      )}

      <p className="mt-10 text-sm text-stone-600 dark:text-stone-400">
        {t("partnerships.generalContactLead")}{" "}
        <Link href={withBasePath("/contact")} className={contactLinkClass}>
          {t("partnerships.contactLink")}
        </Link>
      </p>
    </main>
  );
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
