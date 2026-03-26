/** Mirrors registration-form IDENTITY_OPTIONS for admin / email display. */
const IDENTITY_ZH: Record<string, string> = {
  student: "學生",
  performer: "個人演奏者",
  freelancer: "自由工作者",
  private_teacher: "私人老師",
  music_tutor: "音樂導師",
  other: "其他",
};

export function identityFlagsToZh(flags: unknown): string[] {
  if (!Array.isArray(flags)) return [];
  return flags
    .filter((x): x is string => typeof x === "string")
    .map((v) => IDENTITY_ZH[v] ?? v);
}

export function userCategoryLabelZh(code: string | null | undefined): string {
  if (code === "teaching") return "教學／帶學生使用者";
  if (code === "personal") return "一般個人使用者";
  return code ?? "—";
}
