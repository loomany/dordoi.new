import test from "node:test";
import assert from "node:assert/strict";

import { buildSafeVendorPublicDescription } from "@/lib/catalog/vendor-public-description";

test("uses catalog card description as the public vendor description source", () => {
  const description = buildSafeVendorPublicDescription({
    cardDescription:
      "Компания занимается собственным производством и предлагает оптовые поставки.",
    categoryLabel: "Женская одежда",
  });

  assert.equal(
    description,
    "Компания занимается собственным производством и предлагает оптовые поставки",
  );
});

test("falls back to a safe generic description instead of raw technical facts", () => {
  const description = buildSafeVendorPublicDescription({
    cardDescription: "",
    categoryLabel: "Женская одежда",
  });

  assert.equal(
    description,
    "Поставщик работает на рынке Дордой и предлагает оптовые товары в категории «Женская одежда».",
  );
  assert.doesNotMatch(description, /232\/17|3пр|Гоголя 191/i);
});

test("strips public contact traces and deduplicates repeated text", () => {
  const description = buildSafeVendorPublicDescription({
    cardDescription:
      "Оптовый поставщик женской одежды. Оптовый поставщик женской одежды. WhatsApp +996 555 123 456",
  });

  assert.equal(description, "Оптовый поставщик женской одежды. WhatsApp");
});
