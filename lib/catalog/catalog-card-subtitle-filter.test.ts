import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  impliedMainCategoryIdsFromSubtitle,
  resolveCatalogCardSubtitleForCategoryFilter,
} from "./catalog-card-subtitle-filter";

const tMain = (id: string) =>
  (
    ({
      womens: "Женская одежда",
      mens: "Мужская одежда",
      kids: "Детская одежда",
      footwear: "Обувь",
    }) as Record<string, string>
  )[id] ?? id;

describe("resolveCatalogCardSubtitleForCategoryFilter", () => {
  it("replaces womens label when mens filter is active", () => {
    const subtitle = resolveCatalogCardSubtitleForCategoryFilter({
      storeTitle: "Dordoi.odejda.kg",
      categories: ["womens", "mens", "footwear"],
      categoryFilterSlugs: ["mens"],
      aiOrFallbackSubtitle: "Женская одежда",
      tMainCategory: tMain,
    });
    assert.equal(subtitle, "Мужская одежда");
  });

  it("keeps neutral AI subtitle under category filter", () => {
    const subtitle = resolveCatalogCardSubtitleForCategoryFilter({
      storeTitle: "BIGSPORT",
      categories: ["womens", "mens"],
      categoryFilterSlugs: ["mens"],
      aiOrFallbackSubtitle: "Производство в Бишкеке",
      tMainCategory: tMain,
    });
    assert.equal(subtitle, "Производство в Бишкеке");
  });

  it("keeps mens-specific descriptive subtitle", () => {
    const subtitle = resolveCatalogCardSubtitleForCategoryFilter({
      storeTitle: "PKAS",
      categories: ["mens"],
      categoryFilterSlugs: ["mens"],
      aiOrFallbackSubtitle: "Оптовая продажа мужских брюк",
      tMainCategory: tMain,
    });
    assert.equal(subtitle, "Оптовая продажа мужских брюк");
  });

  it("replaces womens mention in AI subtitle for mens filter", () => {
    const subtitle = resolveCatalogCardSubtitleForCategoryFilter({
      storeTitle: "Shop",
      categories: ["womens", "mens"],
      categoryFilterSlugs: ["mens"],
      aiOrFallbackSubtitle: "Оптовая продажа женской одежды",
      tMainCategory: tMain,
    });
    assert.equal(subtitle, "Мужская одежда");
  });

  it("returns base subtitle when no filter", () => {
    const subtitle = resolveCatalogCardSubtitleForCategoryFilter({
      storeTitle: "Shop",
      categories: ["womens", "mens"],
      categoryFilterSlugs: [],
      aiOrFallbackSubtitle: "Женская одежда",
      tMainCategory: tMain,
    });
    assert.equal(subtitle, "Женская одежда");
  });
});

describe("impliedMainCategoryIdsFromSubtitle", () => {
  it("detects exact main labels", () => {
    assert.deepEqual(
      impliedMainCategoryIdsFromSubtitle("Женская одежда", tMain),
      ["womens"],
    );
  });
});
