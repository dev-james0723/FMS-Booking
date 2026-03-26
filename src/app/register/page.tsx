import { RegistrationForm } from "@/components/registration-form";

export const metadata = {
  title: "資料登記｜D Festival × 幻樂空間",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">用戶資料登記</h1>
      <p className="mt-3 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
        請填寫以下資料。提交後系統會以你的 Email 建立帳戶，並發送臨時密碼至你的電郵信箱。完成登記並不代表預約已確認。
      </p>
      <div className="mt-10">
        <RegistrationForm />
      </div>
    </main>
  );
}
