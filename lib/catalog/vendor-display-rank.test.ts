import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATALOG_PINNED_VENDOR_RANK,
  compareCatalogVendorsForDisplay,
  isTelegramChannelUrl,
} from "./vendor-display-rank";

describe("isTelegramChannelUrl", () => {
  it("accepts @username and t.me/name", () => {
    assert.equal(isTelegramChannelUrl("@ASSO"), true);
    assert.equal(isTelegramChannelUrl("https://t.me/bermet_style"), true);
  });

  it("rejects phone and invite links", () => {
    assert.equal(isTelegramChannelUrl("https://t.me/+996777000030"), false);
    assert.equal(isTelegramChannelUrl("https://t.me/+hBChAztzsGE4N2I6"), false);
    assert.equal(isTelegramChannelUrl("https://t.me/joinchat/abc"), false);
  });
});

describe("compareCatalogVendorsForDisplay", () => {
  it("puts telegram channel vendors first when not pinned", () => {
    const channel = {
      slug: "a",
      telegram_url: "https://t.me/shop",
      created_at: "2020-01-01",
    };
    const other = {
      slug: "b",
      telegram_url: "https://t.me/+996700000000",
      created_at: "2026-01-01",
    };
    assert.equal(compareCatalogVendorsForDisplay(channel, other), -1);
    assert.equal(compareCatalogVendorsForDisplay(other, channel), 1);
  });

  it("pins muhsina-kg first in general catalog", () => {
    const pinned = {
      slug: "muhsina-kg",
      categories: ["womens"],
      created_at: "2020-01-01",
    };
    const newer = {
      slug: "other-channel",
      telegram_url: "https://t.me/shop",
      created_at: "2026-01-01",
    };
    assert.ok(compareCatalogVendorsForDisplay(pinned, newer) < 0);
  });

  it("pins bermet-factory second and fam-optom-kg fourth", () => {
    const first = { slug: "muhsina-kg", categories: ["womens"] };
    const second = { slug: "bermet-factory", categories: ["womens"] };
    const fourth = { slug: "fam-optom-kg", categories: ["womens"] };
    const other = {
      slug: "other-channel",
      telegram_url: "https://t.me/shop",
      created_at: "2026-01-01",
    };
    assert.equal(CATALOG_PINNED_VENDOR_RANK["fam-optom-kg"], 3);
    assert.ok(compareCatalogVendorsForDisplay(first, second) < 0);
    assert.ok(compareCatalogVendorsForDisplay(second, fourth) < 0);
    assert.ok(compareCatalogVendorsForDisplay(fourth, other) < 0);
  });

  it("pins lima-brand-kg second in womens via seo_slug when slug is opaque", () => {
    const first = {
      slug: "postavshik-zhenskoy-odezhdy-aaaa",
      seo_slug: "muhsina-kg",
      categories: ["womens"],
    };
    const second = {
      slug: "postavshik-zhenskoy-odezhdy-bbbb",
      seo_slug: "lima-brand-kg",
      categories: ["womens"],
    };
    const third = {
      slug: "postavshik-zhenskoy-odezhdy-cccc",
      seo_slug: "bermet-factory",
      categories: ["womens"],
    };
    const other = {
      slug: "other-womens",
      categories: ["womens"],
      telegram_url: "https://t.me/shop",
      created_at: "2026-01-01",
    };
    assert.ok(
      compareCatalogVendorsForDisplay(first, second, {
        categoryFilterSlugs: ["womens"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(second, third, {
        categoryFilterSlugs: ["womens"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(third, other, {
        categoryFilterSlugs: ["womens"],
      }) < 0,
    );
  });

  it("pins pkas, firdaus, bigsport in mens order", () => {
    const pkas = { slug: "pkas-collection", categories: ["mens"] };
    const firdaus = { slug: "optom-dordoi-firdaus", categories: ["mens"] };
    const bigsport = { slug: "bigsport-dordoi", categories: ["mens"] };
    const other = {
      slug: "other-mens",
      telegram_url: "https://t.me/shop",
      categories: ["mens"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(pkas, firdaus, {
        categoryFilterSlugs: ["mens"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(firdaus, bigsport, {
        categoryFilterSlugs: ["mens"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(bigsport, other, {
        categoryFilterSlugs: ["mens"],
      }) < 0,
    );
    assert.equal(
      compareCatalogVendorsForDisplay(bigsport, other, {
        categoryFilterSlugs: ["womens"],
      }),
      1,
    );
  });

  it("pins milaisa-dordoi and lili-moda in kids order", () => {
    const milaisa = { slug: "milaisa-dordoi", categories: ["kids"] };
    const lili = { slug: "lili-moda", categories: ["kids"] };
    const other = {
      slug: "other-kids",
      telegram_url: "https://t.me/shop",
      categories: ["kids"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(milaisa, lili, {
        categoryFilterSlugs: ["kids"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(lili, other, {
        categoryFilterSlugs: ["kids"],
      }) < 0,
    );
  });

  it("pins amina-optom-kg and anttifu-r in underwear-swim order", () => {
    const amina = { slug: "amina-optom-kg", categories: ["underwear-swim"] };
    const anttifu = { slug: "anttifu-r", categories: ["underwear-swim"] };
    const other = {
      slug: "other-uw",
      telegram_url: "https://t.me/shop",
      categories: ["underwear-swim"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(amina, anttifu, {
        categoryFilterSlugs: ["underwear-swim"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(anttifu, other, {
        categoryFilterSlugs: ["underwear-swim"],
      }) < 0,
    );
  });

  it("pins anjur-kids-bishkek and italy-obuv-kg in footwear order", () => {
    const anjur = { slug: "anjur-kids-bishkek", categories: ["footwear"] };
    const italy = { slug: "italy-obuv-kg", categories: ["footwear"] };
    const other = {
      slug: "other-shoes",
      telegram_url: "https://t.me/shop",
      categories: ["footwear"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(anjur, italy, {
        categoryFilterSlugs: ["footwear"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(italy, other, {
        categoryFilterSlugs: ["footwear"],
      }) < 0,
    );
  });

  it("pins zipari-ru and eva-textile-kg in fabrics-notions order", () => {
    const zipari = { slug: "zipari-ru", categories: ["fabrics-notions"] };
    const eva = { slug: "eva-textile-kg", categories: ["fabrics-notions"] };
    const other = {
      slug: "other-fabrics",
      telegram_url: "https://t.me/shop",
      categories: ["fabrics-notions"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(zipari, eva, {
        categoryFilterSlugs: ["fabrics-notions"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(eva, other, {
        categoryFilterSlugs: ["fabrics-notions"],
      }) < 0,
    );
  });

  it("pins kovry-islams and icon-kovri in home-textiles order", () => {
    const islam = { slug: "kovry-islams", categories: ["home-textiles"] };
    const icon = { slug: "icon-kovri", categories: ["home-textiles"] };
    const other = {
      slug: "other-home-textiles",
      telegram_url: "https://t.me/shop",
      categories: ["home-textiles"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(islam, icon, {
        categoryFilterSlugs: ["home-textiles"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(icon, other, {
        categoryFilterSlugs: ["home-textiles"],
      }) < 0,
    );
  });

  it("pins b-toys-kg and igrushkin-kg in toys-children order", () => {
    const btoys = { slug: "b-toys-kg", categories: ["toys-children"] };
    const igrushkin = { slug: "igrushkin-kg", categories: ["toys-children"] };
    const other = {
      slug: "other-toys",
      telegram_url: "https://t.me/shop",
      categories: ["toys-children"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(btoys, igrushkin, {
        categoryFilterSlugs: ["toys-children"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(igrushkin, other, {
        categoryFilterSlugs: ["toys-children"],
      }) < 0,
    );
  });

  it("pins mobax-kg and tehnika-kg in electronics order", () => {
    const mobax = { slug: "mobax-kg", categories: ["electronics"] };
    const tehnika = { slug: "tehnika-kg", categories: ["electronics"] };
    const other = {
      slug: "other-electronics",
      telegram_url: "https://t.me/shop",
      categories: ["electronics"],
    };
    assert.ok(
      compareCatalogVendorsForDisplay(mobax, tehnika, {
        categoryFilterSlugs: ["electronics"],
      }) < 0,
    );
    assert.ok(
      compareCatalogVendorsForDisplay(tehnika, other, {
        categoryFilterSlugs: ["electronics"],
      }) < 0,
    );
  });
});
