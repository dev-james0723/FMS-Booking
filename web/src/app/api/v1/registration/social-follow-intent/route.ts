import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  SOCIAL_FOLLOW_LINK_KEYS,
  allSocialFollowLinksClicked,
  parseClicks,
  socialFollowProgress,
  type SocialFollowLinkKey,
} from "@/lib/social-follow";
import { BonusRewardSource, Prisma } from "@prisma/client";
import { z } from "zod";

const linkKeyEnum = z.enum(SOCIAL_FOLLOW_LINK_KEYS);

const bodySchema = z.object({
  token: z.string().min(16).max(64),
  linkKey: linkKeyEnum.optional(),
});

function mergeClick(
  current: Record<SocialFollowLinkKey, boolean>,
  linkKey?: SocialFollowLinkKey
): Record<SocialFollowLinkKey, boolean> {
  const next = { ...current };
  if (linkKey) next[linkKey] = true;
  return next;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  const { token, linkKey } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { socialFollowSetupToken: token },
    include: { profile: true },
  });

  if (!user?.profile) {
    return jsonError("INVALID_TOKEN", "連結已失效或無效。若你已完成步驟，請直接登入。", 401);
  }

  const { profile } = user;

  if (profile.socialFollowVerified) {
    const clicks = parseClicks(profile.socialFollowLinkClicks);
    return jsonOk({
      verified: true,
      clicks,
      progress: 6,
      total: 6,
    });
  }

  const current = parseClicks(profile.socialFollowLinkClicks);
  const merged = mergeClick(current, linkKey);

  if (!linkKey) {
    return jsonOk({
      verified: false,
      clicks: merged,
      progress: socialFollowProgress(merged),
      total: 6,
    });
  }

  if (!allSocialFollowLinksClicked(merged)) {
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        socialFollowLinkClicks: merged as Prisma.InputJsonValue,
      },
    });
    return jsonOk({
      verified: false,
      clicks: merged,
      progress: socialFollowProgress(merged),
      total: 6,
    });
  }

  await prisma.$transaction(async (tx) => {
    const existingBonus = await tx.bonusReward.findFirst({
      where: { userId: user.id, source: BonusRewardSource.social_follow },
    });
    if (!existingBonus) {
      await tx.bonusReward.create({
        data: {
          userId: user.id,
          source: BonusRewardSource.social_follow,
          slotsGranted: 1,
          slotsRemaining: 1,
        },
      });
    }
    await tx.userProfile.update({
      where: { userId: user.id },
      data: {
        socialFollowLinkClicks: merged as Prisma.InputJsonValue,
        socialFollowVerified: true,
        socialFollowVerifiedAt: new Date(),
      },
    });
  });

  return jsonOk({
    verified: true,
    clicks: merged,
    progress: 6,
    total: 6,
  });
}
