import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/session-profile";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function VendorCabinetSectionLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  const p = await getSessionProfile();
  if (!p) {
    redirect(`/${locale}`);
  }
  const allowed = p.role === "vendor" || !!p.vendorId;
  if (!allowed) {
    redirect(`/${locale}/cabinet/buyer`);
  }
  return children;
}
