import { jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const rows = await prisma.user.findMany({
    where: { hasCompletedRegistration: true },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      profile: true,
      category: true,
      bookingRequests: {
        orderBy: { requestedAt: "desc" },
        include: {
          allocations: {
            orderBy: { slot: { startsAt: "asc" } },
            include: { slot: true },
          },
        },
      },
    },
  });

  return jsonOk({
    users: rows.map((u) => {
      const p = u.profile;
      return {
        id: u.id,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
        category: u.category
          ? { code: u.category.code, nameZh: u.category.nameZh }
          : null,
        profile: p
          ? {
              nameZh: p.nameZh,
              nameEn: p.nameEn,
              phone: p.phone,
              age: p.age,
              instrumentField: p.instrumentField,
              identityLabels: asStringArray(p.identityFlags as unknown),
              identityOtherText: p.identityOtherText,
              preferredDates: asStringArray(p.preferredDates as unknown),
              preferredTimeText: p.preferredTimeText,
              extraNotes: p.extraNotes,
            }
          : null,
        bookingRequests: u.bookingRequests.map((br) => ({
          id: br.id,
          status: br.status,
          requestedAt: br.requestedAt.toISOString(),
          slotCount: br.allocations.length,
          slots: br.allocations.map((a) => ({
            id: a.slot.id,
            startsAt: a.slot.startsAt.toISOString(),
            endsAt: a.slot.endsAt.toISOString(),
            venueLabel: a.slot.venueLabel,
            allocationStatus: a.status,
          })),
        })),
      };
    }),
  });
}
