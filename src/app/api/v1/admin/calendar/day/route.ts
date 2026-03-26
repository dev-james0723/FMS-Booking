import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { hkDayEndUtc, hkDayStartUtc } from "@/lib/booking/hk-dates";
import { identityFlagsToZh, userCategoryLabelZh } from "@/lib/identity-labels";
import { prisma } from "@/lib/prisma";
import { whatsAppWebUrl } from "@/lib/whatsapp-link";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

function igFollowSummary(
  verified: boolean,
  claimed: boolean
): { label: string; detail: string } {
  if (verified) {
    return { label: "已核實", detail: "官方 IG 追蹤已核實" };
  }
  if (claimed) {
    return { label: "待核實", detail: "已聲明完成追蹤（待主辦核實）" };
  }
  return { label: "未完成", detail: "未聲明或未核實追蹤 IG" };
}

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date || !ymd.test(date)) {
    return jsonError("VALIDATION_ERROR", "Query date required as yyyy-MM-dd", 400);
  }

  const start = hkDayStartUtc(date);
  const end = hkDayEndUtc(date);

  const slots = await prisma.bookingSlot.findMany({
    where: { startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
    include: {
      allocations: {
        where: {
          status: { in: ["pending", "approved"] },
          request: {
            status: { in: ["pending", "approved", "waitlisted"] },
          },
        },
        include: {
          request: {
            include: {
              user: {
                include: { profile: true, category: true },
              },
            },
          },
        },
      },
    },
  });

  return jsonOk({
    date,
    slots: slots.map((s) => {
      const used = s.allocations.length;
      const remaining = Math.max(0, s.capacityTotal - used);
      return {
        id: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        capacityTotal: s.capacityTotal,
        isOpen: s.isOpen,
        venueLabel: s.venueLabel,
        used,
        remaining,
        bookings: s.allocations.map((a) => {
          const u = a.request.user;
          const p = u.profile;
          const catCode =
            a.request.userCategoryAtRequest || u.category?.code || null;
          const ig = p
            ? igFollowSummary(p.socialFollowVerified, p.socialFollowClaimed)
            : { label: "—", detail: "—" };
          return {
            allocationId: a.id,
            requestId: a.request.id,
            requestStatus: a.request.status,
            userId: u.id,
            email: u.email,
            nameZh: p?.nameZh ?? "—",
            phone: p?.phone ?? "—",
            whatsappUrl: p?.phone ? whatsAppWebUrl(p.phone) : null,
            userCategoryCode: catCode,
            userCategoryLabel: userCategoryLabelZh(catCode),
            instagramFollow: ig,
            genderNote: "未有記錄（登記表單未收集性別欄位）",
            identityLabelsZh: p ? identityFlagsToZh(p.identityFlags) : [],
          };
        }),
      };
    }),
  });
}
