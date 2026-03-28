import { SignJWT, jwtVerify } from "jose";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";

const TYP = "phone_reg";

export async function signPhoneRegistrationProof(params: {
  challengeId: string;
  phoneNorm: string;
}): Promise<string> {
  return new SignJWT({
    typ: TYP,
    chal: params.challengeId,
    phone: params.phoneNorm,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(jwtSecretKeyBytes());
}

export type PhoneRegistrationProof = {
  challengeId: string;
  phoneNorm: string;
};

export async function verifyPhoneRegistrationProof(
  token: string
): Promise<PhoneRegistrationProof | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKeyBytes());
    if (payload.typ !== TYP) return null;
    const chal = String(payload.chal ?? "");
    const phone = String(payload.phone ?? "");
    if (!chal || !phone) return null;
    return { challengeId: chal, phoneNorm: phone };
  } catch {
    return null;
  }
}
