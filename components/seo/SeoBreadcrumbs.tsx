import { Link } from "@/i18n/navigation";

type Crumb = {
  label: string;
  href?: string;
};

type SeoBreadcrumbsProps = {
  items: Crumb[];
  navLabel: string;
};

export function SeoBreadcrumbs({ items, navLabel }: SeoBreadcrumbsProps) {
  return (
    <nav aria-label={navLabel} className="text-xs text-muted-foreground/75">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span className="text-muted-foreground/40" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  className={isLast ? "font-medium text-muted-foreground" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
