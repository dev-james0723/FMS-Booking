import { logEmail } from "@/lib/email/log";
import { EmailLogStatus } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendBookingSubmitted(params: {
  userId: string;
  toEmail: string;
  userName: string;
  requestId: string;
  slotCount: number;
}): Promise<void> {
  const subject = "已收到您的預約｜D Festival × 幻樂空間";
  const body = [
    `${params.userName} 您好，`,
    ``,
    `我們已收到您的預約（參考編號：${params.requestId}），共 ${params.slotCount} 節時段。`,
    `所有預約均需由主辦方審核，並非自動確認。`,
    `您可登入帳戶查看狀態：${APP_URL}/booking/history`,
    ``,
    `感謝您對活動的支持。`,
  ].join("\n");

  if (process.env.NODE_ENV === "development") {
    console.info("[email:booking_submitted]\n", body);
  }

  await logEmail({
    userId: params.userId,
    templateKey: "booking_submitted",
    toEmail: params.toEmail,
    subject,
    payload: { requestId: params.requestId, slotCount: params.slotCount },
    status: EmailLogStatus.sent,
  });
}
