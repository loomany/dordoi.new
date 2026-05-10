import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function CabinetLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await getSessionProfile();

  if (!profile) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("Cabinet");
  const navClass =
    "rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <div className="border-b border-zinc-200/90 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-3 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("navTitle")}
          </p>
          <nav className="flex flex-wrap gap-2">
            <Link href="/cabinet/buyer" className={cn(navClass)}>
              {t("navBuyer")}
            </Link>
            {(profile.role === "vendor" || profile.vendorId) && (
              <Link href="/cabinet/vendor" className={cn(navClass)}>
                {t("navVendor")}
              </Link>
            )}
            {profile.role === "admin" && (
              <Link href="/cabinet/admin" className={cn(navClass)}>
                {t("navAdmin")}
              </Link>
            )}
          </nav>
          {profile.phone ? (
            <p className="text-sm text-muted-foreground">
              {t("signedInAs", { phone: profile.phone })}
            </p>
          ) : null}
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
