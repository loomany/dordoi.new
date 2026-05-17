import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildVendorSeoLocalBusinessJsonLd } from "./vendor-local-business-jsonld";
import type { PublishedVendorRow } from "./published-vendors";

const vendor: PublishedVendorRow = {
  id: "0f55275a-916b-4496-9419-7e1c4cf2a9e9",
  slug: "postavshik-zhenskoy-odezhdy-a9e9",
  seo_slug: "asso-corsets",
  store_name: "Asso, магазин женской одежды",
  description: "Brand description",
  description_detail: "Brand detail",
  categories: ["womens"],
  logo_url: "https://example.com/logo.webp",
  product_photos: [],
  location_row: "Мурас спорт -1-й проход, 176",
  phone_number: "996709072606",
  min_batch: null,
  payment_methods: null,
  delivery_help: true,
  whatsapp_1: "996709072606",
  whatsapp_2: null,
  instagram_url: "https://instagram.com/asso.corsets",
  telegram_url: "https://t.me/ASSO",
  google_maps_uri: "https://maps.google.com/?cid=123",
  google_place_id: "abc123",
  samples_available: false,
  samples_note: null,
  returns_policy: null,
  created_at: "2026-05-12T21:47:48.587+00:00",
  parsed_ai_data: null,
};

describe("vendor JSON-LD privacy", () => {
  it("does not emit LocalBusiness contacts for public supplier pages", () => {
    const jsonLd = buildVendorSeoLocalBusinessJsonLd(vendor, "ru", {
      name: "Поставщик женской одежды на рынке Дордой",
      description: "Контакт доступен через сервис Dordoi.help.",
    });
    const serialized = JSON.stringify(jsonLd);

    assert.equal(jsonLd["@type"], "ProfilePage");
    for (const marker of [
      "LocalBusiness",
      "telephone",
      "sameAs",
      "streetAddress",
      "address",
      "996709072606",
      "wa.me",
      "tel:",
      "t.me/ASSO",
      "instagram.com/asso.corsets",
      "Мурас спорт",
      "Asso, магазин женской одежды",
    ]) {
      assert.equal(
        serialized.includes(marker),
        false,
        `supplier JSON-LD should not contain ${marker}`,
      );
    }
  });
});
