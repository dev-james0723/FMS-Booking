import type { CameraRentalPaymentChoice } from "@prisma/client";
import {
  CAMERA_RENTAL_STRIPE_CHECKOUT_URL,
  CAMERA_USAGE_GUIDE_DRIVE_URL,
  cameraRentalQrAbsUrl,
} from "@/lib/booking/camera-rental";
import { sessionCountWithHoursPack } from "@/lib/i18n/session-hours";
import type { Locale } from "@/lib/i18n/types";
import { withBasePath } from "@/lib/base-path";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_PUBLIC_EMAIL,
  CONTACT_WHATSAPP_URL,
  gmailComposeUrl,
} from "@/lib/contact-public";
import { escapeHtml } from "@/lib/email/escape-html";
import { formatBookingSlotsSummaryForMail } from "@/lib/email/booking-slots-summary";
import { getSocialFollowUrl } from "@/lib/social-follow";

function absAppUrl(path: string): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}${withBasePath(path)}`;
}

/** FMS venue reference (Wi‑Fi, room info, etc.); override with BOOKING_SPACE_INFO_GOOGLE_DRIVE_URL if it moves. */
const DEFAULT_BOOKING_SPACE_INFO_DRIVE_URL =
  "https://drive.google.com/drive/folders/1qhOhWbBcwYd95-J56z7nr1EzjSfuZU4A?usp=drive_link";

function driveFolderUrl(): string | null {
  const raw = process.env.BOOKING_SPACE_INFO_GOOGLE_DRIVE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return DEFAULT_BOOKING_SPACE_INFO_DRIVE_URL;
}

const btnStyle =
  "display:inline-block;margin:6px 0;padding:10px 18px;background:#1c1917;color:#fff;text-decoration:none;border-radius:9999px;font-size:14px;font-weight:500;";

function linkButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="${btnStyle}">${escapeHtml(label)}</a>`;
}

function compactNavLinks(items: [string, string][]): string {
  return `<ul style="margin:12px 0 0;padding-left:18px;font-size:14px;line-height:1.65;color:#44403c;">
${items.map(([u, l]) => `  <li style="margin:0 0 3px;"><a href="${escapeHtml(u)}" style="color:#b45309;">${escapeHtml(l)}</a></li>`).join("\n")}
</ul>`;
}

