import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyDordoiTrafficChannel,
  isYandexPaidUtmSource,
} from "@/lib/dordoi/analytics/channel";

describe("isYandexPaidUtmSource", () => {
  it("matches yandex, ya, yandex_direct", () => {
    assert.equal(isYandexPaidUtmSource("yandex"), true);
    assert.equal(isYandexPaidUtmSource("ya"), true);
    assert.equal(isYandexPaidUtmSource("yandex_direct"), true);
    assert.equal(isYandexPaidUtmSource("google"), false);
  });
});

describe("classifyDordoiTrafficChannel — Yandex Direct", () => {
  it("classifies yclid in search as Yandex Ads", () => {
    const ch = classifyDordoiTrafficChannel({
      search: "?yclid=123",
    });
    assert.equal(ch.channel, "Yandex Ads");
    assert.equal(ch.sourceBucket, "yandex_ads");
    assert.equal(ch.paidParams.yclidPresent, true);
  });

  it("classifies yandex cpc UTM as Yandex Ads", () => {
    const ch = classifyDordoiTrafficChannel({
      search: "?utm_source=yandex&utm_medium=cpc&utm_campaign=test",
    });
    assert.equal(ch.channel, "Yandex Ads");
    assert.equal(ch.sourceBucket, "yandex_ads");
    assert.equal(ch.utm.campaign, "test");
  });

  it("classifies yandex referrer without paid UTM as Yandex Organic", () => {
    const ch = classifyDordoiTrafficChannel({
      referrer: "https://yandex.ru/search/?text=дордой",
    });
    assert.equal(ch.channel, "Yandex Organic");
    assert.equal(ch.sourceBucket, "yandex_organic");
    assert.equal(ch.paidParams.yclidPresent, false);
  });

  it("prefers Yandex Ads over Organic when yclid and yandex referrer", () => {
    const ch = classifyDordoiTrafficChannel({
      search: "?yclid=abc",
      referrer: "https://yandex.ru/",
    });
    assert.equal(ch.channel, "Yandex Ads");
  });
});

describe("classifyDordoiTrafficChannel — other paid unchanged", () => {
  it("still classifies Google Ads with gclid", () => {
    const ch = classifyDordoiTrafficChannel({ search: "?gclid=1" });
    assert.equal(ch.channel, "Google Ads");
  });

  it("still classifies Direct without UTM or referrer", () => {
    const ch = classifyDordoiTrafficChannel({});
    assert.equal(ch.channel, "Direct");
  });
});
