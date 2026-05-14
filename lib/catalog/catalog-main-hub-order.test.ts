import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countMainCatalogHubFreePreview,
  guestFreeMainCatalogHubLimit,
  MAIN_CATALOG_HUB_MAIN_IDS,
  MAIN_CATALOG_HUB_PREVIEW_PER_OTHER_CATEGORY,
  MAIN_CATALOG_HUB_PREVIEW_WOMENS,
  mainCatalogHubPreviewCountForCategory,
  orderVendorsForMainCatalogHub,
} from "./catalog-main-hub-order";

type Vendor = {
  slug: string;
  categories: string[];
  telegram_url?: string | null;
  created_at?: string | null;
};

function v(
  slug: string,
  categories: string[],
  created_at = "2026-01-01",
): Vendor {
  return { slug, categories, created_at };
}

describe("guestFreeMainCatalogHubLimit", () => {
  it("counts 3 womens plus 1 per other category", () => {
    const expected = MAIN_CATALOG_HUB_MAIN_IDS.reduce(
      (sum, mainId) => sum + mainCatalogHubPreviewCountForCategory(mainId),
      0,
    );
    assert.equal(guestFreeMainCatalogHubLimit(), expected);
    assert.equal(
      guestFreeMainCatalogHubLimit(),
      MAIN_CATALOG_HUB_PREVIEW_WOMENS +
        (MAIN_CATALOG_HUB_MAIN_IDS.length - 1) *
          MAIN_CATALOG_HUB_PREVIEW_PER_OTHER_CATEGORY,
    );
  });
});

describe("orderVendorsForMainCatalogHub", () => {
  it("puts three womens previews first, then one per other category before tail", () => {
    const vendors: Vendor[] = [
      v("muhsina-kg", ["womens"], "2026-05-01"),
      v("lima-brand-kg", ["womens"], "2026-05-01"),
      v("bermet-factory", ["womens"], "2026-05-01"),
      v("extra-womens", ["womens"]),
      v("pkas-collection", ["mens"], "2026-05-01"),
      v("mens-b", ["mens"]),
      v("kids-a", ["kids"]),
      v("kids-b", ["kids"]),
    ];

    const ordered = orderVendorsForMainCatalogHub(vendors);
    const slugs = ordered.map((x) => x.slug);
    const previewSlugs = slugs.slice(
      0,
      countMainCatalogHubFreePreview(vendors),
    );

    assert.deepEqual(previewSlugs.slice(0, 3), [
      "muhsina-kg",
      "lima-brand-kg",
      "bermet-factory",
    ]);
    assert.ok(previewSlugs.includes("pkas-collection"));
    assert.ok(previewSlugs.includes("kids-a"));
    assert.ok(!previewSlugs.includes("extra-womens"));
    assert.ok(!previewSlugs.includes("mens-b"));
    assert.ok(slugs.indexOf("mens-b") > previewSlugs.length - 1);
  });
});
