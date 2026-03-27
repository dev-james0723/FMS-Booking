import { z } from "zod";
import { REGISTRATION_PROFILE_KINDS } from "@/lib/registration/profile-kind";

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
    /**
     * Registration / profile classification (not a third booking-identity enum).
     * Booking quota uses the derived account `quota_tier` only.
     */
    registrationProfileKind: z.enum(REGISTRATION_PROFILE_KINDS),
    teacherName: z.string().max(200).optional().nullable(),
    teacherContact: z.string().max(200).optional().nullable(),
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
    socialFollowClaimed: z
      .boolean()
      .refine((v) => v === true, { message: "請勾選承諾追蹤指定社交媒體帳號" }),
    socialRepostClaimed: z
      .boolean()
      .refine((v) => v === true, { message: "請勾選承諾轉發指定貼文並標註官方帳號" }),
    wantsAmbassador: z.boolean(),
    agreedTerms: z
      .boolean()
      .refine((v) => v === true, { message: "請勾選同意條款與細則" }),
    agreedPrivacy: z
      .boolean()
      .refine((v) => v === true, { message: "請勾選同意私隱條例" }),
    agreedEmailNotifications: z
      .boolean()
      .refine((v) => v === true, { message: "請勾選同意透過 Email 收取系統通知" }),
    referralCode: z.string().max(64).optional().nullable(),
    /** JWT from POST /api/v1/registration/passkey/verify — required to complete registration. */
    passkeyPreregToken: z.string().trim().min(20).max(4096),
    /** Set via `?for=open-space` for 大型樂器開放空間登記。 */
    bookingVenueKind: z.enum(["studio_room", "open_space"]).default("studio_room"),
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
    if (data.registrationProfileKind === "teacher_referred_student") {
      if (!data.teacherName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫推薦老師姓名",
          path: ["teacherName"],
        });
      }
      if (!data.teacherContact?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫推薦老師聯絡方式",
          path: ["teacherContact"],
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
