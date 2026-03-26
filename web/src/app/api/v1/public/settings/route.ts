import { getPublicSettings } from "@/lib/settings";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const settings = await getPublicSettings();
  return jsonOk({ settings });
}
