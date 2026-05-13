import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { VendorFaqItem } from "@/lib/dordoi/vendorFaq";

type Props = {
  items: VendorFaqItem[];
  sectionTitle: string;
  sectionLead: string;
  sectionAria: string;
};

export function VendorFaqSection({
  items,
  sectionTitle,
  sectionLead,
  sectionAria,
}: Props) {
  if (items.length === 0) return null;

  return (
    <section
      className="mt-8 border-t border-border/70 pt-8"
      aria-labelledby="vendor-faq-title"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        FAQ
      </p>
      <h2
        id="vendor-faq-title"
        className="mt-2 text-lg font-semibold tracking-tight text-foreground"
      >
        {sectionTitle}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{sectionLead}</p>
      <div className="mt-4">
        <FaqAccordion
          items={items}
          defaultOpenIndex={0}
          ariaLabel={sectionAria}
        />
      </div>
    </section>
  );
}
