import { withBasePath } from "@/lib/base-path";

/** Stripe Payment Link for Sony 4K camcorder rental (HK$99). */
export const CAMERA_RENTAL_STRIPE_CHECKOUT_URL =
  process.env.BOOKING_CAMERA_RENTAL_STRIPE_URL?.trim() ||
  "https://buy.stripe.com/8x228sc1H4s13TReaPfAc0b";

/** Google Drive folder — how to use the camcorder (shown after pay-before flow & in emails). */
export const CAMERA_USAGE_GUIDE_DRIVE_URL =
  process.env.BOOKING_CAMERA_USAGE_GOOGLE_DRIVE_URL?.trim() ||
  "https://drive.google.com/drive/folders/1aQyRN2essexQXZzTfVV-lRhzy9FUNnkc?usp=sharing";

export const CAMERA_RENTAL_QR_PATH = "/images/booking/camera-rental-stripe-qr.png";
export const CAMERA_RENTAL_HERO_PATH = "/images/booking/sony-handycam-hero.png";

export function cameraRentalQrAbsUrl(): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}${withBasePath(CAMERA_RENTAL_QR_PATH)}`;
}
