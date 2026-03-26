import { SignJWT, jwtVerify } from "jose";

const TYP = "phone_reg";

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

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
    .sign(secret());
}

export type PhoneRegistrationProof = {
  challengeId: string;
  phoneNorm: string;
};

export async function verifyPhoneRegistrationProof(
  token: string
): Promise<PhoneRegistrationProof | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== TYP) return null;
    const chal = String(payload.chal ?? "");
    const phone = String(payload.phone ?? "");
    if (!chal || !phone) return null;
    return { challengeId: chal, phoneNorm: phone };
  } catch {
    return null;
  }
}
