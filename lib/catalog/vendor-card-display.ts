/**
 * Нормализованная модель карточки вендора в каталоге / превью админки.
 * Сырые поля БД маппятся сюда; UI подмешивает i18n-дефолты для пустых `commerce.*`.
 */

export type VendorTradeType = "wholesale" | "retail" | "hybrid";

export type VendorCardCommerceCopy = {
  delivery?: string;
  payment?: string;
  samples?: string;
  defects?: string;
};

export type ParsedVendorCardData = {
  storeTitle: string;
  /** Витринное имя из ИИ (JSON в `parsed_ai_data`); в UI может заменить заглушку `storeTitle`. */
  catalogBrandName?: string | null;
  subtitle: string | null;
  description: string;
  tradeType: VendorTradeType;
  commerce: VendorCardCommerceCopy;
  logoUrl: string | null;
  categories: string[];
  /** Публичный Instagram; ссылка нормализуется в UI (`https://`). */
  instagramUrl: string | null;
};

export type VendorRowForCardInference = {
  min_batch?: string | null;
  payment_methods?: string | null;
  delivery_help?: boolean;
  samples_available?: boolean;
  samples_note?: string | null;
  returns_policy?: string | null;
};

/**
 * TODO: заменить на колонку из БД / ответ ИИ, когда пайплайн будет готов.
 * Сейчас: непустой `min_batch` → опт, иначе гибрид (розницу без ИИ не угадываем).
 */
export function inferVendorTradeType(
  row: Pick<VendorRowForCardInference, "min_batch">,
): VendorTradeType {
  const moq = row.min_batch?.trim();
  if (moq && moq.length > 0) {
    return "wholesale";
  }
  return "hybrid";
}

/** Строки для карточки из существующих полей анкеты; пустые → дефолты в UI через i18n. */
export function commerceCopyFromVendorRow(
  row: VendorRowForCardInference,
): VendorCardCommerceCopy {
  const payment = row.payment_methods?.trim();
  const samplesNote = row.samples_note?.trim();
  const returns = row.returns_policy?.trim();

  let samples: string | undefined;
  if (samplesNote) {
    samples = samplesNote;
  } else if (row.samples_available) {
    samples = undefined;
  }

  return {
    delivery: undefined,
    payment: payment || undefined,
    samples,
    defects: returns || undefined,
  };
}
