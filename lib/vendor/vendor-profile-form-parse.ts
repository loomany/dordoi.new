import { z } from "zod";

import { digitsOnly, isIntlMobileDigits } from "@/lib/phone";
import { routing } from "@/i18n/routing";
import * as L from "@/lib/vendor/vendor-field-limits";

function normWa(raw: string): string {
  return digitsOnly(raw.trim());
}

const formSchema = z.object({
  locale: z.string().min(2).max(8),
  store_name: z
    .string()
    .trim()
    .min(2, "Название: минимум 2 символа")
    .max(L.STORE_NAME_MAX_CHARS, `Название: не больше ${L.STORE_NAME_MAX_CHARS} символов`),
  location_row: z
    .string()
    .trim()
    .min(1, "Укажите локацию на рынке")
    .max(L.LOCATION_ROW_MAX_CHARS),
  description: z
    .string()
    .trim()
    .min(5, "Краткое описание: минимум 5 символов")
    .max(
      L.DESCRIPTION_CARD_MAX_CHARS,
      `Краткое описание: не больше ${L.DESCRIPTION_CARD_MAX_CHARS} символов`,
    ),
  description_detail: z.string().trim().max(L.DESCRIPTION_DETAIL_MAX_CHARS),
  categories: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Категория не может быть пустой")
        .max(
          L.CATEGORY_LABEL_MAX_CHARS,
          `Категория: не больше ${L.CATEGORY_LABEL_MAX_CHARS} символов`,
        ),
    )
    .min(1, "Укажите хотя бы одну категорию")
    .max(
      L.VENDOR_CATEGORY_LIST_MAX,
      `Не больше ${L.VENDOR_CATEGORY_LIST_MAX} категорий`,
    ),
  min_batch: z.string().trim().min(1).max(L.MIN_BATCH_MAX_CHARS),
  payment_methods: z.string().trim().min(1).max(L.PAYMENT_MAX_CHARS),
  delivery_help: z.boolean(),
  whatsapp_1: z.string().trim(),
  whatsapp_2: z.string(),
  instagram_url: z.string().trim().max(L.CONTACT_FIELD_MAX_CHARS),
  telegram_url: z.string().trim().max(L.CONTACT_FIELD_MAX_CHARS),
  samples_available: z.boolean(),
  samples_note: z.string().trim().max(L.SAMPLES_NOTE_MAX_CHARS),
  returns_policy: z
    .string()
    .trim()
    .min(3, "Условия по браку: минимум 3 символа")
    .max(L.RETURNS_POLICY_MAX_CHARS),
});

export type VendorProfileDbPatch = {
  store_name: string;
  location_row: string;
  description: string;
  description_detail: string | null;
  categories: string[];
  min_batch: string;
  payment_methods: string;
  delivery_help: boolean;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  samples_available: boolean;
  samples_note: string | null;
  returns_policy: string;
};

export type ParsedVendorProfileForm =
  | { ok: true; locale: string; patch: VendorProfileDbPatch }
  | { ok: false; message: string };

export function parseVendorProfileFormData(formData: FormData): ParsedVendorProfileForm {
  const categoriesRaw = formData
    .getAll("categories")
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const parsed = formSchema.safeParse({
    locale: String(formData.get("locale") ?? "").trim(),
    store_name: String(formData.get("store_name") ?? ""),
    location_row: String(formData.get("location_row") ?? ""),
    description: String(formData.get("description") ?? ""),
    description_detail: String(formData.get("description_detail") ?? ""),
    categories: categoriesRaw,
    min_batch: String(formData.get("min_batch") ?? ""),
    payment_methods: String(formData.get("payment_methods") ?? ""),
    delivery_help: formData.get("delivery_help") === "on",
    whatsapp_1: String(formData.get("whatsapp_1") ?? ""),
    whatsapp_2: String(formData.get("whatsapp_2") ?? ""),
    instagram_url: String(formData.get("instagram_url") ?? ""),
    telegram_url: String(formData.get("telegram_url") ?? ""),
    samples_available: formData.get("samples_available") === "on",
    samples_note: String(formData.get("samples_note") ?? ""),
    returns_policy: String(formData.get("returns_policy") ?? ""),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(" ");
    return { ok: false, message: msg || "Проверьте поля формы." };
  }

  const v = parsed.data;

  if (!routing.locales.includes(v.locale as (typeof routing.locales)[number])) {
    return { ok: false, message: "Некорректная локаль." };
  }

  const wa1 = normWa(v.whatsapp_1);
  const appSource = String(formData.get("vendor_application_source") ?? "telegram").trim();

  if (appSource === "google_places") {
    const wa2 = normWa(v.whatsapp_2);
    let whatsapp_2: string | null = null;
    if (wa2.length > 0) {
      if (!isIntlMobileDigits(wa2)) {
        return {
          ok: false,
          message:
            "Дополнительный WhatsApp: номер не распознан — исправьте или оставьте поле пустым.",
        };
      }
      whatsapp_2 = wa2;
    }

    const ig = v.instagram_url.trim();
    const tg = v.telegram_url.trim();
    const samplesNote = v.samples_note.trim();
    const descDetail = v.description_detail.trim();

    return {
      ok: true,
      locale: v.locale,
      patch: {
        store_name: v.store_name,
        location_row: v.location_row,
        description: v.description,
        description_detail: descDetail.length > 0 ? descDetail : null,
        categories: v.categories,
        min_batch: v.min_batch,
        payment_methods: v.payment_methods,
        delivery_help: v.delivery_help,
        whatsapp_1: wa1.length > 0 && isIntlMobileDigits(wa1) ? wa1 : null,
        whatsapp_2,
        instagram_url: ig.length > 0 ? ig : null,
        telegram_url: tg.length > 0 ? tg : null,
        samples_available: v.samples_available,
        samples_note: samplesNote.length > 0 ? samplesNote : null,
        returns_policy: v.returns_policy,
      },
    };
  }

  if (!isIntlMobileDigits(wa1)) {
    return {
      ok: false,
      message:
        "Основной WhatsApp: укажите номер в международном формате (как при входе на сайт).",
    };
  }

  const wa2 = normWa(v.whatsapp_2);
  let whatsapp_2: string | null = null;
  if (wa2.length > 0) {
    if (!isIntlMobileDigits(wa2)) {
      return {
        ok: false,
        message:
          "Дополнительный WhatsApp: номер не распознан — исправьте или оставьте поле пустым.",
      };
    }
    whatsapp_2 = wa2;
  }

  const ig = v.instagram_url.trim();
  const tg = v.telegram_url.trim();
  const samplesNote = v.samples_note.trim();
  const descDetail = v.description_detail.trim();

  return {
    ok: true,
    locale: v.locale,
    patch: {
      store_name: v.store_name,
      location_row: v.location_row,
      description: v.description,
      description_detail: descDetail.length > 0 ? descDetail : null,
      categories: v.categories,
      min_batch: v.min_batch,
      payment_methods: v.payment_methods,
      delivery_help: v.delivery_help,
      whatsapp_1: wa1,
      whatsapp_2,
      instagram_url: ig.length > 0 ? ig : null,
      telegram_url: tg.length > 0 ? tg : null,
      samples_available: v.samples_available,
      samples_note: samplesNote.length > 0 ? samplesNote : null,
      returns_policy: v.returns_policy,
    },
  };
}
