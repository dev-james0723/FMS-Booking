import type { Metadata } from "next";
import { PrivacyPageMain } from "@/components/legal/privacy-page-main";

export const metadata: Metadata = {
  title: "私隱條例（私隱政策）｜D Festival × 幻樂空間",
  description:
    "本網站如何收集、使用及保護個人資料；適用於香港個人資料（私隱）條例（PDPO）之框架說明。",
};

export default function PrivacyPage() {
  return <PrivacyPageMain />;
}
