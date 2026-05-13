import type {
  VendorCardCommerceCopy,
  VendorTradeType,
} from "@/lib/catalog/vendor-card-display";

function isVendorTradeType(v: unknown): v is VendorTradeType {
  return v === "wholesale" || v === "retail" || v === "hybrid";
}

function commerceFromUnknown(v: unknown): VendorCardCommerceCopy {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const pick = (key: string): string | undefined => {
    const x = o[key];
    return typeof x === "string" && x.trim().length > 0 ? x.trim() : undefined;
  };
  return {
    delivery: pick("delivery"),
    payment: pick("payment"),
    samples: pick("samples"),
    defects: pick("defects"),
  };
}

function asObjectRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** JSONB иногда приходит строкой; редко — обёртка с другим регистром ключа `display`. */
function coerceParsedAiRoot(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      return asObjectRecord(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }
  return asObjectRecord(raw);
}

/**
 * Объект `display` из JSONB: сам объект, строка с JSON, или массив из одного объекта.
 * Без непустого `description` возвращаем null.
 */
function coerceDisplayRecord(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") {
    try {
      return coerceDisplayRecord(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    return coerceDisplayRecord(raw[0]);
  }
  const o = asObjectRecord(raw);
  if (!o) return null;
  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (!description) return null;
  return o;
}

/** Берём `display` из обёртки или плоский объект карточки в корне колонки. */
function resolveAiDisplayPayload(
  root: Record<string, unknown>,
): Record<string, unknown> | null {
  const nested = coerceDisplayRecord(root.display ?? root.Display);
  if (nested) return nested;
  return coerceDisplayRecord(root);
}

/**
 * Если в `parsed_ai_data` есть валидный `display` от ИИ — берём оттуда текст/тип/commerce.
 * `tradeType`: если в JSON нет или значение не из enum — вернётся `null`, вызывающий код подставит эвристику.
 */
export function getAiCatalogDisplayOverlay(
  parsedAiData: unknown,
): {
  catalogBrandName: string | null;
  description: string;
  subtitle: string | null;
  tradeType: VendorTradeType | null;
  commerce: VendorCardCommerceCopy;
} | null {
  const root = coerceParsedAiRoot(parsedAiData);
  if (!root) return null;
  const d = resolveAiDisplayPayload(root);
  if (!d) return null;
  const description =
    typeof d.description === "string" ? d.description.trim() : "";
  if (!description) return null;
  const brandRaw = d.catalogBrandName ?? d.catalog_brand_name;
  const catalogBrandName =
    typeof brandRaw === "string" && brandRaw.trim().length > 0
      ? brandRaw.trim()
      : null;
  const sub = d.subtitle ?? d.Subtitle;
  const subtitle =
    sub === null
      ? null
      : typeof sub === "string"
        ? sub.trim() || null
        : null;
  const rawTt = d.tradeType ?? d.trade_type;
  const tradeType = isVendorTradeType(rawTt) ? rawTt : null;
  const commerce = commerceFromUnknown(d.commerce ?? d.Commerce);
  return {
    catalogBrandName,
    description,
    subtitle,
    tradeType,
    commerce,
  };
}
