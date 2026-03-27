/**
 * Deletes all customer-facing data: OTP challenges, registration submissions,
 * and users (cascades profiles, bookings, passkeys, etc.).
 * Admin accounts (admin_users) and system settings are NOT removed.
 *
 * Usage (from repo root, DATABASE_URL in .env):
 *   CLEAR_CUSTOMER_DATA_CONFIRM=yes npx tsx scripts/clear-customer-data.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.CLEAR_CUSTOMER_DATA_CONFIRM !== "yes") {
    console.error(
      "Refusing to run: set CLEAR_CUSTOMER_DATA_CONFIRM=yes to delete all customer data."
    );
    process.exit(1);
  }

  const counts = await prisma.$transaction(async (tx) => {
    const otp = await tx.phoneOtpChallenge.deleteMany();
    const subs = await tx.registrationSubmission.deleteMany();
    const users = await tx.user.deleteMany();
    return { otp: otp.count, submissions: subs.count, users: users.count };
  });

  console.log("Cleared:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
