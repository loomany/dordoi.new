import { setRequestLocale } from "next-intl/server";
import { ContactPage } from "@/components/contact/ContactPage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/contact", "Seo.contact");
}

export default async function ContactRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactPage />;
}
