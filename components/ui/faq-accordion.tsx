import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
  className?: string;
  /** Visually hidden heading for the block (screen readers). */
  ariaLabel?: string;
};

/** SEO-friendly FAQ: native `<details>` so content is in initial HTML. */
export function FaqAccordion({ items, className, ariaLabel }: Props) {
  return (
    <section aria-label={ariaLabel} className={cn("space-y-2", className)}>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {items.map((item, i) => (
          <details key={i} className="group open:bg-gray-50/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-left font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">{item.question}</span>
              <ChevronDown
                className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-t border-gray-100 px-4 pb-4 pt-0">
              <p className="text-sm leading-relaxed text-gray-600">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
