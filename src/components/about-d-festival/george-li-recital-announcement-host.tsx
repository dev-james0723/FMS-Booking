"use client";

import dynamic from "next/dynamic";

const GeorgeLiRecitalAnnouncement = dynamic(
  () =>
    import("@/components/about-d-festival/george-li-recital-announcement").then((m) => ({
      default: m.GeorgeLiRecitalAnnouncement,
    })),
  { ssr: false }
);

export function GeorgeLiRecitalAnnouncementHost() {
  return <GeorgeLiRecitalAnnouncement />;
}
