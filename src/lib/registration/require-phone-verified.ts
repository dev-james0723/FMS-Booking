import { prisma } from "@/lib/prisma";
import { verifyPhoneRegistrationProof } from "@/lib/phone-registration-proof";

/** Phone SMS flow: verified and not yet consumed by a completed registration. */
export async function requirePhoneVerifiedForRegistration(
  phoneNorm: string,
  phoneVerificationToken: string
): Promise<boolean> {
  const proof = await verifyPhoneRegistrationProof(phoneVerificationToken);
  if (!proof || proof.phoneNorm !== phoneNorm) return false;
  const row = await prisma.phoneOtpChallenge.findFirst({
    where: {
      id: proof.challengeId,
      phoneNorm,
      verifiedAt: { not: null },
      registrationConsumedAt: null,
    },
  });
  return !!row;
}
