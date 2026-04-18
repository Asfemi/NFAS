export const SMS_CHAR_LIMIT = 160;

/** Max characters for on-page seasonal outlook text (not SMS). */
export const OUTLOOK_MAX_CHARS = 1400;

export function toSmsLength(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= SMS_CHAR_LIMIT) {
    return compact;
  }

  return `${compact.slice(0, SMS_CHAR_LIMIT - 1)}…`;
}

export function clampOutlook(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= OUTLOOK_MAX_CHARS) {
    return compact;
  }

  return `${compact.slice(0, OUTLOOK_MAX_CHARS - 1)}…`;
}
