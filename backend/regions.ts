import type { RegionalLanguageCode } from "@/backend/types";

const YORUBA_STATES = new Set(
  ["lagos", "ogun", "oyo", "osun", "ondo", "ekiti"].map((s) => s.toLowerCase()),
);

const IGBO_STATES = new Set(
  [
    "abia",
    "anambra",
    "ebonyi",
    "enugu",
    "imo",
    "akwa ibom",
    "bayelsa",
    "cross river",
    "delta",
    "edo",
    "rivers",
  ].map((s) => s.toLowerCase()),
);

export function getLocalLanguageForState(state: string): RegionalLanguageCode {
  const key = state.trim().toLowerCase();
  if (YORUBA_STATES.has(key)) {
    return "yo";
  }
  if (IGBO_STATES.has(key)) {
    return "ig";
  }
  return "ha";
}
