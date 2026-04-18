export type RiskLevel = "low" | "medium" | "high";

/** LGA catalogue entry: coordinates only; flood risk comes from Open-Meteo. */
export interface LgaLocation {
  lga: string;
  state: string;
  latitude: number;
  longitude: number;
}

/** Full row used for SMS copy after a live forecast is applied. */
export interface FloodRiskRecord extends LgaLocation {
  risk_level: RiskLevel;
  timeframe: string;
}

export type LanguageCode = "en" | "ha" | "yo" | "ig";

/** Regional SMS language for the LGA (not English). */
export type RegionalLanguageCode = "ha" | "yo" | "ig";

/** Only English plus the dominant language for the LGA’s state/region. */
export interface BilingualAlerts {
  en: string;
  local: string;
}

/** One day of GloFAS river discharge (ensemble max) for the model grid cell nearest the LGA. */
export interface OpenMeteoFloodDay {
  date: string;
  riverDischargeMaxM3s: number;
}

/** Live 7-day slice from Open-Meteo Flood API (GloFAS) for the LGA coordinates. */
export interface OpenMeteoFloodForecast {
  requestedLatitude: number;
  requestedLongitude: number;
  /** WGS84 centre of the grid cell used (may differ slightly from the request). */
  gridLatitude: number;
  gridLongitude: number;
  dischargeUnit: string;
  forecastDays: number;
  days: OpenMeteoFloodDay[];
  peakDischargeM3s: number;
  peakDate: string;
  riskLevel: RiskLevel;
}

/** Outcome of sending bilingual SMS via SMSGate (Android SMS Gateway, https://sms-gate.app/). */
export interface SmsGatewayDeliveryResult {
  attempted: boolean;
  skippedReason?: "not_configured" | "invalid_phone";
  phoneE164?: string;
  english: "sent" | "failed" | "skipped";
  local: "sent" | "failed" | "skipped";
  errors: string[];
  messageIds?: string[];
}

export interface FloodAlertResponse {
  record: FloodRiskRecord;
  /** Auto-derived from state: SW → Yoruba, SE/SS → Igbo, North/NC → Hausa. */
  localLanguage: RegionalLanguageCode;
  alerts: BilingualAlerts;
  /** Always present: advisory is based on this forecast, not static catalogue risk. */
  openMeteo: OpenMeteoFloodForecast;
  /** True when phone + optional farm/community context was used to tailor the advisory. */
  personalized?: boolean;
  /** Present when `personalized` was requested: SMS send via Android SMS Gateway (if configured). */
  smsDelivery?: SmsGatewayDeliveryResult;
}

/** Optional SMS signup context (phone is validated but not sent to the model). */
export interface PersonalizedAlertInput {
  phone: string;
  farmInfo?: string;
  extraInfo?: string;
}
