import { z } from "zod";

/** Allow common HK / intl. formats; dots and extensions often appear in contact numbers. */
const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(30)
  .regex(/^[0-9+\-\s().]+$/, "Invalid phone format");

const usagePurposesSchema = z.record(z.string(), z.union([z.boolean(), z.string()]));

export const registrationSchema = z
  .object({
    nameZh: z.string().trim().min(1).max(200),
    nameEn: z.string().trim().max(200).optional().nullable(),
    email: z.string().trim().email().max(320),
    phone: phoneSchema,
    /** Short-lived JWT from POST /api/v1/registration/phone/verify-code */
    phoneVerificationToken: z.string().min(20).max(2048),
    age: z.coerce.number().int().min(1).max(120),
    /** No longer collected in UI; stored as true for legacy column. */
    isAge17OrAbove: z.boolean().default(true),
    teacherRecommended: z.boolean(),
    teacherName: z.string().max(200).optional().nullable(),
    teacherContact: z.string().max(200).optional().nullable(),
    userCategoryCode: z.enum(["personal", "teaching"]),
    instrumentField: z.string().trim().min(1).max(200),
    identityFlags: z.array(z.string()).min(1),
    /** Required in UI when identity includes "other". */
    identityOtherText: z.string().max(500).optional().nullable(),
    /** Keys are purpose ids; values boolean or short text for "other". */
    usagePurposes: z.preprocess(
      (v) => (v === null || v === undefined ? {} : v),
      usagePurposesSchema.default({})
    ),
    preferredDates: z.array(z.string()).optional().nullable(),
    preferredTimeText: z.string().max(2000).optional().nullable(),
    extraNotes: z.string().max(5000).optional().nullable(),
    interestDfestival: z.boolean(),
    interestDmasters: z.boolean(),
    marketingOptIn: z.boolean(),
    socialFollowClaimed: z.boolean(),
    wantsAmbassador: z.boolean(),
    agreedTerms: z.literal(true),
    agreedPrivacy: z.literal(true),
    agreedEmailNotifications: z.boolean(),
    captchaToken: z.string().optional().nullable(),
    referralCode: z.string().max(64).optional().nullable(),
    /** JWT from POST /api/v1/registration/passkey/verify — required to complete registration. */
    passkeyPreregToken: z.string().trim().min(20).max(4096),
  })
  .superRefine((data, ctx) => {
    if (data.identityFlags.includes("other")) {
      const t = data.identityOtherText?.trim() ?? "";
      if (!t) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫「其他」身份說明",
          path: ["identityOtherText"],
        });
      }
    }
    if (data.teacherRecommended) {
      if (!data.teacherName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Teacher name required when teacher recommended",
          path: ["teacherName"],
        });
      }
      if (!data.teacherContact?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Teacher contact required when teacher recommended",
          path: ["teacherContact"],
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
