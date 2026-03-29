import { jwtVerify } from "jose";
import type { AccountStatus, BookingVenueKind } from "@prisma/client";

export type SessionPayload = {
  sub: string;
  email: string;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  hasCompletedRegistration: boolean;
  bookingVenueKind?: BookingVenueKind;
};

export async function verifyUserSessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const sub = String(payload.sub ?? "");
    const email = String(payload.email ?? "");
    if (!sub || !email) return null;
    const rawVenue = payload.bookingVenueKind;
    const bookingVenueKind: BookingVenueKind | undefined =
      rawVenue === "open_space" || rawVenue === "studio_room" ? rawVenue : undefined;
    return {
      sub,
      email,
      accountStatus: payload.accountStatus as AccountStatus,
      mustChangePassword: Boolean(payload.mustChangePassword),
      hasCompletedRegistration: Boolean(payload.hasCompletedRegistration),
      bookingVenueKind,
    };
  } catch {
    return null;
  }
}
