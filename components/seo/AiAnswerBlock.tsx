import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { LinkItem } from "@/lib/seo/stage2-content";

type AiAnswerBlockProps = {
  title: string;
  paragraphs: string[];
  links?: LinkItem[];
};

export function AiAnswerBlock({
  title,
  paragraphs,
  links = [],
}: AiAnswerBlockProps) {
  return (
    <section
      data-ai-answer-block="true"
      className="rounded-[var(--d-radius-2xl)] border border-primary/20 bg-primary/5 p-5 shadow-[var(--d-shadow-soft)] sm:p-6"
    >
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.slice(0, 72)}
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
      </div>
      {links.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              {link.label}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
