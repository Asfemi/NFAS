import riskData from "@/data/flood-risk.json";
import { FloodRiskRecord, RegionalLanguageCode } from "@/backend/types";
import { getLocalLanguageForState } from "@/backend/regions";

const dataset = riskData as FloodRiskRecord[];

export interface LgaDirectoryEntry {
  lga: string;
  state: string;
  localLanguage: RegionalLanguageCode;
}

export function getAllLgas(): string[] {
  return dataset.map((entry) => entry.lga).sort((a, b) => a.localeCompare(b));
}

export function getLgaDirectory(): LgaDirectoryEntry[] {
  return dataset
    .map((entry) => ({
      lga: entry.lga,
      state: entry.state,
      localLanguage: getLocalLanguageForState(entry.state),
    }))
    .sort((a, b) => a.lga.localeCompare(b.lga));
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
