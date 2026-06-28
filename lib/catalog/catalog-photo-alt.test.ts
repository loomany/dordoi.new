import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { catalogPhotoAlt } from "./catalog-photo-alt";

describe("catalogPhotoAlt", () => {
  it("keeps the supplier/product context and adds the slide position", () => {
    assert.equal(
      catalogPhotoAlt("  Auto Grand — автотовары  ", 1, 5),
      "Auto Grand — автотовары — 2 / 5",
    );
  });
});
