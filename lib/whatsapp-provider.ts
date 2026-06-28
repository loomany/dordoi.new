import { sendEvolutionTextMessage } from "@/lib/evolution-api";
import { maskPhoneForLog } from "@/lib/whatsapp-phone";

export type WhatsAppProvider = "green" | "evolution";

export type SendMessageResult =
  | { ok: true; idMessage: string; provider: WhatsAppProvider }
  | { ok: false; status: number; body: string; provider: WhatsAppProvider };

export function getWhatsAppProvider(): WhatsAppProvider {
  const raw = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  if (!raw || raw === "green") return "green";
  if (raw === "evolution") return "evolution";
  throw new Error("WHATSAPP_PROVIDER_INVALID");
}

function buildGreenSendMessageUrl(): string {
  const base = process.env.GREEN_API_URL?.replace(/\/$/, "");
  const id = process.env.GREEN_API_ID_INSTANCE;
  const token = process.env.GREEN_API_TOKEN_INSTANCE;
  if (!base || !id || !token) {
    throw new Error("GREEN_API_NOT_CONFIGURED");
  }
  return `${base}/waInstance${id}/sendMessage/${token}`;
}

async function sendGreenTextMessage(
  chatIdDigits: string,
  message: string,
): Promise<SendMessageResult> {
  const url = buildGreenSendMessageUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: `${chatIdDigits}@c.us`,
      message,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[green-api] sendMessage failed", {
      provider: "green",
      phone_masked: maskPhoneForLog(chatIdDigits),
      status: "fail",
      http_status: res.status,
      detail: text.slice(0, 200),
    });
    return { ok: false, status: res.status, body: text, provider: "green" };
  }

  try {
    const json = JSON.parse(text) as { idMessage?: string };
    if (json.idMessage) {
      console.info("[green-api] sendMessage ok", {
        provider: "green",
        phone_masked: maskPhoneForLog(chatIdDigits),
        status: "success",
        request_id: json.idMessage,
      });
      return { ok: true, idMessage: json.idMessage, provider: "green" };
    }
  } catch {
    /* fallthrough */
  }

  return { ok: false, status: res.status, body: text, provider: "green" };
}

export async function sendWhatsAppTextMessage(
  chatIdDigits: string,
  message: string,
): Promise<SendMessageResult> {
  const provider = getWhatsAppProvider();

  if (provider === "evolution") {
    const result = await sendEvolutionTextMessage(chatIdDigits, message);
    if (result.ok) {
      return {
        ok: true,
        idMessage: result.externalId,
        provider: "evolution",
      };
    }
    return {
      ok: false,
      status: result.status,
      body: result.body,
      provider: "evolution",
    };
  }

  return sendGreenTextMessage(chatIdDigits, message);
}
