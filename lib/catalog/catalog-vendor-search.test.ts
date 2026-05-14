import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterVendorsByCatalogSearch,
  matchesCatalogSearch,
  normalizeCatalogSearchQuery,
  vendorCatalogSearchHaystack,
} from "./catalog-vendor-search";

describe("catalog-vendor-search", () => {
  it("normalizes whitespace in query", () => {
    assert.equal(normalizeCatalogSearchQuery("  брюки   опт  "), "брюки опт");
  });

  it("matches store name and AI brand", () => {
    const vendor = {
      store_name: "Магазин",
      slug: "pkas-collection",
      description: null,
      categories: ["mens"],
      location_row: "ряд 12",
      instagram_url: null,
      parsed_ai_data: {
        display: {
          catalogBrandName: "PKAS",
          description: "Оптовая продажа мужских брюк",
          subtitle: "Опт",
        },
      },
    };
    const haystack = vendorCatalogSearchHaystack(vendor);
    assert.equal(matchesCatalogSearch(haystack, "pkas"), true);
    assert.equal(matchesCatalogSearch(haystack, "брюк"), true);
    assert.equal(matchesCatalogSearch(haystack, "ряд 12"), true);
    assert.equal(matchesCatalogSearch(haystack, "женск"), false);
  });

  it("requires all tokens", () => {
    const vendors = [
      {
        store_name: "Firdaus",
        slug: "optom-dordoi-firdaus",
        description: "мужская спортивная одежда",
        categories: ["mens"],
        location_row: null,
        instagram_url: null,
        parsed_ai_data: null,
      },
    ];
    assert.equal(filterVendorsByCatalogSearch(vendors, "firdaus спорт").length, 1);
    assert.equal(filterVendorsByCatalogSearch(vendors, "firdaus женск").length, 0);
  });
});
