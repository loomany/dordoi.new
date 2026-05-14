import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSafeVendorPublicSlug,
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
});
