import type { Metadata } from "next";
import { DirectionsPageView } from "@/components/directions-page-view";
import { directionsZhHK } from "@/lib/i18n/strings/zh-HK/directions-ui";

export const metadata: Metadata = {
  title: directionsZhHK.metaTitle,
  description: directionsZhHK.metaDescription,
};

export default function DirectionsPage() {
  return <DirectionsPageView />;
}
