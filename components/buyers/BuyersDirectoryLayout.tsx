import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BuyersDirectoryInteractive } from "@/components/buyers/BuyersDirectoryInteractive";

/** Directory of sourcing agents — `/buyers`. */
export async function BuyersDirectoryLayout() {
  const t = await getTranslations("Pages.buyers");

  return (
    <div className="bg-gray-50/80 pb-16 pt-10 sm:pt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

        <header className="mt-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {t("h1")}
          </h1>
          <p className="mt-3 max-w-3xl text-gray-500">{t("subtitle")}</p>
        </header>

        <BuyersDirectoryInteractive />
      </div>
    </div>
  );
}
