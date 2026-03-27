import type { QuotaTier } from "@prisma/client";

export const REGISTRATION_PROFILE_KINDS = [
  "personal_user",
  "teaching_user",
  "teacher_referred_student",
  "dual_practice_and_teaching",
] as const;

export type RegistrationProfileKind = (typeof REGISTRATION_PROFILE_KINDS)[number];

export type DerivedRegistrationProfile = {
  categoryCode: "personal" | "teaching";
  individualEligible: boolean;
  teachingEligible: boolean;
  quotaTier: QuotaTier;
  teacherRecommended: boolean;
};

export function deriveRegistrationProfile(kind: RegistrationProfileKind): DerivedRegistrationProfile {
  switch (kind) {
    case "personal_user":
      return {
        categoryCode: "personal",
        individualEligible: true,
        teachingEligible: false,
        quotaTier: "individual",
        teacherRecommended: false,
      };
    case "teaching_user":
      return {
        categoryCode: "teaching",
        individualEligible: false,
        teachingEligible: true,
        quotaTier: "teaching",
        teacherRecommended: false,
      };
    case "teacher_referred_student":
      return {
        categoryCode: "personal",
        individualEligible: true,
        teachingEligible: false,
        quotaTier: "individual",
        teacherRecommended: true,
      };
    case "dual_practice_and_teaching":
      return {
        categoryCode: "teaching",
        individualEligible: true,
        teachingEligible: true,
        quotaTier: "teaching",
        teacherRecommended: false,
      };
    default: {
      const _x: never = kind;
      return _x;
    }
  }
}

export function registrationProfileKindFromSnapshot(
  payload: Record<string, unknown>
): RegistrationProfileKind | null {
  const k = payload.registrationProfileKind;
  if (typeof k === "string" && (REGISTRATION_PROFILE_KINDS as readonly string[]).includes(k)) {
    return k as RegistrationProfileKind;
  }
  const legacy = payload.userCategoryCode;
  if (legacy === "teaching") return "teaching_user";
  if (legacy === "personal") return "personal_user";
  return null;
}
