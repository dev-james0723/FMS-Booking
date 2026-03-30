import { jsonError, jsonOk } from "@/lib/api-response";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isRegistrationSocialGateSatisfied } from "@/lib/auth/registration-social-gate";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";
import {
  SOCIAL_FOLLOW_LINK_KEYS,
  allSocialFollowLinksClicked,
  parseClicks,
  socialFollowProgress,
  type SocialFollowLinkKey,
} from "@/lib/social-follow";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const linkKeyEnum = z.enum(SOCIAL_FOLLOW_LINK_KEYS);

const bodySchema = z.object({
  token: z.string().min(16).max(64).optional(),
  linkKey: linkKeyEnum.optional(),
  repostDeclaration: z.enum(["yes", "no"]).optional(),
});

function mergeClick(
  current: Record<SocialFollowLinkKey, boolean>,
  linkKey?: SocialFollowLinkKey
): Record<SocialFollowLinkKey, boolean> {
  const next = { ...current };
  if (linkKey) next[linkKey] = true;
  return next;
}

function stateFromProfile(p: {
  socialFollowLinkClicks: unknown;
  socialFollowVerified: boolean;
  socialRepostSetupConfirmed: boolean;
  socialFollowClaimed: boolean;
}) {
  const clicks = parseClicks(p.socialFollowLinkClicks);
  return {
    verified: p.socialFollowVerified,
    clicks,
    progress: socialFollowProgress(clicks),
    total: 6,
    repostConfirmed: p.socialRepostSetupConfirmed,
    gateComplete: isRegistrationSocialGateSatisfied(p),
  };
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

  const locale = await serverLocaleFromCookies();
  const session = await getSessionFromCookies();
  const { token, linkKey, repostDeclaration } = parsed.data;

  if (!session?.sub && !token) {
    return jsonError(
      "UNAUTHORIZED",
      apiBilingual(
        locale,
        "請登入或使用登記成功頁面的有效連結。",
        "Sign in or use the valid link from your registration success page."
      ),
      401
    );
  }

  let userId: string;
  if (session?.sub) {
    userId = session.sub;
  } else {
    const byToken = await prisma.user.findUnique({
      where: { socialFollowSetupToken: token },
      select: { id: true },
    });
    if (!byToken) {
      return jsonError(
        "INVALID_TOKEN",
        apiBilingual(
          locale,
          "連結已失效或無效。若您已完成步驟，請直接登入。",
          "This link is invalid or has expired. If you already finished the steps, please sign in."
        ),
        401
      );
    }
    userId = byToken.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user?.profile) {
    return jsonError(
      "INVALID_TOKEN",
      apiBilingual(
        locale,
        "找不到帳戶資料。",
        "Profile not found."
      ),
      404
    );
  }

  let profile = user.profile;

  if (!profile.socialFollowClaimed) {
    return jsonOk(stateFromProfile(profile));
  }

  if (linkKey) {
    const current = parseClicks(profile.socialFollowLinkClicks);
    const merged = mergeClick(current, linkKey);

    if (!allSocialFollowLinksClicked(merged)) {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          socialFollowLinkClicks: merged as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          socialFollowLinkClicks: merged as Prisma.InputJsonValue,
          socialFollowVerified: true,
          socialFollowVerifiedAt: new Date(),
        },
      });
    }
    profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } });
  }

  if (repostDeclaration === "yes") {
    if (!profile.socialFollowVerified) {
      return jsonError(
        "FOLLOW_INCOMPLETE",
        apiBilingual(
          locale,
          "請先在本頁按齊六個「前往 Instagram／Facebook」按鈕，完成追蹤步驟。",
          "Tap all six Instagram/Facebook buttons on this page to finish the follow step first."
        ),
        409
      );
    }
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        socialRepostSetupConfirmed: true,
        socialRepostSetupConfirmedAt: new Date(),
      },
    });
    profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } });
  } else if (repostDeclaration === "no") {
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        socialRepostSetupConfirmed: false,
        socialRepostSetupConfirmedAt: null,
      },
    });
    profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } });
  }

  return jsonOk(stateFromProfile(profile));
}
