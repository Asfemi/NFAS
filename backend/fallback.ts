import { AlertBundle, FloodRiskRecord } from "@/backend/types";
import { toSmsLength } from "@/backend/sms";

const riskActionMap = {
  high: "Move valuables to higher ground and prepare to relocate now.",
  medium: "Keep drainage clear, monitor updates, and prepare an emergency bag.",
  low: "Stay alert and keep following official updates this week.",
} as const;

export function buildFallbackAlerts(record: FloodRiskRecord): AlertBundle {
  const action = riskActionMap[record.risk_level];

  return {
    en: toSmsLength(
      `${record.lga}, ${record.state}: ${record.risk_level.toUpperCase()} flood risk in ${record.timeframe}. ${action}`,
    ),
    ha: toSmsLength(
      `${record.lga}, ${record.state}: Hadarin ambaliya ${record.risk_level} cikin ${record.timeframe}. A tsaftace magudana kuma a bi sanarwa.`,
    ),
    yo: toSmsLength(
      `${record.lga}, ${record.state}: Ewu ikun omi ${record.risk_level} ninu ${record.timeframe}. Ko ohun pataki soke, tele iroyin.`,
    ),
    ig: toSmsLength(
      `${record.lga}, ${record.state}: Ihe ize ndu mmiri ${record.risk_level} n'ime ${record.timeframe}. Debe ihe bara uru n'ebe di elu, soro ozi.`,
    ),
  };
}
