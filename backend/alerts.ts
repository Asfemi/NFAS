import { buildFallbackAlerts } from "@/backend/fallback";
import { findFloodRiskByLga } from "@/backend/data";
import { generateGeminiAlerts } from "@/backend/gemini";
import { FloodAlertResponse } from "@/backend/types";

export async function buildFloodAlertResponse(
  lga: string,
): Promise<FloodAlertResponse | null> {
  const record = findFloodRiskByLga(lga);
  if (!record) {
    return null;
  }

  const aiAlerts = await generateGeminiAlerts(record).catch(() => null);
  const alerts = aiAlerts ?? buildFallbackAlerts(record);

  return {
    record,
    alerts,
  };
}
