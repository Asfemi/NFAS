export const SMS_CHAR_LIMIT = 160;

export function toSmsLength(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= SMS_CHAR_LIMIT) {
    return compact;
  }

  return `${compact.slice(0, SMS_CHAR_LIMIT - 1)}…`;
}

/**
 * Validates Nigerian phone numbers in various formats
 * Accepts: +234XXXXXXXXXX, 0XXXXXXXXXX, 234XXXXXXXXXX
 */
export function validateNigerianPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if it's a valid Nigerian number (10-13 digits)
  if (cleaned.length < 10 || cleaned.length > 13) {
    return false;
  }

  // If it starts with country code 234, it should be 12 digits total
  if (cleaned.startsWith("234")) {
    return cleaned.length === 12;
  }

  // If it starts with 0, it should be 11 digits
  if (cleaned.startsWith("0")) {
    return cleaned.length === 11;
  }

  return false;
}

/**
 * Normalizes phone number to international format (+234XXXXXXXXXX)
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If starts with 0, replace with 234
  if (cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`;
  }

  // If starts with 234 but no +, add it
  if (cleaned.startsWith("234") && !phoneNumber.startsWith("+")) {
    return `+${cleaned}`;
  }

  // Already in +234 format
  if (phoneNumber.startsWith("+234")) {
    return phoneNumber;
  }

  // Fallback: assume it's missing country code
  return `+234${cleaned}`;
}

/**
 * Formats phone number for display (human-readable)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  // Format as +234 XXX XXX XXXX
  return normalized.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, "$1 $2 $3 $4");
}
