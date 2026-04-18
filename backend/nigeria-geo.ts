import type { LgaLocation } from "@/backend/types";

/**
 * MIT dataset: state → LGAs → wards with coordinates.
 * @see https://github.com/temikeezy/nigeria-geojson-data
 * @see https://medium.com/@temikolawole/mapping-nigeria-a-free-developer-ready-api-for-states-lgas-and-wards-with-coordinates-9ad3c8812bb8
 */
export const NIGERIA_GEO_FULL_JSON_URL =
  "https://temikeezy.github.io/nigeria-geojson-data/data/full.json";

export class NigeriaGeoDatasetError extends Error {
  constructor(
    message = "Could not load the Nigerian LGA dataset. Try again in a few minutes.",
  ) {
    super(message);
    this.name = "NigeriaGeoDatasetError";
  }
}

export function isNigeriaGeoDatasetError(
  value: unknown,
): value is NigeriaGeoDatasetError {
  return value instanceof NigeriaGeoDatasetError;
}

interface WardFeature {
  name: string;
  latitude: unknown;
  longitude: unknown;
}

interface LgaFeature {
  name: string;
  wards: WardFeature[];
}

interface StateFeature {
  state: string;
  lgas: LgaFeature[];
}

function centroidFromWards(wards: WardFeature[]): { lat: number; lon: number } | null {
  let sumLat = 0;
  let sumLon = 0;
  let n = 0;
  for (const w of wards) {
    const lat = Number(w.latitude);
    const lon = Number(w.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      sumLat += lat;
      sumLon += lon;
      n += 1;
    }
  }
  if (n === 0) {
    return null;
  }
  return { lat: sumLat / n, lon: sumLon / n };
}

function parseFullJson(payload: unknown): LgaLocation[] {
  if (!Array.isArray(payload)) {
    throw new NigeriaGeoDatasetError("Dataset root is not an array.");
  }

  const rows: LgaLocation[] = [];

  for (const stateBlock of payload as StateFeature[]) {
    if (!stateBlock || typeof stateBlock.state !== "string" || !Array.isArray(stateBlock.lgas)) {
      continue;
    }
    const state = stateBlock.state.trim();
    if (!state) {
      continue;
    }

    for (const lga of stateBlock.lgas) {
      if (!lga || typeof lga.name !== "string" || !Array.isArray(lga.wards)) {
        continue;
      }
      const lgaName = lga.name.trim();
      if (!lgaName) {
        continue;
      }
      const c = centroidFromWards(lga.wards);
      if (!c) {
        continue;
      }
      rows.push({
        lga: lgaName,
        state,
        latitude: c.lat,
        longitude: c.lon,
      });
    }
  }

  if (rows.length === 0) {
    throw new NigeriaGeoDatasetError("Dataset contained no LGA coordinates.");
  }

  return rows;
}

/**
 * Loads all LGAs with centroid coordinates (mean of ward points) from the public JSON.
 * Uses Next.js `fetch` caching (`revalidate: 86400`) so responses are refreshed at most daily.
 */
export async function loadLgaDataset(): Promise<LgaLocation[]> {
  const response = await fetch(NIGERIA_GEO_FULL_JSON_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new NigeriaGeoDatasetError(
      `Dataset HTTP ${response.status}: ${response.statusText}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new NigeriaGeoDatasetError("Dataset response was not valid JSON.");
  }

  return parseFullJson(json);
}
