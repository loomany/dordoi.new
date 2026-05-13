import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import type {
  VendorCardCommerceCopy,
  VendorTradeType,
} from "@/lib/catalog/vendor-card-display";
import { sanitizeAiCatalogBrandName } from "@/lib/catalog/catalog-card-title";
import {
  DESCRIPTION_CARD_MAX_CHARS,
  PAYMENT_MAX_CHARS,
  RETURNS_POLICY_MAX_CHARS,
  SAMPLES_NOTE_MAX_CHARS,
  STORE_NAME_MAX_CHARS,
} from "@/lib/vendor/vendor-field-limits";

const COMMERCE_LINE_MAX = Math.min(512, PAYMENT_MAX_CHARS);

/** Сырой ввод для модерации текста карточки (без фото). */
export type RawVendorTextModerationInput = {
  /** Название магазина — контекст; не нужно дублировать в `description`. */
  storeTitle: string;
  /** Грязое описание / анкета с контактами и «водой». */
  rawDescription: string;
  /** Доп. текст: условия, прайс, заметки поставщика. */
  rawSupplement?: string | null;
  /**
   * URL профиля Instagram — только подсказка для `catalogBrandName`.
   * Не воспроизводить URL и handle дословно в ответе.
   */
  instagramProfileUrl?: string | null;
};

/** Результат ИИ для полей `ParsedVendorCardData`, которые заполняются из текста. */
export type VendorTextModerationOutput = {
  /**
   * Короткое публичное имя для шапки карточки, если `storeTitle` — заглушка («Магазин женской одежды»).
   * Не копируй Instagram-handle; без `_kg`, суффиксов ников и URL.
   */
  catalogBrandName: string | null;
  subtitle: string | null;
  description: string;
  tradeType: VendorTradeType;
  commerce: VendorCardCommerceCopy;
};

/**
 * Ответ модели: `commerce.*` — `null`, если в исходниках нет явной информации
 * (UI подставит i18n-дефолты). Пустые строки недопустимы — только null или непустая строка.
 */
export const vendorTextModerationCommerceSchema = z.object({
  delivery: z.union([z.string().min(1).max(COMMERCE_LINE_MAX), z.null()]),
  payment: z.union([z.string().min(1).max(COMMERCE_LINE_MAX), z.null()]),
  samples: z.union([z.string().min(1).max(SAMPLES_NOTE_MAX_CHARS), z.null()]),
  defects: z.union([z.string().min(1).max(RETURNS_POLICY_MAX_CHARS), z.null()]),
});

export const vendorTextModerationResultSchema = z.object({
  catalogBrandName: z.union([
    z.string().min(2).max(STORE_NAME_MAX_CHARS),
    z.null(),
  ]),
  subtitle: z.union([z.string().min(1).max(120), z.null()]),
  description: z.string().min(1).max(DESCRIPTION_CARD_MAX_CHARS),
  tradeType: z.enum(["wholesale", "retail", "hybrid"]),
  commerce: vendorTextModerationCommerceSchema,
});

export type VendorTextModerationModelResult = z.infer<
  typeof vendorTextModerationResultSchema
>;

function commerceNullToOptional(
  c: VendorTextModerationModelResult["commerce"],
): VendorCardCommerceCopy {
  const trimOrUndef = (v: string | null): string | undefined => {
    if (v === null) return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  };
  return {
    delivery: trimOrUndef(c.delivery),
    payment: trimOrUndef(c.payment),
    samples: trimOrUndef(c.samples),
    defects: trimOrUndef(c.defects),
  };
}

function defaultVendorTextModel(): string {
  return (process.env.OPENAI_VENDOR_TEXT_MODEL ?? "gpt-4o-mini").trim();
}

