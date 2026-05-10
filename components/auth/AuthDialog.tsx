"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneCountrySelect } from "@/components/ui/phone-country-select";
import { digitsOnly } from "@/lib/phone";
import {
  type PhoneCountryId,
  clampNationalDigits,
  formatNationalMasked,
  isNationalComplete,
  localeToDefaultCountry,
  parsePhonePaste,
  toInternationalDigits,
} from "@/lib/phone-country";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp" | "register";

function mapErrorCode(code: string | undefined): string {
  switch (code) {
    case "INVALID_PHONE":
    case "VALIDATION_ERROR":
      return "errorInvalidPhone";
    case "GREEN_API_SEND_FAILED":
    case "GREEN_API_NOT_CONFIGURED":
      return "errorNotConfigured";
    case "INVALID_CODE":
    case "CODE_NOT_FOUND":
      return "errorInvalidCode";
    case "CODE_EXPIRED":
      return "errorExpired";
    case "PHONE_TAKEN":
    case "EMAIL_CONFLICT":
      return "errorConflict";
    case "REGISTRATION_SECRET_MISSING":
      return "errorRegistrationSecret";
    case "OTP_STORE_FAILED":
      return "errorNotConfigured";
    case "INVALID_EMAIL":
      return "errorInvalidEmail";
    case "SIGN_IN_FAILED":
      return "errorSignInFailed";
    case "AUTH_UPDATE_FAILED":
      return "errorAuthUpdateFailed";
    case "PROFILE_LOOKUP_FAILED":
      return "errorProfileLookupFailed";
    case "OTP_FETCH_FAILED":
      return "errorOtpFetchFailed";
    case "INTERNAL":
      return "errorServerInternal";
    case "INVALID_REGISTRATION_TOKEN":
      return "errorRegistrationExpired";
    default:
      return "errorGeneric";
  }
}

const phoneHintKeys: Record<
  PhoneCountryId,
  | "phoneHintRU"
  | "phoneHintKZ"
  | "phoneHintKG"
  | "phoneHintUZ"
  | "phoneHintTJ"
