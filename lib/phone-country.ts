import { digitsOnly } from "@/lib/phone";

export type PhoneCountryId = "RU" | "KZ" | "KG" | "UZ" | "TJ";

export const PHONE_COUNTRY_ORDER: PhoneCountryId[] = [
  "RU",
  "KZ",
  "KG",
  "UZ",
  "TJ",
];

/** Короткая подпись для селекта: флаг и префикс (без дубля букв ISO рядом с флагом). */
export function countrySelectLabel(id: PhoneCountryId): string {
  const m = PHONE_COUNTRY_META[id];
  return `${m.flag}\u00A0+${m.dial}`;
}

export const PHONE_COUNTRY_META: Record<
  PhoneCountryId,
  { dial: string; flag: string }
> = {
  RU: { dial: "7", flag: "🇷🇺" },
  KZ: { dial: "7", flag: "🇰🇿" },
  KG: { dial: "996", flag: "🇰🇬" },
  UZ: { dial: "998", flag: "🇺🇿" },
  TJ: { dial: "992", flag: "🇹🇯" },
};

export function nationalMaxLen(id: PhoneCountryId): number {
  return id === "RU" || id === "KZ" ? 10 : 9;
}

/** Только национальная часть (без кода страны). */
export function clampNationalDigits(
  id: PhoneCountryId,
  raw: string,
): string {
  return digitsOnly(raw).slice(0, nationalMaxLen(id));
}

/** Полный международный номер без «+», только цифры. */
export function toInternationalDigits(
  id: PhoneCountryId,
  nationalDigits: string,
): string {
  const d = clampNationalDigits(id, nationalDigits);
  switch (id) {
    case "RU":
    case "KZ":
      return `7${d}`;
    case "KG":
      return `996${d}`;
    case "UZ":
      return `998${d}`;
    case "TJ":
      return `992${d}`;
  }
}

export function isNationalComplete(
  id: PhoneCountryId,
  nationalDigits: string,
): boolean {
  return clampNationalDigits(id, nationalDigits).length === nationalMaxLen(id);
}

/** Маска только для национальной части (без префикса +7 / +996 и т.д.). */
export function formatNationalMasked(
  id: PhoneCountryId,
  nationalDigits: string,
): string {
  const d = clampNationalDigits(id, nationalDigits);
  switch (id) {
    case "RU":
    case "KZ":
      return maskRuKz(d);
    case "KG":
      return maskTripleBlocks(d);
    case "UZ":
    case "TJ":
      return maskNineUzTj(d);
  }
}

function maskRuKz(d: string): string {
  if (!d) return "";
  if (d.length <= 3) {
    return d.length === 3 ? `(${d})` : `(${d}`;
  }
  const a = d.slice(0, 3);
  const rest = d.slice(3);
  let out = `(${a})`;
  if (!rest) return out;
  const b = rest.slice(0, 3);
  out += ` ${b}`;
  const rest2 = rest.slice(3);
  if (!rest2) return out;
  const c = rest2.slice(0, 2);
  out += `-${c}`;
  const e = rest2.slice(2, 4);
  if (e) out += `-${e}`;
  return out;
}

function maskTripleBlocks(d: string): string {
  const parts = [
    d.slice(0, 3),
    d.slice(3, 6),
    d.slice(6, 9),
  ].filter((p) => p.length > 0);
  return parts.join(" ");
}

function maskNineUzTj(d: string): string {
  if (!d) return "";
  const a = d.slice(0, 2);
  if (d.length <= 2) return a;
  const b = d.slice(2, 5);
  let out = `${a} ${b}`;
  const c = d.slice(5, 7);
  if (c) out += ` ${c}`;
  const e = d.slice(7, 9);
  if (e) out += ` ${e}`;
  return out;
}

export function localeToDefaultCountry(locale: string): PhoneCountryId {
  switch (locale) {
    case "kk":
      return "KZ";
    case "kg":
      return "KG";
    case "uz":
      return "UZ";
    case "tj":
      return "TJ";
    default:
      return "RU";
  }
}

/**
 * Разбор вставки полного номера или только национальной части.
 * Возвращает обновлённые страна и национальные цифры.
 */
export function parsePhonePaste(
  text: string,
  currentCountry: PhoneCountryId,
): { country: PhoneCountryId; national: string } {
  const d = digitsOnly(text);

  if (d.startsWith("996") && d.length >= 12) {
    return { country: "KG", national: d.slice(3, 12) };
  }
  if (d.startsWith("998") && d.length >= 12) {
    return { country: "UZ", national: d.slice(3, 12) };
  }
  if (d.startsWith("992") && d.length >= 12) {
    return { country: "TJ", national: d.slice(3, 12) };
  }
  if (d.startsWith("7") && d.length >= 11) {
    const national = d.slice(1, 11);
    return {
      country: currentCountry === "KZ" ? "KZ" : "RU",
      national,
    };
  }

  return {
    country: currentCountry,
    national: clampNationalDigits(currentCountry, d),
  };
}
