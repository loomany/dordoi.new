import { getTranslations } from "next-intl/server";

const proseTermsClassName = [
  "prose prose-neutral max-w-none dark:prose-invert",
  "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
  "prose-h1:mb-8 prose-h1:text-4xl prose-h1:leading-tight",
  "prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2 prose-h2:text-xl",
  "prose-h3:mt-5 prose-h3:mb-3 prose-h3:text-base prose-h3:font-semibold prose-h3:leading-relaxed prose-h3:text-foreground",
  "prose-p:mb-4 prose-p:last:mb-0 prose-p:leading-relaxed prose-p:text-muted-foreground",
  "prose-strong:text-foreground",
  "prose-a:font-medium prose-a:text-[var(--d-card-accent)] prose-a:no-underline hover:prose-a:underline",
].join(" ");

export async function TermsOfServicePage() {
  const t = await getTranslations("Pages.terms");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <div className={proseTermsClassName}>
        <h1>{t("h1")}</h1>

        <section>
          <h2>{t("s1Title")}</h2>
          <h3>{t("s1h3_1")}</h3>
          <h3>{t("s1h3_2")}</h3>
        </section>

        <section>
          <h2>{t("s2Title")}</h2>
          <p className="not-prose mt-5 mb-3 text-base font-semibold leading-relaxed text-foreground">
            {t("s2Intro")}
          </p>
          <h3>{t("s2h3_1")}</h3>
          <h3>{t("s2h3_2")}</h3>
          <h3>{t("s2h3_3")}</h3>
          <h3>{t("s2h3_4")}</h3>
        </section>

        <section>
          <h2>{t("s3Title")}</h2>
          <h3>{t("s3h3_1")}</h3>
          <h3>{t("s3h3_2")}</h3>
        </section>

        <section>
          <h2>{t("s4Title")}</h2>
          <h3>{t("s4h3_1")}</h3>
          <h3>{t("s4h3_2")}</h3>
        </section>

        <section>
          <h2>{t("s5Title")}</h2>
          <h3>{t("s5h3_1")}</h3>
          <h3>{t("s5h3_2")}</h3>
        </section>
      </div>
    </article>
  );
}
