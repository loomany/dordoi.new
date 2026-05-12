import "server-only";

import { loadDordoiAdminTelegramEnv } from "@/lib/dordoi/analytics/env";

const lastSentByChat = new Map<string, number>();

export type SendDordoiAdminTelegramResult = {
  sent: boolean;
  skippedReason?: string;
  attempted: number;
  delivered: number;
};

export async function sendDordoiAdminTelegram(
  html: string,
): Promise<SendDordoiAdminTelegramResult> {
  const env = loadDordoiAdminTelegramEnv();

  if (!env.enabled) {
    return {
      sent: false,
      skippedReason: "disabled",
      attempted: 0,
      delivered: 0,
    };
  }

  if (!env.botToken || env.chatIds.length === 0) {
    return {
      sent: false,
      skippedReason: "missing_token_or_chats",
      attempted: 0,
      delivered: 0,
    };
  }

  if (env.dryRun) {
    if (env.debug) {
      console.info(
        "[dordoi-analytics][dry-run] prepared telegram message:\n",
        html.slice(0, 4000),
      );
    }
    return {
      sent: false,
      skippedReason: "dry_run",
      attempted: env.chatIds.length,
      delivered: 0,
    };
  }

  const gapMs = Math.max(0, env.minIntervalSeconds * 1000);
  const now = Date.now();
  let delivered = 0;

  for (const chatId of env.chatIds) {
    const key = String(chatId);
    const last = lastSentByChat.get(key) ?? 0;
    if (gapMs > 0 && now - last < gapMs) {
      console.warn("[dordoi-analytics] telegram min_interval skip chat=", key);
      continue;
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${env.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: html,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        },
      );

      if (!res.ok) {
        const t = await res.text();
        console.error(
          "[dordoi-analytics] telegram API",
          chatId,
          res.status,
          t.slice(0, 500),
        );
        continue;
      }

      lastSentByChat.set(key, Date.now());
      delivered += 1;
    } catch (e) {
      console.error("[dordoi-analytics] telegram fetch failed", chatId, e);
    }
  }

  return {
    sent: delivered > 0,
    skippedReason:
      delivered === 0 ? "telegram_all_failed_or_throttled" : undefined,
    attempted: env.chatIds.length,
    delivered,
  };
}
