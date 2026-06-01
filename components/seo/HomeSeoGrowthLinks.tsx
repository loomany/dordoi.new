import { Link } from "@/i18n/navigation";
import {
  CORE_LINKS,
  COUNTRY_LINKS,
  POPULAR_CATEGORY_LINKS,
} from "@/lib/seo/stage2-content";
import {
  localizeLinkItems,
  stage4Copy,
} from "@/lib/seo/stage4-localized-content";

const workflowLinks = [
  { href: "/rynok-bishkek", label: "Рынок Бишкек" },
  { href: "/how-it-works", label: "Как работает Dordoi.help" },
  { href: "/for-buyers", label: "Покупателям" },
  { href: "/for-sellers", label: "Продавцам" },
  { href: "/kargo-dordoi", label: "Карго Дордой" },
  { href: "/faq", label: "FAQ" },
];

const supplierLinks = CORE_LINKS.filter((item) =>
  ["/catalog", "/suppliers", "/buyers"].includes(item.href),
);

function LinkList({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-2 text-sm">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeSeoGrowthLinks({ locale }: { locale: string }) {
  const copy = stage4Copy(locale);
  const labels = {
    suppliers: copy?.suppliers ?? "Поставщики",
    categories: copy?.categories ?? "Популярные категории",
    countries: copy?.countries ?? "Страны доставки",
    workflow: copy?.how ?? "Покупка и размещение",
  };
  const localizedSupplierLinks = localizeLinkItems(locale, supplierLinks);
  const localizedCategoryLinks = localizeLinkItems(locale, POPULAR_CATEGORY_LINKS);
  const localizedCountryLinks = localizeLinkItems(locale, COUNTRY_LINKS);
  const localizedWorkflowLinks = localizeLinkItems(locale, workflowLinks);

  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <LinkList title={labels.suppliers} links={localizedSupplierLinks} />
        <LinkList title={labels.categories} links={localizedCategoryLinks} />
        <LinkList title={labels.countries} links={localizedCountryLinks} />
        <LinkList title={labels.workflow} links={localizedWorkflowLinks} />
      </div>
    </section>
  );
}
