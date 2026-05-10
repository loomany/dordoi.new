import { redirect } from "next/navigation";

import { cabinetPathForProfile } from "@/lib/auth/cabinet-routing";
import { getSessionProfile } from "@/lib/auth/session-profile";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminCabinetSectionLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  const p = await getSessionProfile();
  if (!p) {
    redirect(`/${locale}`);
  }
  if (p.role !== "admin") {
    redirect(cabinetPathForProfile(locale, { role: p.role, vendorId: p.vendorId }));
  }
  return children;
}
