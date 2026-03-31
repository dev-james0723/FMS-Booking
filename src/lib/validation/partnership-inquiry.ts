import { z } from "zod";

export const partnershipFocusSchema = z.enum([
  "d-festival",
  "fantasia-music-space",
  "both",
]);

export const partnershipInquirySchema = z.object({
  focus: partnershipFocusSchema,
  organizationName: z.string().trim().min(1, "Required").max(200),
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  partnershipKind: z.string().trim().max(500).optional().nullable(),
  message: z.string().trim().min(1, "Required").max(8000),
  locale: z.enum(["zh-HK", "en"]).optional(),
});

export type PartnershipInquiryInput = z.infer<typeof partnershipInquirySchema>;