> = {
  RU: "phoneHintRU",
  KZ: "phoneHintKZ",
  KG: "phoneHintKG",
  UZ: "phoneHintUZ",
  TJ: "phoneHintTJ",
};

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [countryId, setCountryId] = useState<PhoneCountryId>(() =>
    localeToDefaultCountry(locale),
  );
  const [nationalDigits, setNationalDigits] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const internationalPhone = useMemo(
    () => toInternationalDigits(countryId, nationalDigits),
    [countryId, nationalDigits],
  );

  const resetLocal = useCallback(() => {
    setStep("phone");
    setCountryId(localeToDefaultCountry(locale));
    setNationalDigits("");
    setCode("");
    setName("");
    setEmail("");
    setTempToken(null);
    setErrorKey(null);
    setLoading(false);
  }, [locale]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        resetLocal();
      }
      onOpenChange(next);
    },
    [onOpenChange, resetLocal],
  );

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    if (!isNationalComplete(countryId, nationalDigits)) {
      setErrorKey("errorInvalidPhone");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: internationalPhone }),
      });
      const data = (await res.json()) as { code?: string };
      if (!res.ok) {
        setErrorKey(mapErrorCode(data.code));
        return;
      }
      setStep("otp");
    } catch {
      setErrorKey("errorGeneric");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: internationalPhone, code }),
      });
      const data = (await res.json()) as {
        code?: string;
        isNewUser?: boolean;
        tempToken?: string;
      };
      if (!res.ok) {
        setErrorKey(mapErrorCode(data.code));
        return;
      }
      if (data.isNewUser && data.tempToken) {
        setTempToken(data.tempToken);
        setStep("register");
        return;
      }
      handleOpenChange(false);
      router.push(`/${locale}/cabinet`);
      router.refresh();
    } catch {
      setErrorKey("errorGeneric");
    } finally {
      setLoading(false);
    }
  }

  async function onCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!tempToken) {
      setErrorKey("errorGeneric");
      return;
    }
    setErrorKey(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email: email.trim() === "" ? undefined : email.trim(),
          tempToken,
        }),
      });
      const data = (await res.json()) as { code?: string };
      if (!res.ok) {
        if (data.code === "INVALID_EMAIL") {
          setErrorKey("errorInvalidEmail");
          return;
        }
        const mapped = mapErrorCode(data.code);
        setErrorKey(
          mapped === "errorGeneric" ? "errorComplete" : mapped,
        );
        return;
      }
      handleOpenChange(false);
      router.push(`/${locale}/cabinet`);
      router.refresh();
    } catch {
      setErrorKey("errorComplete");
    } finally {
      setLoading(false);
    }
  }

  const phoneComplete = isNationalComplete(countryId, nationalDigits);

  const saasFieldClass = cn(
    "h-10 rounded-xl border border-zinc-200/95 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-200",
    "placeholder:text-zinc-400",
    "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/25",
    "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
  );

  /** Backspace на скобке/пробеле/тире не меняет `digitsOnly(value)` — удаляем цифру вручную. */
  const handleNationalKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Backspace") return;
      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (start !== end) return;
      if (start === 0) return;

      const charBefore = el.value[start - 1];
      if (/\d/.test(charBefore)) return;

      e.preventDefault();
      setNationalDigits((d) => {
        if (!d) return d;
        if (charBefore === "(") return d.slice(1);
        return d.slice(0, -1);
      });
      setErrorKey(null);
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent closeLabel={t("closeDialog")}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("title")}
          </DialogDescription>
        </DialogHeader>

        {errorKey ? (
          <p className="mb-3 rounded-xl border border-red-200/80 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {t(errorKey)}
          </p>
        ) : null}

        {step === "phone" ? (
          <form onSubmit={onSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="auth-phone-national"
              >
                {t("phoneLabel")}
              </label>
              <div className="flex w-full min-w-0 flex-row items-stretch gap-1.5 sm:gap-2">
                <div className="min-w-0 shrink-0 basis-[32%] max-w-[9.75rem] sm:basis-auto sm:max-w-none sm:min-w-[9.5rem]">
                  <PhoneCountrySelect
                    id="auth-country"
                    value={countryId}
                    onValueChange={(next) => {
                      setCountryId(next);
                      setNationalDigits("");
                      setErrorKey(null);
                    }}
                    disabled={loading}
                    aria-label={t("countryLabel")}
                  />
                </div>
                <input
                  id="auth-phone-national"
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={formatNationalMasked(countryId, nationalDigits)}
                  onChange={(e) => {
                    const raw = digitsOnly(e.target.value);
                    setNationalDigits(clampNationalDigits(countryId, raw));
                    setErrorKey(null);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    const { country, national } = parsePhonePaste(
                      text,
                      countryId,
                    );
                    setCountryId(country);
                    setNationalDigits(national);
                    setErrorKey(null);
                  }}
                  onKeyDown={handleNationalKeyDown}
                  className={cn(saasFieldClass, "min-w-0 flex-1")}
                  disabled={loading}
                  aria-describedby="auth-phone-hint"
                />
              </div>
              <p
                id="auth-phone-hint"
                className="max-w-full break-words text-xs text-muted-foreground"
              >
                {t(phoneHintKeys[countryId])}
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !phoneComplete}
              className="w-full"
            >
              {loading ? t("loading") : t("sendCode")}
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={onVerifyCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="auth-code">
                {t("codeLabel")}
              </label>
              <input
                id="auth-code"
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                name="code"
                autoComplete="one-time-code"
                placeholder="0000"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={cn(
                  saasFieldClass,
                  "w-full text-center font-mono text-lg tracking-[0.3em]",
                )}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" disabled={loading || code.length !== 4} className="w-full">
              {loading ? t("loading") : t("verifyCode")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full"
              onClick={() => {
                setStep("phone");
                setCode("");
                setErrorKey(null);
              }}
            >
              {t("backToPhone")}
            </Button>
          </form>
        ) : null}

        {step === "register" ? (
          <form onSubmit={onCompleteRegistration} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="auth-name">
                {t("nameLabel")}
              </label>
              <input
                id="auth-name"
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(saasFieldClass, "w-full")}
                disabled={loading}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-0">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="auth-email"
                >
                  {t("emailLabel")}
                </label>
                <span className="text-xs text-muted-foreground">{t("emailHint")}</span>
              </div>
              <input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(saasFieldClass, "w-full")}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full">
              {loading ? t("loading") : t("completeRegistration")}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
