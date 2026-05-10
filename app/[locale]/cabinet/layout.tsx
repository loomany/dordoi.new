import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CabinetChrome } from "@/components/cabinet/CabinetChrome";
import { cabinetAreaForProfile } from "@/lib/auth/cabinet-routing";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { formatPhoneDisplay } from "@/lib/phone";

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
  const area = cabinetAreaForProfile({
    role: profile.role,
    vendorId: profile.vendorId,
  });

  const roleHeadline =
    area === "admin"
      ? t("roleBadgeAdmin")
      : area === "vendor"
        ? t("roleBadgeVendor")
        : area === "buyer_agent"
          ? t("roleBadgeBuyerAgent")
          : t("roleBadgeBuyer");

  const phoneLine = profile.phone
    ? t("signedInAs", { phone: formatPhoneDisplay(profile.phone) })
    : null;

  return (
    <CabinetChrome
      navTitle={t("navTitle")}
      roleHeadline={roleHeadline}
      phoneLine={phoneLine}
    >
      {children}
    </CabinetChrome>
  );
}
