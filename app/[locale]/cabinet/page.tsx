import { redirect } from "next/navigation";

import { cabinetHomePath, getSessionProfile } from "@/lib/auth/session-profile";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CabinetIndexPage({ params }: Props) {
  const { locale } = await params;
  const profile = await getSessionProfile();
  if (!profile) {
    redirect(`/${locale}`);
  }
  redirect(cabinetHomePath(locale, profile));
}
