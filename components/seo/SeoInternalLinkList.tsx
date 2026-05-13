import { Link } from "@/i18n/navigation";
import type { SeoInternalLink } from "@/lib/seo/seo-internal-links";

type SeoInternalLinkListProps = {
  links: SeoInternalLink[];
  className?: string;
  linkClassName?: string;
};

/** Compact crawlable internal link list for SEO hubs. */
export function SeoInternalLinkList({
  links,
  className,
  linkClassName = "text-sm text-muted-foreground transition-colors hover:text-foreground",
}: SeoInternalLinkListProps) {
  if (links.length === 0) return null;

  return (
    <ul className={className ?? "flex flex-col gap-2"}>
      {links.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={linkClassName}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
