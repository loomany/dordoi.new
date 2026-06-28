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
  it("emits a privacy-safe LocalBusiness for public supplier pages", () => {
    const jsonLd = buildVendorSeoLocalBusinessJsonLd(vendor, "ru", {
      name: "Поставщик женской одежды на рынке Дордой",
      description: "Контакт доступен через сервис Dordoi.help.",
    });
    const serialized = JSON.stringify(jsonLd);

    assert.equal(jsonLd["@type"], "ProfilePage");
    assert.equal(
      (jsonLd.mainEntity as Record<string, unknown>)["@type"],
      "LocalBusiness",
    );
    for (const marker of [
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

  it("emits only allowlisted visible media objects", () => {
    const jsonLd = buildVendorSeoLocalBusinessJsonLd(vendor, "ru", {
      name: "Asso, магазин женской одежды",
      description: "Публичное описание поставщика.",
      category: "Женская одежда",
      mediaSectionName: "Фото и видео",
      primaryImageUrl:
        "https://supabase.dordoi.help/storage/v1/object/public/vendor-media/asso.webp",
      videoUrls: [
        "https://supabase.dordoi.help/storage/v1/object/public/vendor-videos/asso.mp4",
        "https://old-project.supabase.co/storage/v1/object/public/vendor-videos/old.mp4",
        "http://supabase.dordoi.help/storage/v1/object/public/vendor-videos/insecure.mp4",
      ],
    });
    const serialized = JSON.stringify(jsonLd);
    const business = jsonLd.mainEntity as Record<string, unknown>;

    assert.equal(business.category, "Женская одежда");
    assert.equal((business.image as Record<string, unknown>)["@type"], "ImageObject");
    assert.equal(
      ((business.video as Record<string, unknown>[])[0])["@type"],
      "VideoObject",
    );
    assert.equal(serialized.includes("vendor-videos/asso.mp4"), true);
    assert.equal(serialized.includes("old-project.supabase.co"), false);
    assert.equal(serialized.includes("/insecure.mp4"), false);
    assert.equal(serialized.includes("uploadDate"), false);
    assert.equal(serialized.includes("telephone"), false);
    assert.equal(serialized.includes("streetAddress"), false);
  });
});
