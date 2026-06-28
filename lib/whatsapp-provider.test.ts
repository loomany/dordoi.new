import assert from "node:assert/strict";
import test from "node:test";

test("getWhatsAppProvider defaults to green", async () => {
  const prev = process.env.WHATSAPP_PROVIDER;
  delete process.env.WHATSAPP_PROVIDER;
  const { getWhatsAppProvider } = await import("@/lib/whatsapp-provider");
  assert.equal(getWhatsAppProvider(), "green");
  if (prev === undefined) delete process.env.WHATSAPP_PROVIDER;
  else process.env.WHATSAPP_PROVIDER = prev;
});

test("getWhatsAppProvider evolution", async () => {
  const prev = process.env.WHATSAPP_PROVIDER;
  process.env.WHATSAPP_PROVIDER = "evolution";
  const { getWhatsAppProvider } = await import("@/lib/whatsapp-provider");
  assert.equal(getWhatsAppProvider(), "evolution");
  if (prev === undefined) delete process.env.WHATSAPP_PROVIDER;
  else process.env.WHATSAPP_PROVIDER = prev;
});

test("getWhatsAppProvider rejects unknown", async () => {
  const prev = process.env.WHATSAPP_PROVIDER;
  process.env.WHATSAPP_PROVIDER = "sms";
  const { getWhatsAppProvider } = await import("@/lib/whatsapp-provider");
  assert.throws(() => getWhatsAppProvider(), /WHATSAPP_PROVIDER_INVALID/);
  if (prev === undefined) delete process.env.WHATSAPP_PROVIDER;
  else process.env.WHATSAPP_PROVIDER = prev;
});

test("maskPhoneForLog hides middle digits", async () => {
  const { maskPhoneForLog } = await import("@/lib/whatsapp-phone");
  assert.equal(maskPhoneForLog("79991234567"), "+7***4567");
});
