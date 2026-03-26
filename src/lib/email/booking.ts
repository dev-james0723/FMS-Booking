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
  const subject = "已收到你的預約申請｜D Festival × 幻樂空間";
  const body = [
    `${params.userName} 你好，`,
    ``,
    `我們已收到你的預約申請（參考編號：${params.requestId}），共 ${params.slotCount} 節時段。`,
    `所有申請均需由主辦方審核，並非自動確認。`,
    `你可登入帳戶查看狀態：${APP_URL}/booking/history`,
    ``,
    `多謝你對活動的支持。`,
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
