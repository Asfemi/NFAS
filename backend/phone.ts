/** Basic validation for Nigeria-style numbers (local or +234). Not a full libphonenumber check. */
export function isLikelyValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return false;
  }
  return true;
}

/**
 * Normalizes to E.164 for SMS APIs. Nigeria: `080…` / `234…` / ten-digit mobile → `+234…`.
 * Other regions: keeps `+` plus digits when already international.
 */
export function normalizePhoneToE164(raw: string): string | null {
  if (!isLikelyValidPhone(raw)) {
    return null;
  }

  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("234") && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `+234${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
