import { prisma } from "@/lib/prisma";
import { EmailLogStatus, Prisma } from "@prisma/client";

export async function logEmail(params: {
  userId?: string;
  templateKey: string;
  toEmail: string;
  subject: string;
  payload?: Record<string, unknown>;
  status?: EmailLogStatus;
  error?: string;
  providerMessageId?: string;
}): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        userId: params.userId,
        templateKey: params.templateKey,
        toEmail: params.toEmail.toLowerCase(),
        subject: params.subject,
        payload: (params.payload ?? undefined) as Prisma.InputJsonValue | undefined,
        status: params.status ?? EmailLogStatus.sent,
        error: params.error,
        providerMessageId: params.providerMessageId,
      },
    });
  } catch (e) {
    console.error("[email:log] failed to persist email_logs row", e);
  }
}
