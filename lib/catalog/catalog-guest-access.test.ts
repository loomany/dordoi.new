import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GUEST_FREE_CATALOG_CARDS,
  GUEST_FREE_CATEGORY_PAGE_CARDS,
  guestFreeCatalogCardLimit,
  isCatalogCardLockedForGuest,
} from "./catalog-guest-access";
import { guestFreeMainCatalogHubLimit } from "./catalog-main-hub-order";

describe("guestFreeCatalogCardLimit", () => {
  it("returns hub preview limit for general catalog", () => {
    assert.equal(guestFreeCatalogCardLimit(false), guestFreeMainCatalogHubLimit());
  });

  it("returns 3 for womens category page", () => {
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["womens"],
        totalVendorsInFilter: 50,
      }),
      3,
    );
  });

  it("returns 2 for other category filters with pinned preview", () => {
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["mens"],
        totalVendorsInFilter: 50,
      }),
      GUEST_FREE_CATEGORY_PAGE_CARDS,
    );
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["bags-leather"],
        totalVendorsInFilter: 5,
      }),
      GUEST_FREE_CATEGORY_PAGE_CARDS,
    );
  });

  it("returns 0 for full-paywall categories like sports-outdoors", () => {
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["sports-outdoors"],
        totalVendorsInFilter: 5,
      }),
      0,
    );
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["spo-sports-gear"],
        totalVendorsInFilter: 3,
      }),
      0,
    );
  });

  it("returns general catalog limit when category filter has no vendors", () => {
    assert.equal(
      guestFreeCatalogCardLimit(true, {
        categoryFilterSlugs: ["mens"],
        totalVendorsInFilter: 0,
      }),
      GUEST_FREE_CATALOG_CARDS,
    );
  });
});

describe("isCatalogCardLockedForGuest", () => {
  it("locks from index 3 on womens category pages", () => {
    assert.equal(
      isCatalogCardLockedForGuest({
        hasFullAccess: false,
        globalIndex: 2,
        freeLimit: 3,
      }),
      false,
    );
    assert.equal(
      isCatalogCardLockedForGuest({
        hasFullAccess: false,
        globalIndex: 3,
        freeLimit: 3,
      }),
      true,
    );
  });

  it("locks from index 2 on default category pages", () => {
    assert.equal(
      isCatalogCardLockedForGuest({
        hasFullAccess: false,
        globalIndex: 1,
        freeLimit: GUEST_FREE_CATEGORY_PAGE_CARDS,
      }),
      false,
    );
    assert.equal(
      isCatalogCardLockedForGuest({
        hasFullAccess: false,
        globalIndex: 2,
        freeLimit: GUEST_FREE_CATEGORY_PAGE_CARDS,
      }),
      true,
    );
  });

  it("locks every card when free limit is 0", () => {
    assert.equal(
      isCatalogCardLockedForGuest({
        hasFullAccess: false,
        globalIndex: 0,
        freeLimit: 0,
      }),
      true,
    );
  });
});
