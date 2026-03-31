import type { Metadata } from "next";
import { BusinessCollaborationPageMain } from "@/components/business-collaboration-page-main";

export const metadata: Metadata = {
  title: "商業合作｜D Festival × 幻樂空間",
  description:
    "與 D Festival 或幻樂空間洽談品牌、院校、媒體、場地與內容合作 — 聯絡方式與合作查詢表格。",
};

export default function BusinessCollaborationPage() {
  return <BusinessCollaborationPageMain />;
}
