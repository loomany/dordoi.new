import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** RU base with per-locale overlay; missing or empty string falls back to Russian. */
function mergeMessages(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overlay)) {
    const b = base[key];
    const o = overlay[key];
    if (isObject(b) && isObject(o)) {
      out[key] = mergeMessages(b, o);
    } else {
      out[key] = o !== undefined && o !== "" ? o : b;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  const ru = (await import("../messages/ru.json")).default as Record<
    string,
    unknown
  >;

  if (locale === routing.defaultLocale) {
    return {
      locale,
      messages: ru,
      onError(error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[next-intl]", error.message);
        }
      },
    };
  }

  const loc = (await import(`../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;

  return {
    locale,
    messages: mergeMessages(ru, loc),
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[next-intl]", error.message);
      }
    },
  };
});
