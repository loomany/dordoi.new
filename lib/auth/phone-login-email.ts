/** Домен служебных login-email (без MX — только для signInWithPassword). */
export function phoneLoginEmailDomain(): string {
  return process.env.AUTH_PHONE_LOGIN_EMAIL_DOMAIN?.trim() || "auth.dordoi.help";
}

/** Детерминированный login-email для phone-only аккаунтов. */
export function syntheticEmailForPhone(phoneDigits: string): string {
  return `p${phoneDigits}@${phoneLoginEmailDomain()}`;
}

export function isSyntheticLoginEmail(email: string): boolean {
  const domain = phoneLoginEmailDomain().toLowerCase();
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

/**
 * Email для signInWithPassword: реальный из профиля/Auth или synthetic fallback.
 * Реальный email в profiles имеет приоритет над synthetic в auth.users.
 */
export function resolveLoginEmail(
  phoneDigits: string,
  authEmail?: string | null,
  profileEmail?: string | null,
): string {
  const profile = profileEmail?.trim();
  if (profile && !isSyntheticLoginEmail(profile)) {
    return profile;
  }

  const auth = authEmail?.trim();
  if (auth && !isSyntheticLoginEmail(auth)) {
    return auth;
  }

  return syntheticEmailForPhone(phoneDigits);
}
