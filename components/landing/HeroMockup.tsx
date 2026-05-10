import { getTranslations } from "next-intl/server";

function CatalogMiniCard({
  title,
  meta,
  statusLabel,
  status,
}: {
  title: string;
  meta: string;
  statusLabel: string;
  status: string;
}) {
  return (
    <div className="rounded-[var(--d-radius-card)] border border-zinc-100 bg-white p-3.5 shadow-[var(--d-shadow-soft)]">
      <div className="text-sm font-semibold text-zinc-950">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{meta}</p>
      <div className="mt-2.5 border-t border-zinc-100 pt-2 text-[11px] leading-snug text-zinc-500">
        <span className="font-medium text-zinc-600">{statusLabel}: </span>
        <span>{status}</span>
      </div>
    </div>
  );
}

export async function HeroMockup() {
  const t = await getTranslations("Pages.home.mockup");

  return (
    <div
      className="rounded-[var(--d-radius-2xl)] border border-zinc-200/90 bg-white p-4 shadow-[var(--d-shadow-mockup)] sm:p-5"
      aria-hidden
    >
      <div className="flex flex-col gap-2.5">
        <CatalogMiniCard
          title={t("suppliersTitle")}
          meta={t("suppliersMeta")}
          statusLabel={t("statusLabel")}
          status={t("suppliersStatus")}
        />
        <CatalogMiniCard
          title={t("buyersTitle")}
          meta={t("buyersMeta")}
          statusLabel={t("statusLabel")}
          status={t("buyersStatus")}
        />
        <CatalogMiniCard
          title={t("cargoTitle")}
          meta={t("cargoMeta")}
          statusLabel={t("statusLabel")}
          status={t("cargoStatus")}
        />
      </div>

      <div className="mt-4 rounded-[var(--d-radius-card)] border border-zinc-100 bg-[#F8FAFC] p-4">
        <div className="text-sm font-semibold text-zinc-950">{t("leadTitle")}</div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">{t("leadBody")}</p>
        <div className="mt-3 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm">
          {t("leadCta")}
        </div>
      </div>
    </div>
  );
}
