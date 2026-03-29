import type { Metadata } from "next";
import { FantasiaEnBody } from "@/components/about-fantasia-music-space/fantasia-en-body";
import { FantasiaMusicSpaceLocaleSwitch } from "@/components/about-fantasia-music-space/fantasia-locale-switch";
import { FantasiaZhBody } from "@/components/about-fantasia-music-space/fantasia-zh-body";
import { fantasiaInstagramElfsightClassFromEnv } from "@/lib/fantasia-music-space-env";

export const metadata: Metadata = {
  title: "關於幻樂空間 Fantasia Music Space｜D Festival × 幻樂空間",
  description:
    "幻樂空間核心特點：24 小時自助、Studio 級隔音、三角鋼琴、自助錄影、教學空間與荃灣交通便利地段 — 附場地圖片與 Instagram 動態。",
};

export default function AboutFantasiaMusicSpacePage() {
  const elfsightClass = fantasiaInstagramElfsightClassFromEnv();

  return (
    <FantasiaMusicSpaceLocaleSwitch
      zh={<FantasiaZhBody elfsightClass={elfsightClass} />}
      en={<FantasiaEnBody elfsightClass={elfsightClass} />}
    />
  );
}
