/**
 * Deep link to the seller onboarding Telegram bot.
 * Override with NEXT_PUBLIC_TELEGRAM_VENDOR_BOT (username, @handle, or full https://t.me/… URL).
 */
export function vendorOnboardingTelegramHref(): string {
  const raw = process.env.NEXT_PUBLIC_TELEGRAM_VENDOR_BOT?.trim();
  if (!raw) return "https://t.me/dordoi_help_admin_bot";
  if (/^https?:\/\//i.test(raw)) return raw;
  const user = raw.replace(/^@/, "").replace(/^t\.me\//i, "");
  return `https://t.me/${user}`;
}
