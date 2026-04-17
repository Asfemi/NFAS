import { buildFallbackAlerts } from "@/backend/fallback";
import { findFloodRiskByLga } from "@/backend/data";
import { generateGeminiAlerts } from "@/backend/gemini";
import { FloodAlertResponse } from "@/backend/types";
import { getOpenMeteoRisk } from "@/backend/open-meteo";

export async function buildFloodAlertResponse(
  lga: string,
): Promise<FloodAlertResponse | null> {
  const record = findFloodRiskByLga(lga);
  if (!record) {
    return null;
  }

  const liveRisk = await getOpenMeteoRisk(record).catch(() => null);
  const effectiveRecord = liveRisk
    ? {
        ...record,
        risk_level: liveRisk,
        timeframe: "next 7 days",
      }
    : record;

  const aiAlerts = await generateGeminiAlerts(effectiveRecord).catch(() => null);
  const alerts = aiAlerts ?? buildFallbackAlerts(effectiveRecord);

  return {
    record: effectiveRecord,
    alerts,
  };
}
