"use server";

import { z } from "zod";

import {
  parseVendorTextWithOpenAI,
  type VendorTextModerationOutput,
} from "@/lib/ai/vendor-parser";
import { STORE_NAME_MAX_CHARS } from "@/lib/vendor/vendor-field-limits";

const moderateVendorTextInputSchema = z
  .object({
    storeTitle: z.string().trim().min(1).max(STORE_NAME_MAX_CHARS),
    rawDescription: z.string().trim().min(1).max(32_000),
    rawSupplement: z.string().trim().max(32_000).optional(),
    instagramProfileUrl: z.string().trim().max(512).optional(),
  })
  .transform((o) => ({
    storeTitle: o.storeTitle,
    rawDescription: o.rawDescription,
    rawSupplement:
      o.rawSupplement && o.rawSupplement.length > 0 ? o.rawSupplement : undefined,
    instagramProfileUrl:
      o.instagramProfileUrl && o.instagramProfileUrl.length > 0
        ? o.instagramProfileUrl
        : undefined,
  }));

export type ModerateVendorTextResult =
  | { ok: true; data: VendorTextModerationOutput }
  | { ok: false; error: string };

export type ModerateVendorTextInput = z.input<typeof moderateVendorTextInputSchema>;

/**
 * Модерация сырого текста карточки через OpenAI (без записи в БД).
 */
export async function moderateVendorTextAction(
  input: ModerateVendorTextInput,
): Promise<ModerateVendorTextResult> {
  const parsed = moderateVendorTextInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.entries(first)
        .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
        .join("; ") || parsed.error.message;
    return { ok: false, error: msg };
  }

  try {
    const data = await parseVendorTextWithOpenAI({
      storeTitle: parsed.data.storeTitle,
      rawDescription: parsed.data.rawDescription,
      rawSupplement: parsed.data.rawSupplement,
      instagramProfileUrl: parsed.data.instagramProfileUrl,
    });
    return { ok: true, data };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown error during vendor text moderation";
    return { ok: false, error: message };
  }
}
