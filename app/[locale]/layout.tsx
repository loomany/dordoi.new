import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-context";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DocumentLang } from "@/components/layout/DocumentLang";
import { DordoiAnalyticsTracker } from "@/components/dordoi/DordoiAnalyticsTracker";
import type { DordoiLocale } from "@/lib/dordoi/analytics/types";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

type IntlMessages = Awaited<ReturnType<typeof getMessages>>;

/** Only namespaces consumed by client components need to cross the RSC boundary. */
function clientMessages(messages: IntlMessages): IntlMessages {
  const pages = messages.Pages as IntlMessages;
  return {
    Header: messages.Header,
    brand: messages.brand,
    Auth: messages.Auth,
    Cabinet: messages.Cabinet,
    catalogCategoryTree: messages.catalogCategoryTree,
    Pages: {
      catalogBrowse: pages.catalogBrowse,
      providerProfile: pages.providerProfile,
      paymentSuccess: pages.paymentSuccess,
      buyers: pages.buyers,
    },
  } as IntlMessages;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={clientMessages(messages)}>
      <AuthDialogProvider>
        <DocumentLang />
        <DordoiAnalyticsTracker locale={locale as DordoiLocale} />
        <div className="flex min-h-dvh flex-1 flex-col">
          <SiteHeader />
          <main className="min-h-0 flex-1">{children}</main>
          <SiteFooter />
        </div>
      </AuthDialogProvider>
    </NextIntlClientProvider>
  );
}
