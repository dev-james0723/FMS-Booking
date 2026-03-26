"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SocialFollowSetupPanel } from "@/components/social-follow-setup-panel";

type SuccessPayload = {
  email: string;
  tempPassword?: string;
  emailSent?: boolean;
  emailChannel?: string;
  devNote?: string;
  emailError?: string;
  socialFollowOptIn?: boolean;
  socialFollowSetupToken?: string | null;
};

export default function RegisterSuccessPage() {
  const [payload, setPayload] = useState<SuccessPayload | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("fms_registration_success");
        if (!raw) return;
        sessionStorage.removeItem("fms_registration_success");
        const parsed = JSON.parse(raw) as SuccessPayload;
        if (parsed && typeof parsed.email === "string") {
          setPayload(parsed);
        }
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const showDevPassword = Boolean(payload?.tempPassword);

  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-2xl text-stone-900">登記成功</h1>
      {payload?.emailSent ? (
        <p className="mt-4 text-sm text-stone-600">
          確認電郵已透過系統寄出（含臨時密碼及登入連結）。請檢查收件匣及垃圾郵件資料夾。
        </p>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          帳戶已建立。若已設定電郵服務，你會收到確認電郵；否則請依下方說明登入。
        </p>
      )}
      {payload?.devNote && (
        <p className="mx-auto mt-3 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
          {payload.devNote}
        </p>
      )}
      {payload?.emailError && !payload.emailSent && (
        <p className="mx-auto mt-3 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-xs text-red-900">
          {payload.emailError}
        </p>
      )}
      {showDevPassword && (
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-left text-sm text-stone-800">
          <p className="font-medium text-stone-900">開發模式：臨時登入資料</p>
          <p className="mt-2">
            <span className="text-stone-600">登入帳號（Email）</span>
            <br />
            <span className="mt-1 inline-block break-all font-mono text-stone-900">{payload!.email}</span>
          </p>
          <p className="mt-3">
            <span className="text-stone-600">臨時密碼</span>
            <br />
            <code className="mt-1 inline-block rounded-lg bg-white px-3 py-2 font-mono text-stone-900 ring-1 ring-stone-200">
              {payload!.tempPassword}
            </code>
          </p>
          <p className="mt-3 text-xs text-stone-500">
            正式環境不會在畫面上顯示密碼；請勿於公開部署開啟此行為。
          </p>
        </div>
      )}
      <p className="mt-6 text-sm text-stone-600">
        首次登入後請立即更改密碼；預約系統將於主辦公布時間開放申請。
      </p>
      {payload?.socialFollowOptIn && payload.socialFollowSetupToken ? (
        <SocialFollowSetupPanel token={payload.socialFollowSetupToken} />
      ) : payload?.socialFollowOptIn && !payload.socialFollowSetupToken ? (
        <p className="mx-auto mt-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
          已選取社群獎勵，但未能載入驗證連結。請聯絡主辦方或重新登記（如適用）。
        </p>
      ) : null}
      <Link
        href="/login"
        className="mt-8 inline-block rounded-full bg-stone-900 px-8 py-3 text-sm text-white hover:bg-stone-800"
      >
        前往登入
      </Link>
    </main>
  );
}
