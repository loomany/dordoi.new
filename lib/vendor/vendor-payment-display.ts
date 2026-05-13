/** Плейсхолдеры в БД / импорте — не показываем как реальные условия. */
const VENDOR_TERM_UNSET_NORMALIZED = new Set(["", "—", "-", "не указано"]);

export function isVendorTermUnset(value: string | null | undefined): boolean {
  if (value == null) return true;
  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е");
  return VENDOR_TERM_UNSET_NORMALIZED.has(normalized);
}

/** @deprecated Используйте `isVendorTermUnset`. */
export const isVendorPaymentUnset = isVendorTermUnset;

export function displayVendorTerm(
  value: string | null | undefined,
  fallback: string,
): string {
  if (value == null || isVendorTermUnset(value)) return fallback;
  return value.trim();
}

export function displayVendorPaymentMethods(
  value: string | null | undefined,
  fallback: string,
): string {
  return displayVendorTerm(value, fallback);
}

/** Дефолты для импорта и русской витрины. */
export const VENDOR_PAYMENT_DEFAULT_RU =
  "Наличный расчёт, перевод на банковскую карту";
export const VENDOR_MOQ_DEFAULT_RU = "Обсуждается индивидуально";
export const VENDOR_RETURNS_DEFAULT_RU =
  "Условия обсуждаются индивидуально";
