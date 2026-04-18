import { normalizePhoneToE164 } from "@/backend/phone";

export const SMS_CHAR_LIMIT = 160;

/** E.164 for Nigeria: +234 plus ten national digits (no leading 0). */
const NIGERIA_E164 = /^\+234\d{10}$/;

export function validateNigerianPhoneNumber(phone: string): boolean {
  const e164 = normalizePhoneToE164(phone);
  return e164 !== null && NIGERIA_E164.test(e164);
}

/** Returns E.164 when possible; callers should run {@link validateNigerianPhoneNumber} first for SMS routes. */
export function normalizePhoneNumber(phone: string): string {
  return normalizePhoneToE164(phone) ?? phone.trim();
}

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
