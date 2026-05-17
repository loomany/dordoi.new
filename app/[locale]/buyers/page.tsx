import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BuyersDirectoryLayout } from "@/components/buyers/BuyersDirectoryLayout";
import { buildSeoMetadata } from "@/lib/build-seo";
import { COUNTRY_LINKS } from "@/lib/seo/stage2-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/buyers", "Seo.buyers");
}

export default async function BuyersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <BuyersDirectoryLayout />
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Покупателям из стран СНГ
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {COUNTRY_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
