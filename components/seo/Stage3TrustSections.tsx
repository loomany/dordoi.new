import { ShieldCheck } from "lucide-react";
import type { SeoContentSection } from "@/lib/seo/stage2-content";

type Props = {
  sections: SeoContentSection[];
  cardClassName?: string;
};

const defaultCardClass =
  "rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)]";

export function Stage3TrustSections({
  sections,
  cardClassName = defaultCardClass,
}: Props) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className={cardClassName}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              {section.body ? (
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 72)}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}
              {section.items ? (
                <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <div key={item.title} className="border-t border-border/60 pt-3">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
