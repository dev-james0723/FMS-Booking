import { PrismaClient, AdminRole, BookingVenueKind } from "@prisma/client";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
} from "../src/lib/booking/campaign-constants";
import { bookableStartHourForCampaignDateKey } from "../src/lib/booking/day-timeline";
import { addDaysToDateKey } from "../src/lib/hk-calendar-client";
import { hashPassword } from "../src/lib/password";
import { FALLBACK_SYSTEM_SETTINGS_ROWS } from "../src/lib/settings-fallback";
import { REGISTRATION_INSTRUMENT_IMAGE_PATHS } from "../src/lib/instruments/instrument-reference-images";

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

  for (const [instrumentKey, imageUrl] of Object.entries(REGISTRATION_INSTRUMENT_IMAGE_PATHS)) {
    await prisma.registrationInstrumentImage.upsert({
      where: { instrumentKey },
      create: { instrumentKey, imageUrl },
      update: { imageUrl },
    });
  }
  console.log("Seeded registration instrument images:", Object.keys(REGISTRATION_INSTRUMENT_IMAGE_PATHS).length);

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
      venueKind: BookingVenueKind;
    }[] = [];
    let dayKey = CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY;
    for (;;) {
      const startHour = bookableStartHourForCampaignDateKey(dayKey);
      for (let h = startHour; h <= 19; h++) {
        for (const mm of [0, 30] as const) {
          const hm = `${String(h).padStart(2, "0")}:${mm === 0 ? "00" : "30"}:00`;
          const startsAt = fromZonedTime(`${dayKey}T${hm}`, HK);
          const endsAt = addMinutes(startsAt, 30);
          rows.push({
            startsAt,
            endsAt,
            capacityTotal: 1,
            isOpen: true,
            venueLabel: "幻樂空間 · Room No.2",
            venueKind: BookingVenueKind.studio_room,
          });
        }
      }
      if (dayKey === CAMPAIGN_EXPERIENCE_LAST_DAY_KEY) break;
      dayKey = addDaysToDateKey(dayKey, 1);
    }
    await prisma.bookingSlot.createMany({ data: rows });
    console.log("Seeded booking slots:", rows.length);
  }

  const openCount = await prisma.bookingSlot.count({
    where: { venueKind: BookingVenueKind.open_space },
  });
  if (openCount === 0) {
    const studioSlots = await prisma.bookingSlot.findMany({
      where: { venueKind: BookingVenueKind.studio_room },
    });
    if (studioSlots.length > 0) {
      await prisma.bookingSlot.createMany({
        data: studioSlots.map((s) => ({
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          capacityTotal: 1,
          capacityHeld: 0,
          isOpen: s.isOpen,
          venueLabel: "幻樂空間 · 開放空間（Open Space）",
          venueKind: BookingVenueKind.open_space,
        })),
      });
      console.log("Seeded open_space booking slots:", studioSlots.length);
    }
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