function cameraBlocksForBookingMail(
  locale: Locale,
  optIn: boolean,
  choice: CameraRentalPaymentChoice | null,
): { text: string; html: string } {
  if (!optIn || !choice) return { text: "", html: "" };

  const stripe = CAMERA_RENTAL_STRIPE_CHECKOUT_URL;
  const guide = CAMERA_USAGE_GUIDE_DRIVE_URL;
  const qrUrl = cameraRentalQrAbsUrl();

  if (locale === "en") {
    if (choice === "paid_before_booking") {
      return {
        text: [
          "",
          "Sony 4K camcorder rental (HK$99)",
          "You indicated payment is complete. How to use the camcorder:",
          guide,
        ].join("\n"),
        html: `<div style="margin:20px 0;padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;font-size:14px;line-height:1.65;color:#14532d;">
  <p style="margin:0 0 8px;font-weight:700;">Sony 4K camcorder rental (HK$99)</p>
  <p style="margin:0 0 10px;">You indicated payment is complete. Please open this Google Drive folder for how to use the camcorder:</p>
  <p style="margin:0;">${linkButton(guide, "Camera usage guide (Google Drive)")}</p>
</div>`,
      };
    }
    return {
      text: [
        "",
        "Sony 4K camcorder rental (HK$99)",
        "You chose to pay after submitting this request. Please pay HK$99 before your session:",
        stripe,
        "",
        "Because you selected camcorder rental, please complete payment before your session time.",
      ].join("\n"),
      html: `<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:14px;line-height:1.65;color:#422006;">
  <p style="margin:0 0 8px;font-weight:700;">Sony 4K camcorder rental (HK$99)</p>
  <p style="margin:0 0 10px;">You chose to pay after booking. Please pay <strong>HK$99</strong> before your session using the link below (or scan the QR code).</p>
  <p style="margin:0 0 12px;">${linkButton(stripe, "Pay HK$99 (Stripe)")}</p>
  <p style="margin:0 0 8px;font-size:13px;">Payment QR code:</p>
  <p style="margin:0 0 12px;"><img src="${escapeHtml(qrUrl)}" width="200" height="200" alt="Stripe payment QR" style="display:block;border:1px solid #e7e5e4;border-radius:8px;background:#fff;" /></p>
  <p style="margin:0;font-size:13px;font-weight:600;">Because you selected camcorder rental, please complete payment before your session.</p>
</div>`,
    };
  }

  if (choice === "paid_before_booking") {
    return {
      text: [
        "",
        "Sony 4K 攝錄機租用（港幣 $99）",
        "您已表示完成付款。請參考以下 Google Drive 資料夾了解如何使用攝錄機：",
        guide,
      ].join("\n"),
      html: `<div style="margin:20px 0;padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;font-size:14px;line-height:1.65;color:#14532d;">
  <p style="margin:0 0 8px;font-weight:700;">Sony 4K 攝錄機租用（港幣 $99）</p>
  <p style="margin:0 0 10px;">您已表示完成付款。請開啟以下 Google Drive 資料夾查閱如何使用攝錄機：</p>
  <p style="margin:0;">${linkButton(guide, "按此查閲如何使用攝錄機（Google Drive）")}</p>
</div>`,
    };
  }

  return {
    text: [
      "",
      "Sony 4K 攝錄機租用（港幣 $99）",
      "您選擇了預約時段後付款。請於預約時段前盡快支付港幣 $99：",
      stripe,
      "",
      "因為你選擇了攝錄機租用服務，請及時在預約時段前完成付款。",
    ].join("\n"),
    html: `<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:14px;line-height:1.65;color:#422006;">
  <p style="margin:0 0 8px;font-weight:700;">Sony 4K 攝錄機租用（港幣 $99）</p>
  <p style="margin:0 0 10px;">您選擇了預約時段後付款。請使用以下連結（或掃描 QR Code）於預約時段前支付 <strong>港幣 $99</strong>：</p>
  <p style="margin:0 0 12px;">${linkButton(stripe, "按此付款（Stripe）")}</p>
  <p style="margin:0 0 8px;font-size:13px;">付款連結 QR Code：</p>
  <p style="margin:0 0 12px;"><img src="${escapeHtml(qrUrl)}" width="200" height="200" alt="Stripe 付款 QR Code" style="display:block;border:1px solid #e7e5e4;border-radius:8px;background:#fff;" /></p>
  <p style="margin:0;font-size:13px;font-weight:600;">因為你選擇了攝錄機租用服務，請及時在預約時段前完成付款。</p>
</div>`,
  };
}

