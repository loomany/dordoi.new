import { redirect } from "next/navigation";

import {
  cabinetAreaForProfile,
  cabinetPathForProfile,
} from "@/lib/auth/cabinet-routing";
import { getSessionProfile } from "@/lib/auth/session-profile";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function BuyerAgentCabinetSectionLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  const p = await getSessionProfile();
  if (!p) {
    redirect(`/${locale}`);
  }
  if (
    cabinetAreaForProfile({ role: p.role, vendorId: p.vendorId }) !==
    "buyer_agent"
  ) {
    redirect(cabinetPathForProfile(locale, { role: p.role, vendorId: p.vendorId }));
  }
  return children;
}
