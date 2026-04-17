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

export interface AlertBundle {
  en: string;
  ha: string;
  yo: string;
  ig: string;
}

export interface FloodAlertResponse {
  record: FloodRiskRecord;
  alerts: AlertBundle;
}

export interface SMSSubscription {
  phoneNumber: string;
  lga: string;
  state: string;
  preferredLanguage: LanguageCode;
  createdAt: string;
  active: boolean;
}

export interface SMSAlertRequest {
  phoneNumber: string;
  lga: string;
  preferredLanguage?: LanguageCode;
}
