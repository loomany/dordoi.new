import { getTranslations } from "next-intl/server";

type Props = {
  namespace: string;
  disclaimer?: boolean;
  children?: React.ReactNode;
};

/** Generic H1/H2 + body from messages `Pages.<ns>.*` */
export async function ArticlePage({ namespace, disclaimer, children }: Props) {
  const t = await getTranslations(`Pages.${namespace}`);
  const tl = disclaimer ? await getTranslations("LegalDisclaimer") : null;
  const sub = t("h2").trim();

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t("h1")}</h1>
        {sub ? <h2 className="text-xl text-muted-foreground">{sub}</h2> : null}
      </header>
      {children ?? <p className="leading-relaxed text-muted-foreground">{t("body")}</p>}
      {tl ? (
        <p className="rounded-[var(--d-radius-xl)] border border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
          {tl("short")}
        </p>
      ) : null}
    </article>
  );
}
