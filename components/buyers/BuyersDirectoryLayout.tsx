import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BuyersDirectoryInteractive } from "@/components/buyers/BuyersDirectoryInteractive";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { hasFullCatalogAccess } from "@/lib/catalog/catalog-access";

/** Directory of sourcing agents — `/buyers`. */
export async function BuyersDirectoryLayout() {
  const t = await getTranslations("Pages.buyers");
  const tBrowse = await getTranslations("Pages.catalogBrowse");
  const profile = await getSessionProfile();
  const contactsUnlocked = await hasFullCatalogAccess(profile);

  return (
    <div className="bg-gray-50/80 py-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6">
        <nav aria-label={t("breadcrumbNav")} className="text-xs text-gray-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-gray-600">
                {t("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden className="text-gray-300">
              /
            </li>
            <li className="text-gray-500">{t("breadcrumbCurrent")}</li>
          </ol>
        </nav>

        <header className="text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t("h1")}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            {t("subtitle")}
          </p>
          <div
            className="mx-auto mt-8 h-px max-w-lg bg-gradient-to-r from-transparent via-slate-300 to-transparent"
            aria-hidden
          />
        </header>

        <BuyersDirectoryInteractive
          contactsUnlocked={contactsUnlocked}
          paywallCopy={{
            title: tBrowse("paywall.title"),
            body: tBrowse("paywall.body"),
            ctaPayment: tBrowse("paywall.ctaPayment"),
            ctaPaymentTransfer: tBrowse("paywall.ctaPaymentTransfer"),
            closeDialog: tBrowse("paywall.closeDialog"),
            planMonthlyPrice: tBrowse("paywall.planMonthlyPrice"),
            checkoutError: tBrowse("paywall.checkoutError"),
            checkoutLoading: tBrowse("paywall.checkoutLoading"),
          }}
        />
      </div>
    </div>
  );
}
