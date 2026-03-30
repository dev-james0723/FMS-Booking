import { prisma } from "@/lib/prisma";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { z } from "zod";

const emailSchema = z.string().email();

export type UserForPasswordReset = {
  id: string;
  email: string;
  phoneNorm: string;
  accountStatus: "active" | "inactive" | "suspended";
  hasCredentials: boolean;
};

/**
 * Login name is email, or user can identify by bound phone (E.164).
 */
export async function resolveUserForPasswordReset(
  identifierRaw: string
): Promise<UserForPasswordReset | null> {
  const trimmed = identifierRaw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const parsed = emailSchema.safeParse(trimmed.toLowerCase());
    if (!parsed.success) return null;
    const user = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: {
        id: true,
        email: true,
        accountStatus: true,
        credentials: { select: { id: true } },
        profile: { select: { phone: true } },
      },
    });
    if (!user?.profile) return null;
    return {
      id: user.id,
      email: user.email,
      phoneNorm: user.profile.phone,
      accountStatus: user.accountStatus,
      hasCredentials: Boolean(user.credentials),
    };
  }

  const phoneNorm = normalizePhoneForSms(trimmed);
  if (!phoneNorm) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { phone: phoneNorm },
    select: {
      userId: true,
      phone: true,
      user: {
        select: {
          id: true,
          email: true,
          accountStatus: true,
          credentials: { select: { id: true } },
        },
      },
    },
  });
  if (!profile?.user) return null;
  const u = profile.user;
  return {
    id: u.id,
    email: u.email,
    phoneNorm: profile.phone,
    accountStatus: u.accountStatus,
    hasCredentials: Boolean(u.credentials),
  };
}
