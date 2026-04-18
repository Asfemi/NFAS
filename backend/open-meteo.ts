import {
  LgaLocation,
  OpenMeteoFloodDay,
  OpenMeteoFloodForecast,
  RiskLevel,
} from "@/backend/types";

interface OpenMeteoFloodResponse {
  latitude?: number;
  longitude?: number;
  daily?: {
    time?: string[];
    river_discharge_max?: (number | null)[];
  };
  daily_units?: {
    river_discharge_max?: string;
  };
  error?: boolean;
  reason?: string;
}

const OPEN_METEO_URL = "https://flood-api.open-meteo.com/v1/flood";
const FORECAST_DAYS = 7;

function classifyRisk(maxDischarge: number): RiskLevel {
  if (maxDischarge >= 3000) {
    return "high";
  }

  if (maxDischarge >= 1200) {
    return "medium";
  }

  return "low";
}

function buildSeries(
  times: string[],
  values: (number | null)[],
): OpenMeteoFloodDay[] {
  const days: OpenMeteoFloodDay[] = [];
  const len = Math.min(times.length, values.length);
  for (let i = 0; i < len; i += 1) {
    const v = values[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      days.push({ date: times[i], riverDischargeMaxM3s: v });
    }
  }
  return days;
}

/**
 * River discharge for the largest river in ~5 km around the point (GloFAS).
 * `cell_selection=land` picks a land cell with elevation closer to the request.
 */
export async function fetchOpenMeteoFloodForecast(
  record: LgaLocation,
): Promise<OpenMeteoFloodForecast | null> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(record.latitude));
  url.searchParams.set("longitude", String(record.longitude));
  url.searchParams.set("daily", "river_discharge_max");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("cell_selection", "land");

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as OpenMeteoFloodResponse;
  if (!response.ok || payload.error) {
    return null;
  }

  const times = payload.daily?.time ?? [];
  const rawValues = payload.daily?.river_discharge_max ?? [];
  const days = buildSeries(times, rawValues);
  if (days.length === 0) {
    return null;
  }

  let peakDischargeM3s = days[0].riverDischargeMaxM3s;
  let peakDate = days[0].date;
  for (const d of days) {
    if (d.riverDischargeMaxM3s > peakDischargeM3s) {
      peakDischargeM3s = d.riverDischargeMaxM3s;
      peakDate = d.date;
    }
  }

  const gridLat = payload.latitude ?? record.latitude;
  const gridLon = payload.longitude ?? record.longitude;
  const unit =
    payload.daily_units?.river_discharge_max?.trim() || "m³/s";

  return {
    requestedLatitude: record.latitude,
    requestedLongitude: record.longitude,
    gridLatitude: gridLat,
    gridLongitude: gridLon,
    dischargeUnit: unit,
    forecastDays: FORECAST_DAYS,
    days,
    peakDischargeM3s,
    peakDate,
    riskLevel: classifyRisk(peakDischargeM3s),
  };
}
