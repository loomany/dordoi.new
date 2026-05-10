"use client";

import { useTranslations } from "next-intl";
import { BuyerCard } from "@/components/buyers/BuyerCard";
import { BUYERS } from "@/data/buyers-directory";

export function BuyersDirectoryInteractive() {
  const t = useTranslations("Pages.buyers");

  return (
    <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-label={t("gridAria")}
    >
      {BUYERS.map((b) => (
        <BuyerCard
          key={b.id}
          buyer={b}
            strings={{
              verifiedBadgeAria: t("verifiedBadgeAria"),
              experienceLine: t("experience", { years: b.experienceYears }),
              ordersLine: t("orders", { count: b.completedOrdersDisplay }),
              ctaContact: t("ctaContact"),
              ctaTelegram: t("ctaTelegram"),
              ctaInstagram: t("ctaInstagram"),
            }}
        />
      ))}
    </section>
  );
}
