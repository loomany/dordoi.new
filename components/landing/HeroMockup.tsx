import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function HeroMockup() {
  const t = await getTranslations("Pages.home.mockup");

  return (
    <div
      className="relative isolate rounded-[var(--d-radius-2xl)] border border-border/60 bg-gradient-to-br from-card via-background to-muted/40 p-[var(--d-space-lg)] shadow-[var(--d-shadow-mockup)]"
      aria-hidden
    >
      <div className="mb-3 inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-[length:var(--d-text-xs)] font-medium text-muted-foreground">
        {t("badge")}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-[var(--d-radius-card)] border-border/70 shadow-[var(--d-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[length:var(--d-text-sm)] font-medium">
              {t("card1Title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[length:var(--d-text-xs)] text-muted-foreground">
            {t("card1Meta")}
          </CardContent>
        </Card>
        <Card className="rounded-[var(--d-radius-card)] border-border/70 shadow-[var(--d-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[length:var(--d-text-sm)] font-medium">
              {t("card2Title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[length:var(--d-text-xs)] text-muted-foreground">
            {t("card2Meta")}
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 rounded-[var(--d-radius-card)] border-primary/20 bg-primary/5 shadow-[var(--d-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[length:var(--d-text-sm)] font-medium">
              {t("card3Title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[length:var(--d-text-xs)] text-muted-foreground">
            {t("card3Meta")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
