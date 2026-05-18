import { getLocale, getTranslations } from "next-intl/server";
import {
  CreditCard,
  ImageIcon,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Tag,
  Truck,
} from "lucide-react";

import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import { VendorContactActions } from "@/components/provider/VendorContactActions";
import { VendorPhotoBatchFeed } from "@/components/provider/VendorPhotoBatchFeed";
import { VendorRecommendedSellers } from "@/components/provider/VendorRecommendedSellers";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { VendorFaqSection } from "@/components/vendors/VendorFaqSection";
import { Link } from "@/i18n/navigation";
import { catalogListingKeyFromSlug } from "@/lib/catalog/listing-key";
import {
  buildCatalogCardSourceRowForPublishedVendor,
  fetchApprovedVendorPhotoBatches,
  fetchRecommendedVendorsForProfile,
  type PublishedVendorRow,
} from "@/lib/catalog/published-vendors";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { hasFullCatalogAccess } from "@/lib/catalog/catalog-access";
import { fetchBuyerFavoriteKeySet } from "@/lib/favorites/buyer-favorites";
import { digitsOnly } from "@/lib/phone";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";
import {
  ensureHttpUrl,
  resolveGoogleMapsHref,
  twoGisFirmPageUrlFromGooglePlaceId,
} from "@/lib/catalog/vendor-map-links";
import { getShowcaseProfileFields } from "@/lib/catalog/showcase-vendor-i18n";
import { displayVendorPaymentMethods, displayVendorTerm } from "@/lib/vendor/vendor-payment-display";
import {
  resolveSeoCategoryForMainId,
  seoCategoryPath,
} from "@/lib/catalog/seo-category-routes";
import { normalizeVendorCategoryMainSlugs } from "@/lib/catalog/vendor-category-normalize";
import {
  primaryVendorMainCategoryId,
  vendorPublicListingNumber,
} from "@/lib/catalog/vendor-public-seo";
import {
  lockedVendorContactAvailability,
  stripLockedVendorContacts,
} from "@/lib/catalog/vendor-privacy";
import { buildSafeVendorPublicDescription } from "@/lib/catalog/vendor-public-description";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { buildVendorFaq } from "@/lib/dordoi/vendorFaq";

type Props = {
  vendor: PublishedVendorRow;
  /** `catalog` — masked H1; `seo` — store name for `/suppliers/` index page. */
  profileMode?: "catalog" | "seo";
};

function ensureHttp(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function telegramHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) {
    return `https://t.me/${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith("t.me/")) {
    return `https://${trimmed}`;
  }
  return ensureHttp(trimmed);
}

function whatsappHref(raw: string | null | undefined): string | null {
  const digits = digitsOnly(raw ?? "");
  return digits ? `https://wa.me/${digits}` : null;
}

function optionalText(value: string | null | undefined, fallback = "—"): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function coarseDordoiLocation(locale: string): string {
  switch (locale) {
    case "kk":
      return "Дордой нарығы, Бішкек";
    case "kg":
      return "Дордой базары, Бишкек";
    case "uz":
      return "Dordoy bozori, Bishkek";
    case "tj":
      return "Бозори Дордой, Бишкек";
    default:
      return "Рынок Дордой, Бишкек";
  }
}

function MediaImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URLs; plain img avoids remotePatterns churn.
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}

