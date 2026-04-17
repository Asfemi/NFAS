import riskData from "@/data/flood-risk.json";
import { FloodRiskRecord } from "@/backend/types";

const dataset = riskData as FloodRiskRecord[];

export function getAllLgas(): string[] {
  return dataset.map((entry) => entry.lga).sort((a, b) => a.localeCompare(b));
}

export function findFloodRiskByLga(lga: string): FloodRiskRecord | null {
  const normalized = lga.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const exact = dataset.find((entry) => entry.lga.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  const partial = dataset.find((entry) =>
    entry.lga.toLowerCase().includes(normalized),
  );

  return partial ?? null;
}
