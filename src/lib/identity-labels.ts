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

const REG_PROFILE_ZH: Record<string, string> = {
  personal_user: "個人使用者",
  teaching_user: "教學／帶學生使用者",
  teacher_referred_student: "老師推薦之學生",
  dual_practice_and_teaching: "個人使用者及教學／帶學生（同時有教學及練習需求）",
};

export function registrationProfileKindLabelZh(kind: string | null | undefined): string {
  if (!kind) return "—";
  return REG_PROFILE_ZH[kind] ?? kind;
}

export function quotaTierLabelZh(tier: string | null | undefined): string {
  if (tier === "teaching") return "教學配額級別";
  if (tier === "individual") return "個人配額級別";
  return tier ?? "—";
}

export function bookingIdentityTypeLabelZh(t: string | null | undefined): string {
  if (t === "teaching_or_with_students") return "教學／帶學生";
  if (t === "individual") return "個人練習";
  return t ?? "—";
}

export function bookingIdentityTypeLabelEn(t: string | null | undefined): string {
  if (t === "teaching_or_with_students") return "Teaching / with students";
  if (t === "individual") return "Individual (practice)";
  return t ?? "—";
}
