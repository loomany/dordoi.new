import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatAdminTelegramSourceLine,
  isYandexDirectAttribution,
} from "@/lib/dordoi/analytics/telegramHtml";

describe("isYandexDirectAttribution", () => {
  it("detects yclid and yandex paid UTM", () => {
    assert.equal(isYandexDirectAttribution({ yclidPresent: true }), true);
    assert.equal(
      isYandexDirectAttribution({
        utmSource: "yandex",
        utmMedium: "cpc",
      }),
      true,
    );
    assert.equal(
      isYandexDirectAttribution({
        channelLabel: "Yandex Ads",
      }),
      true,
    );
    assert.equal(
      isYandexDirectAttribution({
        channelLabel: "Yandex Organic",
      }),
      false,
    );
  });
});

describe("formatAdminTelegramSourceLine", () => {
  it("renders bold Yandex Direct line", () => {
    assert.equal(
      formatAdminTelegramSourceLine({
        channelLabel: "Yandex Ads",
      }),
      "<b>Источник: Яндекс Директ 🎯</b>",
    );
    assert.equal(
      formatAdminTelegramSourceLine({
        yclidPresent: true,
      }),
      "<b>Источник: Яндекс Директ 🎯</b>",
    );
    assert.equal(
      formatAdminTelegramSourceLine({
        utmSource: "yandex",
        utmMedium: "cpc",
      }),
      "<b>Источник: Яндекс Директ 🎯</b>",
    );
  });

  it("still renders Google Ads before Yandex when gclid present", () => {
    assert.equal(
      formatAdminTelegramSourceLine({
        utmSource: "google",
        gclidPresent: true,
      }),
      "<b>Источник: Google Ads 🎯</b>",
    );
  });

  it("renders Yandex Organic as generic source line", () => {
    assert.equal(
      formatAdminTelegramSourceLine({
        channelLabel: "Yandex Organic",
      }),
      "📢 Источник: Yandex Organic",
    );
  });
});
