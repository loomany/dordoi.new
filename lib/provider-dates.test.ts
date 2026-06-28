import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatProviderUtcDate, providerDateLocale } from "./provider-dates";

describe("providerDateLocale", () => {
  it("maps route locale aliases to stable BCP-47 date locales", () => {
    assert.equal(providerDateLocale("ru"), "ru-RU");
    assert.equal(providerDateLocale("kk"), "kk-KZ");
    assert.equal(providerDateLocale("kg"), "ky-KG");
    assert.equal(providerDateLocale("uz"), "uz-UZ");
    assert.equal(providerDateLocale("tj"), "tg-TJ");
  });

  it("formats public photo dates identically across server and browser timezones", () => {
    assert.equal(
      formatProviderUtcDate("2026-05-12T21:48:26.685+00:00"),
      "2026-05-12",
    );
  });
});
