import {
  BilingualAlerts,
  FloodRiskRecord,
  RegionalLanguageCode,
} from "@/backend/types";
import { clampOutlook, toSmsLength } from "@/backend/sms";

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

const outlookLocalBodies: Record<
  RegionalLanguageCode,
  (record: FloodRiskRecord) => string
> = {
  ha: (record) =>
    `A cikin watanni uku masu zuwa, yankin ${record.lga} (${record.state}) yakan shiga cikin lokacin damuna inda ruwan sama ya karu. Yankunan da ke kusa da koguna ko matakai masu hanci sun fi hadarin ambaliya. Yi shirin rufe magudanar ruwa, tsare abinci da kaya daga gindin gida, kuma ka bi sanarwar hukuma. Wannan jagorar ce; ka bi NIHSA da hukumomin gaggawa.`,
  yo: (record) =>
    `Ninu oṣooṣu mẹta ti n bọ, agbegbe ${record.lga} (${record.state}) maa n mọ igbarun ojo pupọ, paapaa ni akoko ojo. Awọn abẹlẹ sunmọ odo tabi awọn ipo ti o ga julọ le ni ewu ikun omi. Ṣe iranilẹhin: ko awọn itọju omi, gbe ohun ini soke, tẹle iroyin ti ijọba ati awọn alaṣẹ. Eyi ni imọràn; ṣe afihan si NIHSA fun imọran ọficial.`,
  ig: (record) =>
    `N'ime ọnwa atọ na-abịa, mpaghara ${record.lga} (${record.state}) na-adịkarị n'oge mmiri ozuzo, karịsịa n'oge ọkọchị. Ebe dị nso osimiri ma ọ bụ ala dị ala nwere ike ịbụ ebe mmiri na-ebute nsogbu. Debanye aha: mee ka mmiri dị ọcha, chekwaa ihe, soro ozi gọọmentị. Nke a bụ ndụmọdụ; debanye aha na NIHSA makaozi ọfịịshị.`,
};

export function buildFallbackOutlook(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  englishExtra?: string,
): BilingualAlerts {
  const enCore = [
    `Over roughly the next three months, ${record.lga} (${record.state}) usually moves through Nigeria’s main rainy-season window, when many river and flash-flood risks rise even if individual weeks look calm.`,
    `Today’s model snapshot labels river stress as ${record.risk_level.toUpperCase()} for ${record.timeframe} — use that as a near-term hint, not a day-by-day schedule for the whole season.`,
    "If your area is flood-prone, expect more standing water on roads and farms after sustained rain, slower drainage, and occasional river-margin rises.",
    "What helps: clear drains and culverts early, lift grain and inputs off the floor, plan livestock movement, identify a safe route to higher ground, and follow LGA and NIHSA bulletins.",
    "This is general seasonal guidance, not a substitute for official warnings or emergency services.",
  ].join(" ");
  const en = clampOutlook(
    englishExtra ? `${enCore} Context: ${englishExtra}` : enCore,
  );
  const localText = outlookLocalBodies[localLanguage](record);
  return {
    en,
    local: clampOutlook(localText),
  };
}
