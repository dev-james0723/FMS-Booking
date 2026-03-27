export const OFFICIAL_SITE_URL = "https://d-festival.org";

export function dFestivalElfsightClassFromEnv(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_ELFSIGHT_D_FESTIVAL_WIDGET_CLASS?.trim() ?? "";
  return raw && /^elfsight-app-[a-z0-9-]+$/i.test(raw) ? raw : null;
}
