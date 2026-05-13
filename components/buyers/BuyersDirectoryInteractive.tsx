"use client";

import { useTranslations } from "next-intl";
import { CatalogCheckoutResume } from "@/components/catalog/CatalogCheckoutResume";
import { BuyerCard } from "@/components/buyers/BuyerCard";
import { BUYERS } from "@/data/buyers-directory";

const SERVICE_KEYS = ["0", "1", "2", "3"] as const;

export function BuyersDirectoryInteractive() {
  const t = useTranslations("Pages.buyers");
  const tAuth = useTranslations("Auth");

  return (
    <>
      <CatalogCheckoutResume />
      <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-label={t("gridAria")}
    >
      {BUYERS.map((b) => {
        const base = `cards.${b.id}`;
        return (
        <BuyerCard
          key={b.id}
          buyer={b}
          profile={{
            name: t(`${base}.name`),
            specialization: t(`${base}.specialization`),
            description: t(`${base}.description`),
            services: SERVICE_KEYS.map((k) => t(`${base}.services.${k}`)),
          }}
            strings={{
              verifiedBadgeAria: t("verifiedBadgeAria"),
              openSlotBadge: t("openSlotBadge"),
              openSlotBadgeAria: t("openSlotBadgeAria"),
              experienceLine: t("experience", { years: b.experienceYears }),
              ordersLine: t("orders", { count: b.completedOrdersDisplay }),
              ctaContact: t("ctaContact"),
              ctaWhatsApp: t("ctaWhatsApp"),
              ctaCall: t("ctaCall"),
              ctaClaimSpot: t("ctaClaimSpot"),
              ctaTelegram: t("ctaTelegram"),
              ctaInstagram: t("ctaInstagram"),
              closeDialog: tAuth("closeDialog"),
              buyerSpotModal: {
                title: t("buyerSpotModal.title"),
                line1: t("buyerSpotModal.line1"),
                ctaPayment: t("buyerSpotModal.ctaPayment"),
                checkoutError: t("buyerSpotModal.checkoutError"),
                checkoutLoading: t("buyerSpotModal.checkoutLoading"),
                telegramLabel: t("buyerSpotModal.telegramLabel"),
              },
            }}
        />
        );
      })}
    </section>
    </>
  );
}
