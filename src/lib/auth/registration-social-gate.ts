import type { UserProfile } from "@prisma/client";

/** Registration form requires social follow/repost opt-in; this gate blocks account access until both are confirmed on the post-registration flow. */
export function isRegistrationSocialGateSatisfied(
  profile:
    | Pick<UserProfile, "socialFollowClaimed" | "socialFollowVerified" | "socialRepostSetupConfirmed">
    | null
    | undefined
): boolean {
  if (!profile?.socialFollowClaimed) return true;
  return profile.socialFollowVerified === true && profile.socialRepostSetupConfirmed === true;
}
