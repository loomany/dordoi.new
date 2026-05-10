/** Оставить только цифры. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Нормализация телефона для хранения и GREEN-API (без +), например 79991234567.
 */
export function normalizePhone(input: string): string {
  return digitsOnly(input);
}

/** Формат E.164 для Supabase Auth (+79991234567). */
export function toE164Digits(digits: string): string {
  return `+${digits}`;
}

/** Отображение в UI: к номеру из БД (только цифры) добавляется префикс «+». */
export function formatPhoneDisplay(input: string | null | undefined): string {
  const raw = String(input ?? "").trim();
  const d = digitsOnly(raw);
  if (!d) {
    return raw;
  }
  return `+${d}`;
}

/** Международный формат только цифрами: 7XXXXXXXXXX, 996XXXXXXXXX, … */
const INTL_MOBILE =
  /^(?:7\d{10}|996\d{9}|998\d{9}|992\d{9})$/;

export function assertValidPhoneDigits(digits: string): void {
  if (!INTL_MOBILE.test(digits)) {
    throw new PhoneValidationError("INVALID_PHONE");
  }
}

/** Тот же допуск, что для входа по OTP и анкеты в Telegram. */
export function isIntlMobileDigits(digits: string): boolean {
  return INTL_MOBILE.test(digits);
}

export class PhoneValidationError extends Error {
  readonly code = "INVALID_PHONE";
  constructor(message: string) {
    super(message);
    this.name = "PhoneValidationError";
  }
}