export async function DatabaseProviderProfileView({
  vendor,
  profileMode = "catalog",
}: Props) {
  const t = await getTranslations("Pages.providerProfile");
  const tVendorFaq = await getTranslations("Pages.providerProfile.vendorFaq");
  const tTree = await getTranslations("catalogCategoryTree");
  const tBrowse = await getTranslations("Pages.catalogBrowse");
  const locale = await getLocale();
  const profile = await getSessionProfile();
  const catalogAccessUnlocked = await hasFullCatalogAccess(profile);
  const publicVendor = catalogAccessUnlocked
    ? vendor
    : stripLockedVendorContacts(vendor);
  const lockedContactOptions = catalogAccessUnlocked
    ? undefined
    : lockedVendorContactAvailability(vendor);
  const favoriteKeys = profile
    ? await fetchBuyerFavoriteKeySet(profile.userId)
    : new Set<string>();

  const showcase = getShowcaseProfileFields(publicVendor.slug, tBrowse);
  const cardSourceOptions = {
    tBrowse,
    tTreeCategory: (key: string) => tTree(key),
    locale,
  };
  const cardRow = buildCatalogCardSourceRowForPublishedVendor(
    publicVendor,
    cardSourceOptions,
  );
  // Server-only: keep parsed_ai_data out of publicVendor/RSC, but reuse its
  // sanitized card description so profile and catalog copy stay identical.
  const profileDescriptionCardRow = catalogAccessUnlocked
    ? cardRow
    : buildCatalogCardSourceRowForPublishedVendor(vendor, cardSourceOptions);
  const profileCardDescription = profileDescriptionCardRow.display.description;
  const primaryMainId = primaryVendorMainCategoryId(publicVendor.categories);
  const categoryPhrase = primaryMainId
    ? t(`publicSeo.categories.${primaryMainId}`)
    : null;
  const storeDisplayName =
    vendor.store_name?.trim() || vendor.seo_slug?.trim() || vendor.slug;
  const safePublicH1 = categoryPhrase
    ? t("publicSeo.h1WithCategory", { category: categoryPhrase })
    : t("publicSeo.h1Fallback");
  const safeVisibleLabel = categoryPhrase
    ? t("publicSeo.visibleLabelWithCategory", { category: categoryPhrase })
    : t("publicSeo.visibleLabelNumbered", {
        number: vendorPublicListingNumber(vendor.id),
      });
  const publicH1 =
    profileMode === "seo" && catalogAccessUnlocked
      ? storeDisplayName
      : safePublicH1;
  const visibleLabel =
    profileMode === "seo" && catalogAccessUnlocked
      ? storeDisplayName
      : safeVisibleLabel;
  const breadcrumbLeaf =
    profileMode === "seo" && catalogAccessUnlocked
      ? storeDisplayName
      : t("publicSeo.breadcrumbLeaf");
  const seoCategoryRoute = primaryMainId
    ? resolveSeoCategoryForMainId(primaryMainId)
    : undefined;
  const categoryBreadcrumbHref = seoCategoryRoute
    ? seoCategoryPath(locale as RouteLocale, seoCategoryRoute)
    : undefined;
  const categoryBreadcrumbLabel = seoCategoryRoute
    ? seoCategoryRoute.h1ByLocale[locale as RouteLocale]
    : null;
  const categoryLabels = showcase
    ? showcase.categories
    : cardRow.display.categories;
  const aboutBodyParagraphs = [
    buildSafeVendorPublicDescription({
      cardDescription: profileCardDescription,
      categoryLabel: categoryLabels[0] ?? categoryPhrase,
    }),
  ];
  const displayLocationRow = catalogAccessUnlocked
    ? (showcase?.locationRow ?? vendor.location_row)
    : coarseDordoiLocation(locale);
  const listingKey = catalogListingKeyFromSlug(vendor.slug);
  const initialFavorite = favoriteKeys.has(listingKey);
  const primaryWhatsapp = catalogAccessUnlocked
    ? whatsappHref(vendor.whatsapp_1) ?? whatsappHref(vendor.phone_number)
    : null;
  const secondaryWhatsapp = catalogAccessUnlocked
    ? whatsappHref(vendor.whatsapp_2)
    : null;
  const telegramHrefResolved = catalogAccessUnlocked && vendor.telegram_url
    ? telegramHref(vendor.telegram_url)
    : null;
  const instagramHrefResolved = catalogAccessUnlocked && vendor.instagram_url
    ? ensureHttp(vendor.instagram_url)
    : null;
  const telHrefResolved = catalogAccessUnlocked && vendor.phone_number
    ? `tel:${digitsOnly(vendor.phone_number)}`
    : null;
  const googleMapsPublicHref = catalogAccessUnlocked
    ? resolveGoogleMapsHref(vendor.google_maps_uri, vendor.google_place_id)
    : null;
  const twoGisPublicHref = catalogAccessUnlocked
    ? ensureHttpUrl(vendor.two_gis_uri) ??
      twoGisFirmPageUrlFromGooglePlaceId(vendor.google_place_id)
    : null;
  const yandexMapsPublicHref = catalogAccessUnlocked
    ? ensureHttpUrl(vendor.yandex_maps_uri)
    : null;
  const unlockedContactHrefProps = catalogAccessUnlocked
    ? {
        primaryWhatsapp,
        secondaryWhatsapp,
        telegramHref: telegramHrefResolved,
        instagramHref: instagramHrefResolved,
        telHref: telHrefResolved,
        googleMapsHref: googleMapsPublicHref,
        twoGisHref: twoGisPublicHref,
        yandexMapsHref: yandexMapsPublicHref,
      }
    : {};
  const PHOTO_FEED_PAGE_SIZE = 4;
  const initialPhotoBatches = await fetchApprovedVendorPhotoBatches({
    vendorId: vendor.id,
    limit: PHOTO_FEED_PAGE_SIZE,
  });
  const recommendedVendors = await fetchRecommendedVendorsForProfile(vendor);
  const safeRecommendedVendors = catalogAccessUnlocked
    ? recommendedVendors
    : recommendedVendors.map((related) => stripLockedVendorContacts(related));
  const recommendedSellerCards = safeRecommendedVendors.map((related) =>
    buildCatalogCardSourceRowForPublishedVendor(related, {
      tBrowse,
      tTreeCategory: (key) => tTree(key),
      locale,
    }),
  );
  const aboutDescriptionText =
    aboutBodyParagraphs.length > 0 ? aboutBodyParagraphs.join(" ") : null;
  const faqItems = buildVendorFaq(
    {
      name: publicH1,
      category: normalizeVendorCategoryMainSlugs(publicVendor.categories)[0] ?? null,
      categoryLabel: categoryLabels[0] ?? null,
      city: tVendorFaq("defaultCity"),
      country: tVendorFaq("defaultCountry"),
      description: aboutDescriptionText,
      salesType: cardRow.display.tradeType,
      minOrder: displayVendorTerm(publicVendor.min_batch, t("termMoqFallback")),
      locationRow: publicVendor.location_row,
      hasWhatsapp: false,
      hasPhone: false,
      hasInstagram: false,
      hasTelegram: false,
      hasRecommendedSellers: recommendedVendors.length > 0,
      deliveryHelp: publicVendor.delivery_help,
      samplesAvailable: publicVendor.samples_available,
    },
    (key, values) => tVendorFaq(key, values),
  );
  const terms = showcase
    ? [
        {
          Icon: Package,
          label: t("termLabels.moq"),
          value: displayVendorTerm(showcase.terms.minBatch, t("termMoqFallback")),
        },
        {
          Icon: CreditCard,
          label: t("termLabels.payment"),
          value: displayVendorPaymentMethods(
            showcase.terms.paymentMethods,
            t("termPaymentFallback"),
          ),
        },
        {
          Icon: Truck,
          label: t("termLabels.shipping"),
          value: optionalText(
            showcase.terms.shippingValue,
            t("termValueDeliveryNo"),
          ),
        },
        {
          Icon: Package,
          label: t("termLabels.samples"),
          value: optionalText(showcase.terms.samplesValue),
        },
        {
          Icon: RotateCcw,
          label: t("termLabels.returnsBrak"),
          value: displayVendorTerm(
            showcase.terms.returnsPolicy,
            t("termReturnsFallback"),
          ),
        },
      ]
    : [
        {
          Icon: Package,
          label: t("termLabels.moq"),
          value: displayVendorTerm(publicVendor.min_batch, t("termMoqFallback")),
        },
        {
          Icon: CreditCard,
          label: t("termLabels.payment"),
          value: displayVendorPaymentMethods(
            publicVendor.payment_methods,
            t("termPaymentFallback"),
          ),
        },
        {
          Icon: Truck,
          label: t("termLabels.shipping"),
          value: publicVendor.delivery_help
            ? t("termValueDeliveryYes")
            : t("termValueDeliveryNo"),
        },
        {
          Icon: Package,
          label: t("termLabels.samples"),
          value: publicVendor.samples_note?.trim()
            ? publicVendor.samples_note.trim()
            : publicVendor.samples_available
              ? t("termValueSamplesYes")
              : t("termValueSamplesAsk"),
        },
        {
          Icon: RotateCcw,
          label: t("termLabels.returnsBrak"),
          value: displayVendorTerm(
            publicVendor.returns_policy,
            t("termReturnsFallback"),
          ),
        },
      ];

  return (
    <>
      <div className="bg-[#FAFAF8] pb-16 pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <main className="order-2 min-w-0 rounded-[var(--d-radius-2xl)] border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6 lg:order-none">
              <nav
                aria-label={t("breadcrumbNav")}
                className="mb-4 text-xs text-muted-foreground/75"
              >
                <ol className="flex flex-wrap items-center gap-1.5">
                  <li>
                    <Link href="/" className="transition-colors hover:text-foreground">
                      {t("breadcrumbHome")}
                    </Link>
                  </li>
                  <li className="text-muted-foreground/40" aria-hidden>
                    /
                  </li>
                  <li>
                    <Link href="/catalog" className="transition-colors hover:text-foreground">
                      {t("breadcrumbCatalog")}
                    </Link>
                  </li>
                  {categoryBreadcrumbHref && categoryBreadcrumbLabel ? (
                    <>
                      <li className="text-muted-foreground/40" aria-hidden>
                        /
                      </li>
                      <li>
                        <Link
                          href={categoryBreadcrumbHref}
                          className="transition-colors hover:text-foreground"
                        >
                          {categoryBreadcrumbLabel}
                        </Link>
                      </li>
                    </>
                  ) : null}
                  <li className="text-muted-foreground/40" aria-hidden>
                    /
                  </li>
                  <li className="font-medium text-muted-foreground" aria-current="page">
                    {breadcrumbLeaf}
                  </li>
                </ol>
              </nav>

              <header className="relative grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start sm:gap-x-3">
                <div className="pointer-events-none hidden min-w-0 sm:block" aria-hidden />
                <div className="min-w-0 pr-12 sm:col-start-2 sm:w-full sm:px-0 sm:text-center">
                  <h1 className="sr-only text-2xl font-extrabold tracking-tight text-card-foreground sm:not-sr-only sm:text-3xl lg:text-4xl">
                    {publicH1}
                  </h1>
                  <div className="mt-0 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:mt-3 sm:justify-center">
                    {displayLocationRow ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4 text-[var(--d-card-accent)]" aria-hidden />
                        {displayLocationRow}
                      </span>
                    ) : null}
                    <span>
                      {t("listingAdded", {
                        date: formatProviderAddedDate(vendor.created_at, locale),
                      })}
                    </span>
                    <span>{t("listingUpdated", { relative: formatListingUpdatedToday(locale) })}</span>
                  </div>
                </div>
                <CatalogFavoriteButton
                  key={`${listingKey}:${initialFavorite}`}
                  listingKey={listingKey}
                  initialFavorite={initialFavorite}
                  variant="card"
                  showCardLabel={false}
                  className="absolute right-0 top-0 z-10 shrink-0 sm:static sm:col-start-3 sm:row-start-1 sm:justify-self-end sm:self-start sm:right-auto sm:top-auto sm:z-auto"
                />
              </header>

              {categoryLabels.length > 0 ? (
                <section className="mt-6">
                  <dl className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
                    <div
                      className={
                        categoryLabels.length === 1
                          ? "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4 sm:gap-x-4 sm:px-5"
                          : "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:px-5"
                      }
                    >
                      <dt className="flex min-w-0 shrink-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--d-card-accent)_8%,transparent)] text-[var(--d-card-accent)]">
                          <Tag className="size-4" aria-hidden />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {tBrowse("cardCategoriesMany")}
                        </span>
                      </dt>
                      <dd className="flex min-w-0 items-center justify-end self-end sm:self-auto">
                        <ul className="flex flex-wrap items-center justify-end gap-2">
                          {categoryLabels.map((cat, i) => (
                            <li
                              key={`${cat}:${i}`}
                              className="inline-flex items-center rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_25%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_4%,white)] px-3 py-1.5 text-xs font-semibold text-card-foreground sm:text-sm"
                            >
                              {cat}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              <section className="mt-8 border-t border-border/70 pt-6">
                <h2 className="text-lg font-semibold text-card-foreground">{t("aboutTitle")}</h2>
                <div className="mt-3 space-y-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {aboutBodyParagraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-card-foreground">{t("termsTitle")}</h2>
                <dl className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
                  {terms.map(({ Icon, label, value }, index) => (
                    <div
                      key={label}
                      className={`flex flex-col gap-2 px-4 py-4 sm:grid sm:grid-cols-[14rem_1fr] sm:items-start sm:gap-4 sm:px-5 ${
                        index > 0 ? "border-t border-border/60" : ""
                      }`}
                    >
                      <dt className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--d-card-accent)_8%,transparent)] text-[var(--d-card-accent)]">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                      </dt>
                      <dd className="whitespace-pre-line text-sm font-medium text-card-foreground sm:pt-1">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {vendor.container_photo_url || initialPhotoBatches.length > 0 ? (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {t("mediaSectionTitle")}
                  </h2>
                  {vendor.container_photo_url ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("containerLocationCaption")}
                      </p>
                      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
                        <MediaImage
                          src={vendor.container_photo_url}
                          alt={t("containerLocationAlt", { title: visibleLabel })}
                          className="aspect-video w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                  {initialPhotoBatches.length > 0 ? (
                    <div className="mt-5">
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <ImageIcon className="size-4" aria-hidden />
                        {t("productPhotosCaption")}
                      </p>
                      <VendorPhotoBatchFeed
                        vendorId={vendor.id}
                        initialBatches={initialPhotoBatches}
                        pageSize={PHOTO_FEED_PAGE_SIZE}
                        altBase={t("productPhotosAltBase", { title: visibleLabel })}
                        locale={locale}
                        productVideos={
                          vendor.product_videos && vendor.product_videos.length > 0
                            ? vendor.product_videos
                            : undefined
                        }
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}

              <VendorRecommendedSellers
                cards={recommendedSellerCards}
                favoriteKeys={[...favoriteKeys]}
                title={t("recommendedSellersTitle")}
                navAriaLabel={t("recommendedSellersNavAria")}
                viewProfileLabel={tBrowse("viewProfile")}
                aboutStoreLabel={tBrowse("cardAboutStore")}
                collapseLabel={tBrowse("cardCollapse")}
                expandLabel={tBrowse("cardExpand")}
                hasFullCatalogAccess={catalogAccessUnlocked}
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
                lockedCardUnlockLabel={tBrowse("paywall.unlockCard")}
              />
              <VendorFaqSection
                items={faqItems}
                sectionTitle={tVendorFaq("sectionTitle", { vendorName: publicH1 })}
                sectionLead={tVendorFaq("sectionLead")}
                sectionAria={tVendorFaq("sectionAria", { vendorName: publicH1 })}
              />
              <FaqJsonLd items={faqItems} />
            </main>

            <aside className="order-1 rounded-[var(--d-radius-2xl)] border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-card p-5 shadow-[var(--d-shadow-soft)] lg:sticky lg:top-24 lg:order-none">
              <div className="flex flex-col items-center text-center">
                {vendor.logo_url ? (
                  <div className="flex size-[120px] items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-white shadow-sm">
                    <MediaImage
                      src={vendor.logo_url}
                      alt={t("logoAlt", { title: visibleLabel })}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-[120px] items-center justify-center rounded-full border border-border/70 bg-muted text-[var(--d-card-accent)]">
                    <Phone className="size-11" aria-hidden />
                  </div>
                )}
                <h2 className="mt-6 text-lg font-bold text-card-foreground lg:hidden">{visibleLabel}</h2>
              </div>

              <VendorContactActions
                listingKey={listingKey}
                initialFavorite={initialFavorite}
                {...unlockedContactHrefProps}
                lockedContactAvailability={lockedContactOptions}
                contactsUnlocked={catalogAccessUnlocked}
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
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
