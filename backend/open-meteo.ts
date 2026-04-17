import { FloodRiskRecord, RiskLevel } from "@/backend/types";

interface OpenMeteoFloodResponse {
  daily?: {
    river_discharge_max?: number[];
  };
}

const OPEN_METEO_URL = "https://flood-api.open-meteo.com/v1/flood";

function classifyRisk(maxDischarge: number): RiskLevel {
  if (maxDischarge >= 3000) {
    return "high";
  }

  if (maxDischarge >= 1200) {
    return "medium";
  }

  return "low";
}

export async function getOpenMeteoRisk(
  record: FloodRiskRecord,
): Promise<RiskLevel | null> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(record.latitude));
  url.searchParams.set("longitude", String(record.longitude));
  url.searchParams.set("daily", "river_discharge_max");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OpenMeteoFloodResponse;
  const dischargeValues = payload.daily?.river_discharge_max;
  if (!dischargeValues || dischargeValues.length === 0) {
    return null;
  }

  const maxDischarge = Math.max(
    ...dischargeValues.filter((value) => Number.isFinite(value)),
  );

  if (!Number.isFinite(maxDischarge)) {
    return null;
  }

  return classifyRisk(maxDischarge);
}
