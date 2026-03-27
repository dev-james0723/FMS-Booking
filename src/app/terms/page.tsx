import type { Metadata } from "next";
import { TermsPageMain } from "@/components/legal/terms-page-main";

export const metadata: Metadata = {
  title: "條款與細則｜D Festival × 幻樂空間",
  description:
    "使用本預約網站、登記帳戶、提交預約及場地體驗之條款與細則。",
};

export default function TermsPage() {
  return <TermsPageMain />;
}
