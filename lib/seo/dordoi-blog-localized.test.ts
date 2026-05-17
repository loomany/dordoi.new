import assert from "node:assert/strict";
import test from "node:test";

import {
  blogPostPathsByLocale,
  blogPostSlugForLocale,
  duplicateLocalizedBlogSlugs,
} from "@/lib/seo/dordoi-blog-localized";
import { hreflangAlternatesFromLocalePaths } from "@/lib/hreflang";

test("localized guide slugs use route locale slugs", () => {
  assert.equal(
    blogPostSlugForLocale("dordoi-optom-polnyy-gid", "kg"),
    "dordoi-dununon-toluk-koldonmo",
  );
  assert.equal(
    blogPostSlugForLocale("dordoi-optom-polnyy-gid", "tj"),
    "dordoi-yakluht-dasturi-purra",
  );
});

test("localized blog paths are self-locale paths", () => {
  const paths = blogPostPathsByLocale("dordoi-optom-polnyy-gid");
  assert.equal(paths.ru, "/blog/dordoi-optom-polnyy-gid");
  assert.equal(paths.kk, "/blog/dordoi-koterme-tolyk-nuskaulyk");
  assert.equal(paths.kg, "/blog/dordoi-dununon-toluk-koldonmo");
  assert.equal(paths.uz, "/blog/dordoy-ulgurji-toliq-qollanma");
  assert.equal(paths.tj, "/blog/dordoi-yakluht-dasturi-purra");
});

test("hreflang uses ky/tg for kg/tj routes", () => {
  const alternates = hreflangAlternatesFromLocalePaths(
    blogPostPathsByLocale("dordoi-optom-polnyy-gid"),
  );
  assert.ok(alternates.ky?.includes("/kg/blog/"));
  assert.ok(alternates.tg?.includes("/tj/blog/"));
  assert.equal(alternates.kg, undefined);
  assert.equal(alternates.tj, undefined);
});

test("localized guide slugs have no duplicates", () => {
  assert.deepEqual(duplicateLocalizedBlogSlugs(), []);
});
