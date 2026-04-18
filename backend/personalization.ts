import type { PersonalizedAlertInput } from "@/backend/types";

function clampText(raw: string, max: number): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * Text passed to the model for farm/community tailoring.
 * Phone digits are intentionally omitted from this string.
 */
export function buildPersonalizedSiteContext(
  input: PersonalizedAlertInput,
): string {
  const lines = [
    "The subscriber has requested SMS flood alerts. Do not include any phone number digits in the advisory text.",
  ];
  if (input.farmInfo?.trim()) {
    lines.push(`Farm or operation: ${clampText(input.farmInfo, 420)}`);
  }
  if (input.extraInfo?.trim()) {
    lines.push(`Community or site detail: ${clampText(input.extraInfo, 420)}`);
  }
  return lines.join("\n");
}

export function buildFallbackEnglishExtra(
  input: PersonalizedAlertInput,
): string | undefined {
  const parts: string[] = [];
  if (input.farmInfo?.trim()) {
    parts.push(clampText(input.farmInfo, 70));
  }
  if (input.extraInfo?.trim()) {
    parts.push(clampText(input.extraInfo, 70));
  }
  if (parts.length === 0) {
    return "Tailored SMS requested.";
  }
  return parts.join(" · ");
}
