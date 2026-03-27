"use client";

import { RegistrationForm } from "@/components/registration-form";
import { useTranslation } from "@/lib/i18n/use-translation";

export function RegisterPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("registerPage.title")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-stone-600 dark:text-stone-400">{t("registerPage.intro")}</p>
      <div className="mt-10">
        <RegistrationForm />
      </div>
    </main>
  );
}
