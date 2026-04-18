import {
  BilingualAlerts,
  FloodRiskRecord,
  RegionalLanguageCode,
} from "@/backend/types";
import { toSmsLength } from "@/backend/sms";

const riskActionMap = {
  high: "Move valuables to higher ground and prepare to relocate now.",
  medium: "Keep drainage clear, monitor updates, and prepare an emergency bag.",
  low: "Stay alert and keep following official updates this week.",
} as const;

const localBodies: Record<
  RegionalLanguageCode,
  (record: FloodRiskRecord) => string
> = {
  ha: (record) =>
    `${record.lga}, ${record.state}: Hadarin ambaliya ${record.risk_level} cikin ${record.timeframe}. A tsaftace magudana kuma a bi sanarwa.`,
  yo: (record) =>
    `${record.lga}, ${record.state}: Ewu ikun omi ${record.risk_level} ninu ${record.timeframe}. Ko ohun pataki soke, tele iroyin.`,
  ig: (record) =>
    `${record.lga}, ${record.state}: Ihe ize ndu mmiri ${record.risk_level} n'ime ${record.timeframe}. Debe ihe bara uru n'ebe di elu, soro ozi.`,
};

export function buildFallbackAlerts(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  englishExtra?: string,
): BilingualAlerts {
  const action = riskActionMap[record.risk_level];
  const baseEn = `${record.lga}, ${record.state}: ${record.risk_level.toUpperCase()} flood risk in ${record.timeframe}. ${action}`;
  const en = englishExtra
    ? toSmsLength(`${baseEn} (${englishExtra})`)
    : toSmsLength(baseEn);
  const localText = localBodies[localLanguage](record);
  return {
    en,
    local: toSmsLength(localText),
  };
}
