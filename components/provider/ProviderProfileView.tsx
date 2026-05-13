import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { ProviderSidebar } from "@/components/provider/ProviderSidebar";
import { ProviderTermsGrid } from "@/components/provider/ProviderTermsGrid";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import type { ProviderSlug } from "@/data/provider-registry";
import { providerContactBySlug } from "@/data/provider-registry";
import { catalogListingKeyFromSlug } from "@/lib/catalog/listing-key";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { fetchBuyerFavoriteKeySet } from "@/lib/favorites/buyer-favorites";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";

type Props = {
  slug: ProviderSlug;
};

export async function ProviderProfileView({ slug }: Props) {
  const t = await getTranslations("Pages.providerProfile");
  const locale = await getLocale();
  const p = (key: string) => t(`slugs.${slug}.${key}`);
  const contact = providerContactBySlug[slug];
  const listedNow = new Date();
  const profile = await getSessionProfile();
  const favoriteKeys = profile
    ? await fetchBuyerFavoriteKeySet(profile.userId)
    : new Set<string>();
  const listingKey = catalogListingKeyFromSlug(slug);
  const initialFavorite = favoriteKeys.has(listingKey);

  const faqItems = [0, 1, 2, 3].map((i) => ({
    question: p(`faq.${i}.q`),
    answer: p(`faq.${i}.a`),
  }));

  const whatsappHref = `https://wa.me/${contact.whatsappDigits}`;

  return (
    <div className="bg-gray-50/80 pb-16 pt-8 sm:pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          <div className="min-w-0 lg:col-span-2">
            <nav aria-label={t("breadcrumbNav")} className="text-xs text-gray-400">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-gray-600">
                    {t("breadcrumbHome")}
                  </Link>
                </li>
                <li className="text-gray-300" aria-hidden>
                  /
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-gray-600">
                    {t("breadcrumbCatalog")}
                  </Link>
                </li>
                <li className="text-gray-300" aria-hidden>
                  /
                </li>
                <li className="max-w-[10rem] truncate text-gray-500 sm:max-w-none">
                  {p("breadcrumbCategory")}
                </li>
                <li className="text-gray-300" aria-hidden>
                  /
                </li>
                <li className="font-medium text-gray-600" aria-current="page">
                  {p("breadcrumbLeaf")}
                </li>
              </ol>
            </nav>

            <header className="mt-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {p("h1")}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  {p("trustVerified")}
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                  {p("trustCis")}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-0.5 border-t border-gray-100 pt-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:gap-6">
                <p>
                  {t("listingAdded", {
                    date: formatProviderAddedDate(listedNow.toISOString(), locale),
                  })}
                </p>
                <p>
                  {t("listingUpdated", {
                    relative: formatListingUpdatedToday(locale),
                  })}
                </p>
              </div>
            </header>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gray-900">{t("aboutTitle")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{p("about")}</p>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gray-900">{t("termsTitle")}</h2>
              <div className="mt-4">
                <ProviderTermsGrid
                  moq={p("termMoq")}
                  payment={p("termPayment")}
                  shipping={p("termShipping")}
                  moqLabel={t("termLabels.moq")}
                  paymentLabel={t("termLabels.payment")}
                  shippingLabel={t("termLabels.shipping")}
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gray-900">{t("faqTitle")}</h2>
              <div className="mt-4">
                <FaqAccordion items={faqItems} ariaLabel={t("faqTitle")} />
              </div>
            </section>
          </div>

          <div className="mt-10 min-w-0 lg:col-span-1 lg:mt-0">
            <ProviderSidebar
              vendorName={p("vendorShortName")}
              statusOnlineLabel={t("statusOnline")}
              statusOfflineLabel={t("statusOffline")}
              online={contact.online}
              contactWhatsAppLabel={t("contactLockedMessage")}
              favorite={
                <CatalogFavoriteButton
                  key={`${listingKey}:${initialFavorite}`}
                  listingKey={listingKey}
                  initialFavorite={initialFavorite}
                  variant="sidebar"
                />
              }
              responseLabel={p("quickResponse")}
              deliveryLabel={p("quickDelivery")}
              whatsappHref={whatsappHref}
              contactsLocked
              quickInfoTitle={t("quickInfoTitle")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
