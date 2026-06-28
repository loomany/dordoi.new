import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { providerDateLocale } from "./provider-dates";

describe("providerDateLocale", () => {
  it("maps route locale aliases to stable BCP-47 date locales", () => {
    assert.equal(providerDateLocale("ru"), "ru-RU");
    assert.equal(providerDateLocale("kk"), "kk-KZ");
    assert.equal(providerDateLocale("kg"), "ky-KG");
    assert.equal(providerDateLocale("uz"), "uz-UZ");
    assert.equal(providerDateLocale("tj"), "tg-TJ");
  });
});