export function buildBookingSubmittedMail(
  locale: Locale,
  params: {
    greetingName: string;
    requestId: string;
    slotCount: number;
    slots: { startsAt: Date; endsAt: Date }[];
    cameraRentalOptIn: boolean;
    cameraRentalPaymentChoice: CameraRentalPaymentChoice | null;
  },
): { subject: string; text: string; html: string } {
  const safeName = escapeHtml(params.greetingName);
  const sessions = sessionCountWithHoursPack(locale, params.slotCount);
  const timeSummary = formatBookingSlotsSummaryForMail(locale, params.slots);
  const driveUrl = driveFolderUrl();
  const igUrl = getSocialFollowUrl("fantasia_space_ig");
  const fbUrl = getSocialFollowUrl("fantasia_space_fb");

  const urls = {
    history: absAppUrl("/booking/history"),
    aboutDf: absAppUrl("/about-d-festival"),
    faq: absAppUrl("/faq"),
    directions: absAppUrl("/directions"),
    openSpace: absAppUrl("/open-space-booking"),
    privacy: absAppUrl("/privacy"),
    terms: absAppUrl("/terms"),
    contact: absAppUrl("/contact"),
    mailTo: gmailComposeUrl(CONTACT_PUBLIC_EMAIL),
    tel: `tel:${CONTACT_PHONE_E164}`,
    whatsapp: CONTACT_WHATSAPP_URL,
  };

  const logoDf = absAppUrl("/branding/d-festival-young-pianist.png");
  const logoFms = absAppUrl("/branding/fantasia-music-space.png");

  const cameraMail = cameraBlocksForBookingMail(
    locale,
    params.cameraRentalOptIn,
    params.cameraRentalPaymentChoice,
  );

  if (locale === "en") {
    const subject = "Booking confirmed | D Festival × Fantasia Music Space";
    const rulesBlock = [
      "Important rules (please read)",
      "",
      "By using this booking service you agree to the Terms & conditions published on the site and any updates we post. The following are frequent breach points:",
      "",
      `• Teaching / with-students quota: If you book using the teaching or “with students” category or related quota, but your actual use is personal practice or anything other than teaching students as declared, the organiser may cancel the booking and may restrict future bookings.`,
      "",
      `• One person, honest accounts: You must not use multiple accounts to take extra slots. You must not have friends, relatives or others register accounts so that you use all booked time yourself. If we verify this kind of abuse, we may immediately cancel your free-experience eligibility for this programme and you may not submit new bookings through this site.`,
      "",
      `Full terms: ${urls.terms}`,
    ].join("\n");

    const driveBlock = driveUrl
      ? [
          "",
          "Building access (door / Wi‑Fi), venue and facility reference (Google Drive folder):",
          driveUrl,
        ].join("\n")
      : [
          "",
          "Venue details are also on the site under “Open Space booking info” and related pages.",
        ].join("\n");

    const text = [
      `Hello ${params.greetingName},`,
      "",
      "Your booking status: CONFIRMED.",
      "",
      `You have booked ${sessions}. Scheduled times (Hong Kong Time):`,
      ...timeSummary.textLines.map((line) => `  • ${line}`),
      "",
      `Reference: ${params.requestId}`,
      `View your bookings: ${urls.history}`,
      "",
      "Quick links:",
      `• View my booking history: ${urls.history}`,
      `• About 2026 D Festival Young Pianist Program: ${urls.aboutDf}`,
      `• FAQ: ${urls.faq}`,
      `• How to get to Fantasia Music Space: ${urls.directions}`,
      `• Open Space booking info: ${urls.openSpace}`,
      `• Privacy policy: ${urls.privacy}`,
      `• Terms & conditions: ${urls.terms}`,
      `• Contact: ${urls.contact}`,
      "",
      rulesBlock,
      driveBlock,
      cameraMail.text,
      "",
      "Contact us",
      `Phone / WhatsApp: ${CONTACT_PHONE_DISPLAY}`,
      `Email: ${CONTACT_PUBLIC_EMAIL}`,
      `WhatsApp (chat): ${urls.whatsapp}`,
      `Instagram: ${igUrl}`,
      `Facebook: ${fbUrl}`,
      "",
      "Thank you for your support.",
      "",
      "D Festival × Fantasia Music Space",
    ].join("\n");

    const rulesHtml = `<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:13px;line-height:1.65;color:#422006;">
  <p style="margin:0 0 10px;font-weight:700;">Important rules (please read)</p>
  <p style="margin:0 0 10px;">By booking, you agree to our <a href="${escapeHtml(urls.terms)}" style="color:#b45309;">Terms &amp; conditions</a> and published notices. Common breach points:</p>
  <ul style="margin:0;padding-left:18px;">
    <li style="margin:0 0 8px;"><strong>Teaching / with-students quota</strong> — If you book under teaching or “with students” but actually use the time only for yourself (e.g. personal practice) without the declared teaching use, the organiser may cancel the booking and may restrict future bookings.</li>
    <li style="margin:0;"><strong>One person, honest accounts</strong> — Do not use multiple accounts, and do not use accounts registered under other people’s names (friends, family, etc.) so that you alone use all the slots. If verified, we may immediately end your free-experience eligibility and you may not make new bookings on this site.</li>
  </ul>
</div>`;

    const driveHtml = driveUrl
      ? `<p style="margin:16px 0 8px;font-size:14px;">Building access (door / Wi‑Fi), venue and facility reference materials are in this Google Drive folder:</p>
  <p style="margin:0 0 16px;">${linkButton(driveUrl, "Open Google Drive folder")}</p>`
      : `<p style="margin:16px 0;font-size:13px;color:#78716c;">More venue details are on the site under Open Space booking info and related pages.</p>`;

    const navLabels: [string, string][] = [
      [urls.history, "View my booking history"],
      [urls.aboutDf, "About 2026 D Festival Young Pianist Program"],
      [urls.faq, "FAQ"],
      [urls.directions, "How to get to Fantasia Music Space"],
      [urls.openSpace, "Open Space booking info"],
      [urls.privacy, "Privacy policy"],
      [urls.terms, "Terms & conditions"],
      [urls.contact, "Contact"],
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="50%" style="vertical-align:middle;text-align:center;padding:10px 8px;">
            <img src="${escapeHtml(logoDf)}" alt="D Festival Young Pianist Program" style="max-width:100%;max-height:96px;width:auto;height:auto;display:inline-block;object-fit:contain;" />
          </td>
          <td width="50%" style="vertical-align:middle;text-align:center;padding:10px 8px;">
            <img src="${escapeHtml(logoFms)}" alt="Fantasia Music Space" style="max-width:100%;max-height:96px;width:auto;height:auto;display:inline-block;object-fit:contain;" />
          </td>
        </tr>
      </table>
      <p style="margin:0 0 12px;">Hello ${safeName},</p>
      <div style="margin:0 0 14px;padding:10px 14px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;font-size:14px;line-height:1.55;color:#065f46;">
        <p style="margin:0;font-weight:700;">Status: Confirmed</p>
      </div>
      <p style="margin:0 0 8px;">You have booked <strong>${escapeHtml(sessions)}</strong>. Your scheduled times:</p>
      ${timeSummary.htmlBlock}
      <p style="margin:14px 0 16px;font-size:14px;">Reference: <strong>${escapeHtml(params.requestId)}</strong></p>
      <p style="margin:0 0 12px;">${linkButton(urls.history, "View my booking history")}</p>
      <p style="margin:0 0 4px;font-weight:600;font-size:14px;color:#44403c;">Quick links</p>
      ${compactNavLinks(navLabels)}
      ${rulesHtml}
      ${driveHtml}
      ${cameraMail.html}
      <p style="margin:20px 0 8px;font-weight:600;font-size:14px;color:#44403c;">Contact us</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        Phone / WhatsApp: <a href="${escapeHtml(urls.tel)}" style="color:#b45309;">+852 9163 6378</a><br />
        Email: <a href="${escapeHtml(urls.mailTo)}" style="color:#b45309;">${escapeHtml(CONTACT_PUBLIC_EMAIL)}</a><br />
        <a href="${escapeHtml(urls.whatsapp)}" style="color:#b45309;">WhatsApp chat</a>
        · <a href="${escapeHtml(igUrl)}" style="color:#b45309;">Instagram</a>
        · <a href="${escapeHtml(fbUrl)}" style="color:#b45309;">Facebook</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">Thank you for your support.<br />D Festival × Fantasia Music Space</p>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, text, html };
  }

  const subject = "預約已確認｜D Festival × 幻樂空間";
  const rulesBlock = [
    "重要規則（請務必閱讀）",
    "",
    "使用本預約服務即表示您同意本網站之《條款與細則》及主辦方不時公布之內容。以下為較常出現的違規情況，請特別留意：",
    "",
    "• 教學／與學生同行配額：若您以教學或與學生同行等類別或相關配額預約，但實際到場僅作個人練習或其他非聲明用途，主辦方有權取消有關預約，並可視乎情況限制日後預約。",
    "",
    "• 帳號須誠實使用：同一人不得以多個帳號重複佔用名額；亦不得利用親友或他人代為登記之帳號預約，而實際上均由同一人使用各帳號所預約之時段。若經主辦方查證屬實，可立即取消當次免費體驗資格，並不得再透過本網站提交新預約。",
    "",
    `完整條款：${urls.terms}`,
  ].join("\n");

  const driveBlock = driveUrl
    ? [
        "",
        "大門/Wi-Fi密碼、活動場地和設施之參考資料（Google Drive 資料夾）：",
        driveUrl,
      ].join("\n")
    : ["", "場地說明亦可於本網站「開放空間預約說明」及相關頁面查閱。"].join(
        "\n",
      );

  const text = [
    `${params.greetingName} 您好，`,
    "",
    "預約狀態：已確認",
    "",
    `您本次共預約 ${sessions}，時段如下（香港時間）：`,
    ...timeSummary.textLines.map((line) => `  • ${line}`),
    "",
    `參考編號：${params.requestId}`,
    `查看預約紀錄：${urls.history}`,
    "",
    "本網站連結：",
    `• 查看我的預約紀錄：${urls.history}`,
    `• 關於 2026 D Festival 青年鋼琴家藝術節：${urls.aboutDf}`,
    `• 常見問題（FAQ）：${urls.faq}`,
    `• 如何前往幻樂空間：${urls.directions}`,
    `• 開放空間預約說明：${urls.openSpace}`,
    `• 私隱條例：${urls.privacy}`,
    `• 條款與細則：${urls.terms}`,
    `• 聯絡資訊：${urls.contact}`,
    "",
    rulesBlock,
    driveBlock,
    cameraMail.text,
    "",
    "聯絡我們",
    `電話／WhatsApp：${CONTACT_PHONE_DISPLAY}`,
    `電郵：${CONTACT_PUBLIC_EMAIL}`,
    `WhatsApp 對話：${urls.whatsapp}`,
    `Instagram：${igUrl}`,
    `Facebook：${fbUrl}`,
    "",
    "感謝您對活動的支持。",
    "",
    "D Festival × 幻樂空間",
  ].join("\n");

  const rulesHtml = `<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:13px;line-height:1.65;color:#422006;">
  <p style="margin:0 0 10px;font-weight:700;">重要規則（請務必閱讀）</p>
  <p style="margin:0 0 10px;">使用本預約即表示您同意本網站之<a href="${escapeHtml(urls.terms)}" style="color:#b45309;">《條款與細則》</a>及主辦方公布之內容。以下為較常出現的違規情況：</p>
  <ul style="margin:0;padding-left:18px;">
    <li style="margin:0 0 8px;"><strong>教學／與學生同行配額</strong> — 若您以此類別或相關配額預約，但實際僅作個人練習或其他非聲明之教學用途，主辦方有權取消預約，並可限制日後預約。</li>
    <li style="margin:0;"><strong>帳號須誠實使用</strong> — 不得以多個帳號重複佔用名額；亦不得利用他人（包括親友）帳號代為預約，而實際上均由同一人使用各帳號之時段。經查證屬實者，可<strong>立即取消</strong>當次免費體驗資格，並<strong>不得再於本網站提交新預約</strong>。</li>
  </ul>
</div>`;

  const driveHtml = driveUrl
    ? `<p style="margin:16px 0 8px;font-size:14px;">有關大門/Wi-Fi密碼、活動場地和設施之參考資料已整理於以下 Google Drive 資料夾：</p>
  <p style="margin:0 0 16px;">${linkButton(driveUrl, "開啟 Google Drive 資料夾")}</p>`
    : `<p style="margin:16px 0;font-size:13px;color:#78716c;">場地說明亦可於本網站「開放空間預約說明」及相關頁面查閱。</p>`;

  const navLabels: [string, string][] = [
    [urls.history, "查看我的預約紀錄"],
    [urls.aboutDf, "關於 2026 D Festival 青年鋼琴家藝術節"],
    [urls.faq, "常見問題（FAQ）"],
    [urls.directions, "如何前往幻樂空間"],
    [urls.openSpace, "開放空間預約說明"],
    [urls.privacy, "私隱條例"],
    [urls.terms, "條款與細則"],
    [urls.contact, "聯絡資訊"],
  ];

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#292524;background:#fafaf9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:20px 24px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="50%" style="vertical-align:middle;text-align:center;padding:10px 8px;">
            <img src="${escapeHtml(logoDf)}" alt="D Festival 青年鋼琴家藝術節" style="max-width:100%;max-height:96px;width:auto;height:auto;display:inline-block;object-fit:contain;" />
          </td>
          <td width="50%" style="vertical-align:middle;text-align:center;padding:10px 8px;">
            <img src="${escapeHtml(logoFms)}" alt="幻樂空間 Fantasia Music Space" style="max-width:100%;max-height:96px;width:auto;height:auto;display:inline-block;object-fit:contain;" />
          </td>
        </tr>
      </table>
      <p style="margin:0 0 12px;">${safeName} 您好，</p>
      <div style="margin:0 0 14px;padding:10px 14px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;font-size:14px;line-height:1.55;color:#065f46;">
        <p style="margin:0;font-weight:700;">預約狀態：已確認</p>
      </div>
      <p style="margin:0 0 8px;">您本次共預約 <strong>${escapeHtml(sessions)}</strong>，時段如下：</p>
      ${timeSummary.htmlBlock}
      <p style="margin:14px 0 16px;font-size:14px;">參考編號：<strong>${escapeHtml(params.requestId)}</strong></p>
      <p style="margin:0 0 12px;">${linkButton(urls.history, "查看我的預約紀錄")}</p>
      <p style="margin:0 0 4px;font-weight:600;font-size:14px;color:#44403c;">本網站連結</p>
      ${compactNavLinks(navLabels)}
      ${rulesHtml}
      ${driveHtml}
      ${cameraMail.html}
      <p style="margin:20px 0 8px;font-weight:600;font-size:14px;color:#44403c;">聯絡我們</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        電話／WhatsApp：<a href="${escapeHtml(urls.tel)}" style="color:#b45309;">+852 9163 6378</a><br />
        電郵：<a href="${escapeHtml(urls.mailTo)}" style="color:#b45309;">${escapeHtml(CONTACT_PUBLIC_EMAIL)}</a><br />
        <a href="${escapeHtml(urls.whatsapp)}" style="color:#b45309;">WhatsApp 對話</a>
        · <a href="${escapeHtml(igUrl)}" style="color:#b45309;">Instagram</a>
        · <a href="${escapeHtml(fbUrl)}" style="color:#b45309;">Facebook</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c;">感謝您對活動的支持。<br />D Festival × 幻樂空間</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
