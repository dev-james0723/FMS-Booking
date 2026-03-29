import { EmailLogStatus, type CameraRentalPaymentChoice } from "@prisma/client";
import { Resend } from "resend";
import type { Locale } from "@/lib/i18n/types";
import { buildBookingSubmittedMail } from "@/lib/email/booking-submitted-mail";
import { logEmail } from "@/lib/email/log";

export async function sendBookingSubmitted(params: {
  userId: string;
  toEmail: string;
  greetingName: string;
  requestId: string;
  slotCount: number;
  slots: { startsAt: Date; endsAt: Date }[];
  locale: Locale;
  cameraRentalOptIn: boolean;
  cameraRentalPaymentChoice: CameraRentalPaymentChoice | null;
}): Promise<void> {
  const { subject, text, html } = buildBookingSubmittedMail(params.locale, {
    greetingName: params.greetingName,
    requestId: params.requestId,
    slotCount: params.slotCount,
    slots: params.slots,
    cameraRentalOptIn: params.cameraRentalOptIn,
    cameraRentalPaymentChoice: params.cameraRentalPaymentChoice,
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[email:booking_submitted]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    await logEmail({
      userId: params.userId,
      templateKey: "booking_submitted",
      toEmail: params.toEmail,
      subject,
      payload: {
        requestId: params.requestId,
        slotCount: params.slotCount,
        locale: params.locale,
        cameraRentalOptIn: params.cameraRentalOptIn,
        cameraRentalPaymentChoice: params.cameraRentalPaymentChoice,
        channel: "none",
      },
      status: EmailLogStatus.failed,
      error:
        "RESEND_API_KEY 未設定；預約確認電郵未寄出（開發時請查看終端機 log）。",
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject,
      text,
      html,
    });

    if (error) {
      const msg = error.message ?? JSON.stringify(error);
      await logEmail({
        userId: params.userId,
        templateKey: "booking_submitted",
        toEmail: params.toEmail,
        subject,
        payload: {
          requestId: params.requestId,
          slotCount: params.slotCount,
          locale: params.locale,
          cameraRentalOptIn: params.cameraRentalOptIn,
          cameraRentalPaymentChoice: params.cameraRentalPaymentChoice,
          channel: "resend",
        },
        status: EmailLogStatus.failed,
        error: msg,
      });
      return;
    }

    await logEmail({
      userId: params.userId,
      templateKey: "booking_submitted",
      toEmail: params.toEmail,
      subject,
      payload: {
        requestId: params.requestId,
        slotCount: params.slotCount,
        locale: params.locale,
        cameraRentalOptIn: params.cameraRentalOptIn,
        cameraRentalPaymentChoice: params.cameraRentalPaymentChoice,
        channel: "resend",
      },
      status: EmailLogStatus.sent,
      providerMessageId: data?.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEmail({
      userId: params.userId,
      templateKey: "booking_submitted",
      toEmail: params.toEmail,
      subject,
      payload: {
        requestId: params.requestId,
        slotCount: params.slotCount,
        locale: params.locale,
        cameraRentalOptIn: params.cameraRentalOptIn,
        cameraRentalPaymentChoice: params.cameraRentalPaymentChoice,
        channel: "resend",
      },
      status: EmailLogStatus.failed,
      error: msg,
    });
  }
}
