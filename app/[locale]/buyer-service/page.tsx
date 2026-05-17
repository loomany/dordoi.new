import { setRequestLocale } from "next-intl/server";
import { ArticlePage } from "@/components/content/ArticlePage";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { Stage3TrustSections } from "@/components/seo/Stage3TrustSections";
import { buildSeoMetadata } from "@/lib/build-seo";
import { buyerServiceAnswer } from "@/lib/seo/ai-answer-content";
import { getStage3TrustContent } from "@/lib/seo/stage3-trust-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/buyer-service", "Seo.buyerService");
}

export default async function BuyerServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const trustContent = getStage3TrustContent(locale, "buyer-service");
  const answer = buyerServiceAnswer(locale);

  return (
    <>
      <SafePageSchemaJsonLd
        locale={locale}
        path="/buyer-service"
        name="Байер на рынке Дордой"
        description="Сервисная страница для покупателей, которым нужна помощь байера на рынке Дордой: проверка товара, фотоотчет, выкуп и передача партии."
        service={{
          name: "Байер на рынке Дордой",
          serviceType: "Buyer agent assistance",
          audience: "Wholesale buyers",
        }}
        keywords={["байер Дордой", "выкуп товара Дордой", "проверка товара Дордой"]}
      />
      {trustContent ? <FaqJsonLd items={trustContent.faq} /> : null}
      <ArticlePage namespace="buyerService">
        <AiAnswerBlock {...answer} />
        {trustContent ? (
          <div className="space-y-5">
            <Stage3TrustSections
              sections={trustContent.sections}
              cardClassName="rounded-xl border border-border/60 bg-card p-4 shadow-[var(--d-shadow-soft)] sm:p-5"
            />
            <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
              <h2 className="text-xl font-semibold">Частые вопросы</h2>
              <dl className="space-y-4">
                {trustContent.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="font-medium text-foreground">{item.question}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        ) : undefined}
      </ArticlePage>
    </>
  );
}
