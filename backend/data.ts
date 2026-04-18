import { loadLgaDataset } from "@/backend/nigeria-geo";
import { LgaLocation, RegionalLanguageCode } from "@/backend/types";
import { getLocalLanguageForState } from "@/backend/regions";

export interface LgaDirectoryEntry {
  lga: string;
  state: string;
  localLanguage: RegionalLanguageCode;
}

export async function getAllLgas(): Promise<string[]> {
  const dataset = await loadLgaDataset();
  const unique = new Set(dataset.map((entry) => entry.lga));
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export async function getLgaDirectory(): Promise<LgaDirectoryEntry[]> {
  const dataset = await loadLgaDataset();
  return dataset
    .map((entry) => ({
      lga: entry.lga,
      state: entry.state,
      localLanguage: getLocalLanguageForState(entry.state),
    }))
    .sort((a, b) => {
      const byLga = a.lga.localeCompare(b.lga);
      if (byLga !== 0) {
        return byLga;
      }
      return a.state.localeCompare(b.state);
    });
}

/**
 * Resolves an LGA name against the Nigeria geo dataset (centroid per LGA from ward points).
 * Duplicate LGA names across states: deterministic pick by alphabetical state, then first entry.
 */
export async function findFloodRiskByLga(lga: string): Promise<LgaLocation | null> {
  const dataset = await loadLgaDataset();
  const normalized = lga.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const sameName = dataset
    .filter((entry) => entry.lga.toLowerCase() === normalized)
    .sort((a, b) => a.state.localeCompare(b.state));

  if (sameName.length === 1) {
    return sameName[0];
  }
  if (sameName.length > 1) {
    return sameName[0];
  }

  const partial = dataset
    .filter((entry) => entry.lga.toLowerCase().includes(normalized))
    .sort((a, b) => {
      const byLga = a.lga.localeCompare(b.lga);
      if (byLga !== 0) {
        return byLga;
      }
      return a.state.localeCompare(b.state);
    });

  return partial[0] ?? null;
}
