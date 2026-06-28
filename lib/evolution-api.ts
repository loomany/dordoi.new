import { maskPhoneForLog, normalizePhoneDigits } from "@/lib/whatsapp-phone";

export type EvolutionSendResult =
  | { ok: true; externalId: string }
  | { ok: false; status: number; body: string };

function evolutionConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "") ?? "";
  const apiKey = process.env.EVOLUTION_API_KEY?.trim() ?? "";
  const instance = process.env.EVOLUTION_INSTANCE?.trim() ?? "";
  return { baseUrl, apiKey, instance };
}

export function isEvolutionConfigured(): boolean {
  const { baseUrl, apiKey, instance } = evolutionConfig();
  return Boolean(baseUrl && apiKey && instance);
}

export async function sendEvolutionTextMessage(
  phone: string,
  message: string,
): Promise<EvolutionSendResult> {
  const { baseUrl, apiKey, instance } = evolutionConfig();
  if (!baseUrl || !apiKey || !instance) {
    throw new Error("EVOLUTION_NOT_CONFIGURED");
  }

  const number = normalizePhoneDigits(phone);
  const url = `${baseUrl}/message/sendText/${instance}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ number, text: message }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[evolution-api] sendText failed", {
      provider: "evolution",
      phone_masked: maskPhoneForLog(number),
      status: "fail",
      http_status: res.status,
      detail: text.slice(0, 200),
    });
    return { ok: false, status: res.status, body: text };
  }

  let externalId = "";
  try {
    const json = JSON.parse(text) as {
      key?: { id?: string };
      messageId?: string;
      id?: string;
    };
    externalId =
      json.key?.id ?? json.messageId ?? json.id ?? "";
  } catch {
    /* fallthrough */
  }

  if (!externalId) {
    console.error("[evolution-api] sendText missing id", {
      provider: "evolution",
      phone_masked: maskPhoneForLog(number),
      status: "fail",
      http_status: res.status,
    });
    return { ok: false, status: res.status, body: text };
  }

  console.info("[evolution-api] sendText ok", {
    provider: "evolution",
    phone_masked: maskPhoneForLog(number),
    status: "success",
    request_id: externalId,
  });

  return { ok: true, externalId };
}
