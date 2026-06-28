import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildVendorSuppliersSeoCopy,
  isSafeVendorPublicSlug,
  vendorPublicStoreLabel,
  vendorCatalogRobotsPolicy,
  vendorSuppliersSeoPath,
  vendorSuppliersSeoRobotsPolicy,
} from "./vendor-public-seo";

describe("vendor-public-seo", () => {
  it("treats opaque postavshik slugs as safe", () => {
    assert.equal(
      isSafeVendorPublicSlug("postavshik-zhenskoy-odezhdy-a1b2"),
      true,
    );
    assert.equal(isSafeVendorPublicSlug("muhsina-kg"), false);
  });

  it("catalog profiles are noindex; suppliers pages are indexable", () => {
    assert.equal(vendorCatalogRobotsPolicy(), "noindex,follow");
    assert.equal(vendorSuppliersSeoRobotsPolicy(), "index,follow");
  });

  it("builds suppliers SEO path", () => {
    assert.equal(vendorSuppliersSeoPath("muhsina-kg"), "/suppliers/muhsina-kg");
  });

  it("uses the truthful store label and category in supplier SEO copy", () => {
    const t = (key: string, values: Record<string, string> = {}) =>
      `${key}:${values.store ?? ""}:${values.category ?? ""}`;
    const copy = buildVendorSuppliersSeoCopy({
      t,
      storeLabel: vendorPublicStoreLabel("  Auto   Grand  ", "Supplier #0001"),
      categoryPhrase: "auto parts",
    });

    assert.equal(
      copy.title,
      "publicSeo.suppliersMetaTitleWithCategory:Auto Grand:auto parts",
    );
    assert.equal(
      copy.description,
      "publicSeo.suppliersMetaDescriptionWithCategory:Auto Grand:auto parts",
    );
  });

  it("uses a localized numbered fallback when the store name is absent", () => {
    assert.equal(
      vendorPublicStoreLabel("  ", "Жеткирүүчү №0042"),
      "Жеткирүүчү №0042",
    );
  });
});
