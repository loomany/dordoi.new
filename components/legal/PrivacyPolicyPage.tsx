import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function PrivacyPolicyPage() {
  const t = await getTranslations("Pages.privacy");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <div
        className={[
          "prose prose-neutral max-w-none dark:prose-invert",
          "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-h1:mb-8 prose-h1:text-4xl prose-h1:leading-tight",
          "prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2 prose-h2:text-xl",
          "prose-p:mb-4 prose-p:last:mb-0 prose-p:leading-relaxed prose-p:text-muted-foreground",
          "prose-strong:text-foreground",
          "prose-ul:my-4 prose-ul:space-y-2 prose-li:text-muted-foreground prose-li:marker:text-[var(--d-card-accent)]",
          "prose-a:font-medium prose-a:text-[var(--d-card-accent)] prose-a:no-underline hover:prose-a:underline",
        ].join(" ")}
      >
        <h1>{t("h1")}</h1>

        <section>
          <h2>{t("s1Title")}</h2>
          <p>{t("s1p1")}</p>
          <p>{t("s1p2")}</p>
        </section>

        <section>
          <h2>{t("s2Title")}</h2>
          <p>{t("s2p1")}</p>
          <p>{t("s2p2")}</p>
        </section>

        <section>
          <h2>{t("s3Title")}</h2>
          <p>{t("s3p1")}</p>
          <p>{t("s3p2")}</p>
          <p>{t("s3p3")}</p>
        </section>

        <section>
          <h2>{t("s4Title")}</h2>
          <p className="!mb-3">{t("s4Intro")}</p>
          <ul>
            <li>{t("s4li1")}</li>
            <li>{t("s4li2")}</li>
            <li>{t("s4li3")}</li>
            <li>{t("s4li4")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("s5Title")}</h2>
          <p>{t("s5p1")}</p>
        </section>

        <section>
          <h2>{t("s6Title")}</h2>
          <p>{t("s6p1")}</p>
          <p>{t("s6p2")}</p>
        </section>

        <section>
          <h2>{t("s7Title")}</h2>
          <p>
            {t("s7before")}
            <Link href={`mailto:${t("supportEmail")}`}>{t("supportEmail")}</Link>
            {t("s7between")}
            <Link href={`https://t.me/${t("supportTelegram").replace(/^@/, "")}`}>
              {t("supportTelegram")}
            </Link>
            {t("s7after")}
          </p>
        </section>
      </div>
    </article>
  );
}
