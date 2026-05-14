import { CatalogCardSkeleton } from "@/components/catalog/skeleton/CatalogCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogBrowseGridSkeleton({
  count = 12,
  ariaLabel = "Loading catalog",
}: {
  count?: number;
  ariaLabel?: string;
}) {
  return (
    <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start lg:grid-cols-3"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex h-full min-h-0 w-full min-w-0 flex-col md:h-auto"
        >
          <CatalogCardSkeleton className="h-full min-h-0 w-full" />
        </div>
      ))}
    </section>
  );
}

export function CatalogPaginationSkeleton() {
  return (
    <div
      className="flex flex-nowrap items-center justify-center gap-1.5 pt-6 lg:pt-10"
      aria-hidden
    >
      <Skeleton className="size-7 rounded-md lg:size-9" />
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className="size-7 rounded-md lg:size-9" />
      ))}
      <Skeleton className="h-7 w-6 rounded-md lg:h-9" />
      <Skeleton className="size-7 rounded-md lg:size-9" />
      <Skeleton className="size-7 rounded-md lg:size-9" />
    </div>
  );
}
