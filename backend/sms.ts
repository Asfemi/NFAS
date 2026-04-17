export const SMS_CHAR_LIMIT = 160;

export function toSmsLength(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= SMS_CHAR_LIMIT) {
    return compact;
  }

  return `${compact.slice(0, SMS_CHAR_LIMIT - 1)}…`;
}
