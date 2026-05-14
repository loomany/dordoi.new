/**
 * Локальный тест Lemon webhook (подпись как в LS).
 *
 *   npm run dev
 *   npx tsx scripts/test-lemon-webhook-local.mts
 *
 * Опции env:
 *   WEBHOOK_TEST_URL=http://localhost:3000/api/webhooks
 *   WEBHOOK_TEST_USER_ID=<uuid профиля>
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const baseUrl =
  process.env.WEBHOOK_TEST_URL?.trim() || "http://localhost:3000/api/webhooks";
const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
const userId =
  process.env.WEBHOOK_TEST_USER_ID?.trim() ||
  "2340a0de-465c-431a-9c95-438612365482";

if (!secret) {
  console.error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET in .env.local");
  process.exit(1);
}

const payload = {
  meta: {
    event_name: "subscription_payment_success",
    test_mode: true,
    custom_data: {
      project: "dordoi",
      user_id: userId,
    },
  },
  data: {
    id: "test-invoice-local",
    type: "subscription-invoices",
    attributes: {
      status: "paid",
      subscription_id: 2154264,
      billing_reason: "initial",
    },
  },
};

const body = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

console.log("POST", baseUrl);
console.log("user_id:", userId);

const res = await fetch(baseUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Signature": signature,
  },
  body,
});

const text = await res.text();
console.log("status:", res.status);
console.log("body:", text);

if (res.status === 401) {
  console.error(
    "\n401 = неверный LEMON_SQUEEZY_WEBHOOK_SECRET (должен совпадать с Signing secret в LS, регистр важен)",
  );
}

process.exit(res.ok ? 0 : 1);
