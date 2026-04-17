import riskData from "@/data/flood-risk.json";
import { FloodRiskRecord } from "@/backend/types";
import { NIGERIAN_LGAS, getLgaByName } from "@/backend/lgas";

const dataset = riskData as FloodRiskRecord[];

export function getAllLgas(): string[] {
  // Get all LGA names from the comprehensive list
  return NIGERIAN_LGAS.map((lga) => lga.name).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getAllLgasWithStates(): {
  lga: string;
  state: string;
  latitude: number;
  longitude: number;
}[] {
  return NIGERIAN_LGAS.map((lga) => ({
    lga: lga.name,
    state: lga.state,
    latitude: lga.latitude,
    longitude: lga.longitude,
  })).sort((a, b) => a.lga.localeCompare(b.lga));
}

export function findFloodRiskByLga(lga: string): FloodRiskRecord | null {
  const normalized = lga.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  // Try exact match first
  const exact = dataset.find((entry) => entry.lga.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  // Try partial match
  const partial = dataset.find((entry) =>
    entry.lga.toLowerCase().includes(normalized),
  );
  if (partial) {
    return partial;
  }

  // Try to find in LGA database and return with default risk level
  const lgaInfo = getLgaByName(normalized);
  if (lgaInfo) {
    return {
      lga: lgaInfo.name,
      state: lgaInfo.state,
      risk_level: "low",
      timeframe: "7 days",
      latitude: lgaInfo.latitude,
      longitude: lgaInfo.longitude,
    };
  }

  return null;
}

export function getLgaRiskRecord(lgaName: string): FloodRiskRecord | null {
  return findFloodRiskByLga(lgaName);
}

export function getFloodRiskStats(): {
  totalLGAs: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
} {
  return {
    totalLGAs: NIGERIAN_LGAS.length,
    highRiskCount: dataset.filter((d) => d.risk_level === "high").length,
    mediumRiskCount: dataset.filter((d) => d.risk_level === "medium").length,
    lowRiskCount: dataset.filter((d) => d.risk_level === "low").length,
  };
}
