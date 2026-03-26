import type { Prisma } from "@prisma/client";

export type UserForBookingTier = {
  category: { code: string } | null;
  profile: { identityFlags: Prisma.JsonValue } | null;
};

/** 教學類別，或身份包含學生／導師相關標籤 → 使用較鬆的節數上限（與 teaching_* 設定掛鈎）。 */
export function userHasExtendedBookingTier(user: UserForBookingTier): boolean {
  if (user.category?.code === "teaching") return true;
  const flags = user.profile?.identityFlags;
  if (!Array.isArray(flags)) return false;
  const elevated = new Set(["student", "private_teacher", "music_tutor"]);
  return flags.some((f) => typeof f === "string" && elevated.has(f));
}
