import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  paymentConversionDedupKey,
  resolvePaymentConversionValue,
} from "@/lib/analytics/google-ads-payment-conversion";

describe("paymentConversionDedupKey", () => {
  it("prefers order_identifier over order_id", () => {
    assert.equal(
      paymentConversionDedupKey({
        orderIdentifier: "uuid-1",
        orderId: "123",
      }),
      "order:uuid-1",
    );
  });

  it("falls back to visit when no ids", () => {
    assert.equal(paymentConversionDedupKey({}), "visit");
  });
});

describe("resolvePaymentConversionValue", () => {
  it("parses Lemon total string", () => {
    assert.deepEqual(
      resolvePaymentConversionValue({ total: "$9.99" }),
      { value: 9.99, currency: "USD" },
    );
  });

  it("uses plan when total missing", () => {
    assert.deepEqual(
      resolvePaymentConversionValue({ plan: "monthly" }),
      { value: 9.99, currency: "USD" },
    );
  });
});
