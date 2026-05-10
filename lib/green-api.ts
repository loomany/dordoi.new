export type SendMessageResult =
  | { ok: true; idMessage: string }
  | { ok: false; status: number; body: string };

function buildSendMessageUrl(): string {
  const base = process.env.GREEN_API_URL?.replace(/\/$/, "");
  const id = process.env.GREEN_API_ID_INSTANCE;
  const token = process.env.GREEN_API_TOKEN_INSTANCE;
  if (!base || !id || !token) {
    throw new Error("GREEN_API_NOT_CONFIGURED");
  }
  return `${base}/waInstance${id}/sendMessage/${token}`;
}

export async function sendWhatsAppTextMessage(
  chatIdDigits: string,
  message: string,
): Promise<SendMessageResult> {
  const url = buildSendMessageUrl();
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
    return { ok: false, status: res.status, body: text };
  }

  try {
    const json = JSON.parse(text) as { idMessage?: string };
    if (json.idMessage) {
      return { ok: true, idMessage: json.idMessage };
    }
  } catch {
    /* fallthrough */
  }

  return { ok: false, status: res.status, body: text };
}
