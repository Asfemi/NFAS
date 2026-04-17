import { AlertBundle, FloodRiskRecord } from "@/backend/types";
import { toSmsLength } from "@/backend/sms";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function buildPrompt(record: FloodRiskRecord): string {
  return [
    "You generate flood advisory alerts for Nigeria.",
    "Input:",
    `LGA: ${record.lga}`,
    `State: ${record.state}`,
    `Risk level: ${record.risk_level}`,
    `Timeframe: ${record.timeframe}`,
    "",
    "Output a JSON object with keys exactly: en, ha, yo, ig.",
    "Rules:",
    "1) Each value must be a single SMS-ready message, max 160 chars.",
    "2) Clear action words, no hashtags, no markdown.",
    "3) Keep local names as given.",
    "4) Use plain language in each target language.",
  ].join("\n");
}

function parseJsonFromModel(raw: string): AlertBundle | null {
  const trimmed = raw.trim();
  const candidate = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(candidate) as Partial<AlertBundle>;
    if (!parsed.en || !parsed.ha || !parsed.yo || !parsed.ig) {
      return null;
    }

    return {
      en: toSmsLength(parsed.en),
      ha: toSmsLength(parsed.ha),
      yo: toSmsLength(parsed.yo),
      ig: toSmsLength(parsed.ig),
    };
  } catch {
    return null;
  }
}

export async function generateGeminiAlerts(
  record: FloodRiskRecord,
): Promise<AlertBundle | null> {
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
      contents: [{ parts: [{ text: buildPrompt(record) }] }],
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

  return parseJsonFromModel(text);
}
