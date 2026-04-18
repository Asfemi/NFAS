import {
  BilingualAlerts,
  FloodRiskRecord,
  RegionalLanguageCode,
} from "@/backend/types";
import { toSmsLength } from "@/backend/sms";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function buildPrompt(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  hydrologyContext?: string,
  siteContext?: string,
): string {
  const localName =
    localLanguage === "ha"
      ? "Hausa"
      : localLanguage === "yo"
        ? "Yoruba"
        : "Igbo";

  return [
    "You generate flood advisory alerts for Nigeria.",
    "Input:",
    `LGA: ${record.lga}`,
    `State: ${record.state}`,
    `Risk level: ${record.risk_level}`,
    `Timeframe: ${record.timeframe}`,
    ...(hydrologyContext
      ? [
          `Hydrology (use for wording; do not invent different numbers): ${hydrologyContext}`,
        ]
      : []),
    ...(siteContext ? [`Site / subscriber context:\n${siteContext}`] : []),
    `Primary local language for this area: ${localName} (code: ${localLanguage})`,
    "",
    `Output a JSON object with keys exactly: "en" and "${localLanguage}".`,
    `The "${localLanguage}" value must be the same advisory in ${localName}.`,
    "Rules:",
    "1) Each value must be a single SMS-ready message, max 160 chars.",
    "2) Clear action words, no hashtags, no markdown.",
    "3) Keep local names as given.",
    "4) Use plain language appropriate for community SMS.",
    "5) If farm, crops, livestock, equipment, or community layout details are given, tailor concrete protective steps to that situation.",
    "6) Never include phone numbers, bank details, or national IDs in the SMS strings.",
  ].join("\n");
}

function parseJsonFromModel(
  raw: string,
  localLanguage: RegionalLanguageCode,
): BilingualAlerts | null {
  const trimmed = raw.trim();
  const candidate = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(candidate) as Record<string, string | undefined>;
    const en = parsed.en;
    const local = parsed[localLanguage];
    if (!en || !local) {
      return null;
    }

    return {
      en: toSmsLength(en),
      local: toSmsLength(local),
    };
  } catch {
    return null;
  }
}

export async function generateGeminiAlerts(
  record: FloodRiskRecord,
  localLanguage: RegionalLanguageCode,
  hydrologyContext?: string,
  siteContext?: string,
): Promise<BilingualAlerts | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(record, localLanguage, hydrologyContext, siteContext) },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
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

  return parseJsonFromModel(text, localLanguage);
}
