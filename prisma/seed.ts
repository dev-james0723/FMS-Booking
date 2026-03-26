import { PrismaClient, AdminRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { FALLBACK_SYSTEM_SETTINGS_ROWS } from "../src/lib/settings-fallback";

const prisma = new PrismaClient();

async function main() {
  await prisma.userCategory.upsert({
    where: { code: "personal" },
    create: {
      code: "personal",
      nameZh: "個人使用者",
      description: "個人練習、試奏、audition 等",
    },
    update: {},
  });
  await prisma.userCategory.upsert({
    where: { code: "teaching" },
    create: {
      code: "teaching",
      nameZh: "教學 / 帶學生使用者",
      description: "教學、帶學生、協助錄影等",
    },
    update: {},
  });

  for (const row of FALLBACK_SYSTEM_SETTINGS_ROWS) {
    await prisma.systemSetting.upsert({
      where: { key: row.key },
      create: { key: row.key, valueJson: row.value as object },
      update: { valueJson: row.value as object },
    });
  }

  const adminEmail = "super@staging.local";
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? "AdminStaging1!";
  const hash = await hashPassword(adminPass);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: hash,
      role: AdminRole.super_admin,
      isActive: true,
    },
    update: { passwordHash: hash },
  });

  const slotCount = await prisma.bookingSlot.count();
  if (slotCount === 0) {
    const { addMinutes } = await import("date-fns");
    const { fromZonedTime } = await import("date-fns-tz");
    const HK = "Asia/Hong_Kong";
    const rows: {
      startsAt: Date;
      endsAt: Date;
      capacityTotal: number;
      isOpen: boolean;
      venueLabel: string;
    }[] = [];
    for (let day = 1; day <= 10; day++) {
      const d = String(day).padStart(2, "0");
      const key = `2026-04-${d}`;
      for (let h = 9; h <= 18; h++) {
        for (const mm of [0, 30] as const) {
          if (h === 18 && mm === 30) break;
          const hm = `${String(h).padStart(2, "0")}:${mm === 0 ? "00" : "30"}:00`;
          const startsAt = fromZonedTime(`${key}T${hm}`, HK);
          const endsAt = addMinutes(startsAt, 30);
          rows.push({
            startsAt,
            endsAt,
            capacityTotal: 2,
            isOpen: true,
            venueLabel: "幻樂空間 · Studio A",
          });
        }
      }
    }
    await prisma.bookingSlot.createMany({ data: rows });
    console.log("Seeded booking slots:", rows.length);
  }

  console.log("Seed OK. Admin:", adminEmail, "/ password from SEED_ADMIN_PASSWORD or default AdminStaging1!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
