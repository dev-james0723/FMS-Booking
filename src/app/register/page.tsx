import { Suspense } from "react";
import { RegisterPageMain } from "@/components/register-page-main";

export const metadata = {
  title: "資料登記｜D Festival × 幻樂空間",
};

function RegisterLoading() {
  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-4 py-12">
      <p className="text-sm text-stone-500 dark:text-stone-400">載入中…</p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterPageMain />
    </Suspense>
  );
}
