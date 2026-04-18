export type RiskLevel = "low" | "medium" | "high";

export interface FloodRiskRecord {
  lga: string;
  state: string;
  risk_level: RiskLevel;
  timeframe: string;
  latitude: number;
  longitude: number;
}

export type LanguageCode = "en" | "ha" | "yo" | "ig";

/** Regional SMS language for the LGA (not English). */
export type RegionalLanguageCode = "ha" | "yo" | "ig";

/** Only English plus the dominant language for the LGA’s state/region. */
export interface BilingualAlerts {
  en: string;
  local: string;
}

export interface FloodAlertResponse {
  record: FloodRiskRecord;
  /** Auto-derived from state: SW → Yoruba, SE/SS → Igbo, North/NC → Hausa. */
  localLanguage: RegionalLanguageCode;
  alerts: BilingualAlerts;
}
