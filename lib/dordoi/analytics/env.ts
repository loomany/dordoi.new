import "server-only";

export type DordoiAdminTelegramEnv = {
  enabled: boolean;
  dryRun: boolean;
  debug: boolean;
  botToken: string;
  chatIds: Array<string | number>;
  /** Minimum seconds between any two Telegram sends to the same chat_id. */
  minIntervalSeconds: number;
};

function parseChatIds(raw: string | undefined): Array<string | number> {
  if (!raw?.trim()) return [];
  const out: Array<string | number> = [];
  for (const part of raw.split(",")) {
    const p = part.trim();
    if (!p) continue;
    if (/^-?\d+$/.test(p)) {
      const n = Number(p);
      if (Number.isSafeInteger(n)) out.push(n);
    } else {
      out.push(p);
    }
  }
  return out;
}

export function loadDordoiAdminTelegramEnv(): DordoiAdminTelegramEnv {
  const enabled = process.env.DORDOI_ADMIN_TELEGRAM_ENABLED?.trim() === "1";
  const dryRun = process.env.DORDOI_ADMIN_TELEGRAM_DRY_RUN?.trim() === "1";
  const debug = process.env.DORDOI_ANALYTICS_DEBUG?.trim() === "1";
  const botToken = process.env.DORDOI_ADMIN_TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatIds = parseChatIds(
    process.env.DORDOI_ADMIN_TELEGRAM_CHAT_IDS?.trim(),
  );
  const minRaw = process.env.DORDOI_ADMIN_TELEGRAM_MIN_INTERVAL_SECONDS?.trim();
  const minParsed = minRaw ? Number(minRaw) : 60;
  const minIntervalSeconds =
    Number.isFinite(minParsed) && minParsed >= 0 ? minParsed : 60;

  return {
    enabled,
    dryRun,
    debug,
    botToken,
    chatIds,
    minIntervalSeconds,
  };
}
