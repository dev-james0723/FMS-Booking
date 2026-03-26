import { logEmail } from "@/lib/email/log";
import { EmailLogStatus } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendBookingApproved(params: {
  userId: string;
  toEmail: string;
  userName: string;
  requestId: string;
  slotLines: string[];
}): Promise<void> {
  const subject = "預約申請已獲批核｜D Festival × 幻樂空間";
  const body = [
    `${params.userName} 你好，`,
    ``,
    `你的預約申請（${params.requestId.slice(0, 8)}…）已獲批核。時段如下：`,
    ...params.slotLines.map((l) => `· ${l}`),
    ``,
    `詳情及注意事項請登入查看：${APP_URL}/booking/history`,
  ].join("\n");

  if (process.env.NODE_ENV === "development") {
    console.info("[email:booking_approved]\n", body);
  }

  await logEmail({
    userId: params.userId,
    templateKey: "booking_approved",
    toEmail: params.toEmail,
    subject,
    payload: { requestId: params.requestId },
    status: EmailLogStatus.sent,
  });
}

export async function sendBookingRejected(params: {
  userId: string;
  toEmail: string;
  userName: string;
  requestId: string;
  note?: string | null;
}): Promise<void> {
  const subject = "預約申請未能安排｜D Festival × 幻樂空間";
  const body = [
    `${params.userName} 你好，`,
    ``,
    `很抱歉，你的預約申請（${params.requestId.slice(0, 8)}…）未能安排。`,
    params.note ? `說明：${params.note}` : "",
    ``,
    `如有查詢請聯絡主辦方。你亦可登入查看紀錄：${APP_URL}/booking/history`,
  ]
    .filter(Boolean)
    .join("\n");

  if (process.env.NODE_ENV === "development") {
    console.info("[email:booking_rejected]\n", body);
  }

  await logEmail({
    userId: params.userId,
    templateKey: "booking_rejected",
    toEmail: params.toEmail,
    subject,
    payload: { requestId: params.requestId },
    status: EmailLogStatus.sent,
  });
}
