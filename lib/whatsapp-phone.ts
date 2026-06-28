/** Digits-only phone for WhatsApp providers (e.g. 79991234567). */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("8") && digits.length === 11) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return digits;
}

export function maskPhoneForLog(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 6) return "***";
  return `+${digits.slice(0, 1)}***${digits.slice(-4)}`;
}
