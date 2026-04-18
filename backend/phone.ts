/** Basic validation for Nigeria-style numbers (local or +234). Not a full libphonenumber check. */
export function isLikelyValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return false;
  }
  return true;
}