function buildSystemInstructions(): string {
  return [
    "Ты строгий B2B-модератор и копирайтер маркетплейса оптовых поставщиков (рынок Дордой).",
    "Тебе передают сырой текст от продавца. Твоя задача — вернуть только JSON по заданной схеме, без markdown и пояснений.",
    "",
    "Очистка и безопасность:",
    "- В полях description, subtitle, commerce не включай: номера телефонов, email, URL, мессенджеры, @username.",
    "- Отдельная строка `instagramProfileUrl` в запросе — только подсказка для поля catalogBrandName; сам URL и точный ник в ответ не копируй.",
    "- Не добавляй контакты и ссылки от себя.",
    "",
    "Поле description:",
    "- Продающая выжимка по сути бизнеса и ассортимента: **2–4 полноценных предложения**, если в исходнике есть материал.",
    "- Ориентир по объёму: **от ~180 до ~380 символов** (не обязан заполнять до потолка, но не одно короткое предложение, если фактов больше).",
    "- Без «воды», без обращений «звоните/пишите», без контактов.",
    `- Жёсткий потолок: не длиннее ${DESCRIPTION_CARD_MAX_CHARS} символов.`,
    "- Не дублируй дословно название магазина в начале, если это не нужно для смысла.",
    "",
    "Поле catalogBrandName (витринное имя, не юридическое):",
    "- Если `storeTitle` уже в форме «Бренд, магазин женской одежды» — **верни null** (сайт сам оставит только «Бренд» до запятой).",
    "- Только если `storeTitle` — **чистая заглушка** без бренда до запятой (например «Магазин женской одежды», «Магазин оптовой женской одежды») — предложи короткое нейтральное имя (1–4 слова), по смыслу из текста и/или из пути Instagram (если передан instagramProfileUrl).",
    "- Не повторяй дословно Instagram-handle, не включай @, URL, «instagram», цифры из ника, суффиксы вроде _kg, _official, .shop.",
    "- Имя не должно позволять однозначно найти профиль в Instagram по строке поиска.",
    "- Если в `storeTitle` уже узнаваемый бренд (не шаблон) — верни null.",
    "- Если честно вывести нельзя — null.",
    "",
    "Поле subtitle:",
    "- Одна строка **другого угла**, чем catalogBrandName и storeTitle: география, ниша ассортимента, формат («Производство в Бишкеке»), но **не** повтор общей формулы «оптовый магазин женской одежды», если она уже следует из названия.",
    "- Если единственное что получается — та же общая фраза про «магазин женской одежды» — верни null.",
    "",
    "Поле tradeType (ровно одно значение):",
    '- "wholesale" — явный опт, минимальные партии, работа с байерами, «от коробки/ряда» без розничной выдачи поштучно.',
    '- "retail" — явная розница, мелкий розничный формат без оптовых условий.',
    '- "hybrid" — и опт, и розница, или текст неоднозначен.',
    "",
    "Объект commerce:",
    "- Если в исходном тексте есть явная информация о доставке, оплате, образцах или браке/возвратах — перепиши в сжатом деловом стиле на русском.",
    "- Если явной информации по подполю нет — верни null для этого подполя (не выдумывай).",
    "- Не включай в commerce контакты и ссылки.",
  ].join("\n");
}

function buildUserPayload(input: RawVendorTextModerationInput): string {
  const supplement = input.rawSupplement?.trim();
  const ig = input.instagramProfileUrl?.trim();
  return [
    "Проанализируй данные продавца и верни JSON по схеме.",
    "",
    `storeTitle: ${input.storeTitle.trim()}`,
    "",
    "rawDescription:",
    input.rawDescription.trim(),
    supplement
      ? ["", "rawSupplement:", supplement].join("\n")
      : "",
    ig
      ? [
          "",
          "instagramProfileUrl (только контекст для catalogBrandName; не копируй URL и ник дословно):",
          ig,
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export type ParseVendorTextOptions = {
  /** Передать из Server Action / route для отмены долгого запроса. */
  signal?: AbortSignal;
  /** Переопределить модель (по умолчанию `OPENAI_VENDOR_TEXT_MODEL` или gpt-4o-mini). */
  model?: string;
};

/**
 * Модерация и нормализация текстов карточки через OpenAI Structured Outputs (Zod → json_schema).
 * Требует `OPENAI_API_KEY`. Используется из Server Actions и из офлайн-скриптов (без `server-only`).
 */
export async function parseVendorTextWithOpenAI(
  input: RawVendorTextModerationInput,
  options?: ParseVendorTextOptions,
): Promise<VendorTextModerationOutput> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = (options?.model ?? defaultVendorTextModel()).trim();
  if (!model) {
    throw new Error("Vendor text model is empty");
  }

  const client = new OpenAI({ apiKey });

  const systemInstructions = buildSystemInstructions();

  const completion = await client.chat.completions.parse(
    {
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: buildUserPayload(input) },
      ],
      response_format: zodResponseFormat(
        vendorTextModerationResultSchema,
        "vendor_text_moderation",
      ),
    },
    { signal: options?.signal },
  );

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    const finish = completion.choices[0]?.finish_reason;
    throw new Error(
      `OpenAI returned no parsed vendor text (finish_reason=${finish ?? "unknown"})`,
    );
  }

  const brandSanitized =
    parsed.catalogBrandName === null
      ? null
      : sanitizeAiCatalogBrandName(parsed.catalogBrandName.trim());

  return {
    catalogBrandName: brandSanitized,
    subtitle: parsed.subtitle?.trim() || null,
    description: parsed.description.trim(),
    tradeType: parsed.tradeType,
    commerce: commerceNullToOptional(parsed.commerce),
  };
}
