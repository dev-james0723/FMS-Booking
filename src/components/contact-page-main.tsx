"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getSocialFollowUrl } from "@/lib/social-follow";

const PHONE_E164 = "+85291636378";
const PUBLIC_EMAIL = "fantasiamusicspace@gmail.com";
const WHATSAPP_SHORTCUT_URL = "https://wa.link/y4ody9";

const contactLinkClass =
  "font-medium text-amber-700 underline decoration-amber-700/70 underline-offset-2 hover:text-amber-600 dark:text-amber-500 dark:decoration-amber-500/70 dark:hover:text-amber-400";

const socialBtnClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-300 bg-surface px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800";

function gmailComposeUrl(to: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
}

export function ContactPageMain() {
  const { t, locale } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const igUrl = getSocialFollowUrl("fantasia_space_ig");
  const fbUrl = getSocialFollowUrl("fantasia_space_fb");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/public/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim(),
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 422) {
          setError(t("contact.errorValidation"));
        } else {
          setError(
            typeof data?.error?.message === "string"
              ? data.error.message
              : t("contact.errorSend"),
          );
        }
        setLoading(false);
        return;
      }
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setError(t("contact.errorSend"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
        {t("contact.title")}
      </h1>
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">{t("contact.intro")}</p>

      <section
        className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-surface p-6 shadow-sm dark:border-stone-700"
        aria-label={t("contact.title")}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t("contact.phoneLabel")}
          </p>
          <a
            href={`tel:${PHONE_E164}`}
            className={`mt-1 inline-block text-lg ${contactLinkClass}`}
            aria-label={t("contact.phoneAria")}
          >
            {t("contact.phoneDisplay")}
          </a>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t("contact.emailLabel")}
          </p>
          <a
            href={gmailComposeUrl(PUBLIC_EMAIL)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-block text-lg break-all ${contactLinkClass}`}
            aria-label={t("contact.emailAria")}
          >
            {t("contact.emailDisplay")}
          </a>
        </div>
      </section>

      <h2 className="mt-10 font-serif text-xl text-stone-900 dark:text-stone-50">
        {t("contact.formSectionTitle")}
      </h2>

      {done ? (
        <div
          className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          <p>{t("contact.success")}</p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-emerald-50"
          >
            {t("contact.sendAnother")}
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
          <label className="block text-sm text-stone-800 dark:text-stone-200">
            {t("contact.nameLabel")}
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
            {t("contact.emailFieldLabel")}
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
            {t("contact.phoneFieldLabel")}
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
            {t("contact.messageLabel")}
            <textarea
              name="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("contact.messagePlaceholder")}
              className="mt-1 w-full resize-y rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {loading ? t("contact.submitting") : t("contact.submit")}
          </button>
        </form>
      )}

      <section className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-700">
        <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
          {t("contact.socialTitle")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={WHATSAPP_SHORTCUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={socialBtnClass}
            aria-label={t("contact.whatsappAria")}
          >
            {t("contact.whatsappButton")}
          </a>
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={socialBtnClass}
            aria-label={t("contact.instagramAria")}
          >
            {t("contact.instagramButton")}
          </a>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={socialBtnClass}
            aria-label={t("contact.facebookAria")}
          >
            {t("contact.facebookButton")}
          </a>
        </div>
      </section>
    </main>
  );
}
