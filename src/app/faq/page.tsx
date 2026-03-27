import type { Metadata } from "next";
import { FaqView } from "@/components/faq/faq-view";

export const metadata: Metadata = {
  title: "常見問題（FAQ）｜D Festival × 幻樂空間",
  description:
    "限時免費琴室體驗 — 系統操作、公平使用、社群追蹤與轉發要求、琴室使用須知及注意事項。",
};

export default function FaqPage() {
  return <FaqView />;
}
