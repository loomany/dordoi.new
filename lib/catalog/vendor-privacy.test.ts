import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  lockedVendorContactAvailability,
  safeVendorItemListName,
  stripLockedVendorContacts,
} from "./vendor-privacy";

const vendor = {
  id: "0f55275a-916b-4496-9419-7e1c4cf2a9e9",
  slug: "postavshik-zhenskoy-odezhdy-a9e9",
  seo_slug: "asso-corsets",
  store_name: "Asso, магазин женской одежды",
  description: "Оптовый поставщик без прямых контактов в тексте",
  description_detail: "Дополнительное описание",
  categories: ["womens"],
  logo_url: "https://example.com/logo.webp",
  product_photos: [],
  location_row: "Мурас спорт -1-й проход, 176",
  phone_number: "996709072606",
  min_batch: null,
  payment_methods: null,
  delivery_help: true,
  whatsapp_1: "996709072606",
  whatsapp_2: "996700000000",
  instagram_url: "https://instagram.com/asso.corsets",
  telegram_url: "https://t.me/ASSO",
  google_maps_uri: "https://maps.google.com/?cid=123",
  google_place_id: "abc123",
  two_gis_uri: "https://2gis.kg/bishkek/firm/70000001113650587",
  yandex_maps_uri: "https://yandex.com/maps/-/abc",
  samples_available: false,
  samples_note: null,
  returns_policy: null,
  created_at: "2026-05-12T21:47:48.587+00:00",
  parsed_ai_data: {
    display: {
      catalogBrandName: "Asso",
      description: "Brand snapshot",
    },
  },
};

const privateMarkers = [
  "996709072606",
  "996700000000",
  "wa.me",
  "tel:",
  "t.me/ASSO",
  "instagram.com/asso.corsets",
  "maps.google.com",
  "2gis.kg",
  "yandex.com/maps",
  "Мурас спорт",
  "phone_number",
  "whatsapp_1",
  "telegram_url",
  "instagram_url",
  "google_maps_uri",
  "two_gis_uri",
  "yandex_maps_uri",
  "Asso",
];

describe("vendor privacy helpers", () => {
  it("keeps only contact-channel availability for locked UI", () => {
    assert.deepEqual(lockedVendorContactAvailability(vendor), {
      whatsappPrimaryAvailable: true,
      whatsappSecondaryAvailable: true,
      telegramAvailable: true,
      instagramAvailable: true,
      phoneAvailable: true,
      googleMapsAvailable: true,
      twoGisAvailable: true,
      yandexMapsAvailable: true,
    });
  });

  it("strips locked vendor contacts, exact location, socials, maps, and store identity", () => {
    const redacted = stripLockedVendorContacts(vendor);
    const serialized = JSON.stringify(redacted);

    for (const marker of privateMarkers) {
      assert.equal(
        serialized.includes(marker),
        false,
        `locked vendor payload should not contain ${marker}`,
      );
    }

    assert.equal(redacted.slug, vendor.slug);
    assert.equal(redacted.id, vendor.id);
  });

  it("uses generic names for locked vendor ItemList entries", () => {
    const redacted = stripLockedVendorContacts(vendor);
    assert.equal(
      safeVendorItemListName(redacted, "Женская одежда"),
      "Женская одежда #3497",
    );
  });
});
