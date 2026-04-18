import { buildFallbackAlerts } from "@/backend/fallback";
import { findFloodRiskByLga } from "@/backend/data";
import { generateGeminiAlerts } from "@/backend/gemini";
import {
  FloodAlertResponse,
  PersonalizedAlertInput,
} from "@/backend/types";
import { fetchOpenMeteoFloodForecast } from "@/backend/open-meteo";
import { getLocalLanguageForState } from "@/backend/regions";
import { FloodForecastUnavailableError } from "@/backend/forecast-error";
import {
  buildFallbackEnglishExtra,
  buildPersonalizedSiteContext,
} from "@/backend/personalization";

export async function buildFloodAlertResponse(
  lga: string,
  personalized?: PersonalizedAlertInput | null,
): Promise<FloodAlertResponse | null> {
  const record = findFloodRiskByLga(lga);
  if (!record) {
    return null;
  }

  const forecast = await fetchOpenMeteoFloodForecast(record).catch(() => null);
  if (!forecast) {
    throw new FloodForecastUnavailableError();
  }

  const localLanguage = getLocalLanguageForState(record.state);
  const effectiveRecord = {
    ...record,
    risk_level: forecast.riskLevel,
    timeframe: `next ${forecast.forecastDays} days`,
  };

  const hydrologyContext = [
    `GloFAS river forecast (Open-Meteo): model grid centre (${forecast.gridLatitude.toFixed(3)}°N, ${forecast.gridLongitude.toFixed(3)}°E) for the LGA coordinates.`,
    `Peak daily ensemble-max river discharge in the window: ${forecast.peakDischargeM3s.toFixed(0)} ${forecast.dischargeUnit} on ${forecast.peakDate}.`,
  ].join(" ");

  const siteContext = personalized
    ? buildPersonalizedSiteContext(personalized)
    : undefined;
  const fallbackExtra = personalized
    ? buildFallbackEnglishExtra(personalized)
    : undefined;

  const aiAlerts = await generateGeminiAlerts(
    effectiveRecord,
    localLanguage,
    hydrologyContext,
    siteContext,
  ).catch(() => null);
  const alerts =
    aiAlerts ??
    buildFallbackAlerts(effectiveRecord, localLanguage, fallbackExtra);

  return {
    record: effectiveRecord,
    localLanguage,
    alerts,
    openMeteo: forecast,
    ...(personalized ? { personalized: true as const } : {}),
  };
}
