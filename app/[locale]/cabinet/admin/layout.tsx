import { redirect } from "next/navigation";

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
    redirect(`/${locale}/cabinet`);
  }
  return children;
}
