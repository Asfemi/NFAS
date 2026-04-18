import {
  BilingualFloodContent,
  FloodRiskRecord,
  RegionalLanguageCode,
} from "@/backend/types";
import { clampOutlook, toSmsLength } from "@/backend/sms";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function buildDualPrompt(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  hydrologyContext: string | undefined,
  siteContext: string | undefined,
  calendarHint: string,
): string {
  const localName =
    localLanguage === "ha"
      ? "Hausa"
      : localLanguage === "yo"
        ? "Yoruba"
        : "Igbo";

  return [
    "You help Nigerian farmers and communities with flood risk communication.",
    `Calendar context (for seasonal wording only): ${calendarHint}`,
    "",
    "Location and risk inputs:",
    `LGA: ${record.lga}`,
    `State: ${record.state}`,
    `Current modelled risk label (from river forecast): ${record.risk_level}`,
    `Near-term model window described as: ${record.timeframe}`,
    ...(hydrologyContext
      ? [
          `Hydrology snapshot (use faithfully for near-term wording; do not invent different numbers): ${hydrologyContext}`,
        ]
      : []),
    ...(siteContext ? [`Subscriber / site context:\n${siteContext}`] : []),
    `Primary local language for this area: ${localName} (code: ${localLanguage}).`,
    "",
    "Return ONE JSON object with exactly this shape (keys and nesting must match):",
    '{ "sms": { "en": string, "local": string }, "outlook": { "en": string, "local": string } }',
    "",
    "Field meanings:",
    '- "sms": two ultra-short SMS strings (max 160 characters each, single segment). Plain language, actionable, no markdown.',
    '- "outlook": two SHORT paragraphs (English and local) giving a practical ~3 MONTH seasonal flood outlook for this LGA/state in Nigeria.',
    "",
    "Outlook rules:",
    "1) Explain typical rainy-season behaviour for this broad region, whether the area is generally flood-prone, what people can expect in the coming months, and practical preparedness (drains, storage, livestock, crops, travel, early warnings).",
    "2) Tie the opening sentence lightly to the current hydrology snapshot, then broaden to seasonal expectations — do not pretend the 7-day river chart is a 90-day deterministic forecast.",
    "3) Each outlook string: about 350–900 characters (never above 1200). No bullet markdown; plain sentences.",
    "4) If farm/community details were provided, weave in one or two concrete, relevant suggestions.",
    "5) End with a light advisory disclaimer (one short phrase) that this is guidance and official sources (e.g. NIHSA, LEMA) should be followed for emergencies.",
    "6) Never include phone numbers, bank details, or national IDs in any field.",
    `7) In both "local" fields, write fully in ${localName}.`,
  ].join("\n");
}

function parseDualPayload(raw: string): BilingualFloodContent | null {
  const trimmed = raw.trim();
  const candidate = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(candidate) as {
      sms?: { en?: string; local?: string };
      outlook?: { en?: string; local?: string };
    };

    const smsEn = parsed.sms?.en;
    const smsLocal = parsed.sms?.local;
    const outEn = parsed.outlook?.en;
    const outLocal = parsed.outlook?.local;

    if (!smsEn || !smsLocal || !outEn || !outLocal) {
      return null;
    }

    return {
      sms: {
        en: toSmsLength(smsEn),
        local: toSmsLength(smsLocal),
      },
      outlook: {
        en: clampOutlook(outEn),
        local: clampOutlook(outLocal),
      },
    };
  } catch {
    return null;
  }
}

export async function generateGeminiFloodBundle(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  hydrologyContext?: string,
  siteContext?: string,
): Promise<BilingualFloodContent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const calendarHint = new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildDualPrompt(
                record,
                localLanguage,
                hydrologyContext,
                siteContext,
                calendarHint,
              ),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return null;
  }

  return parseDualPayload(text);
}
