import { z } from "zod";

export const contactInquirySchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().min(1, "Required").max(8000),
  locale: z.enum(["zh-HK", "en"]).optional(),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
