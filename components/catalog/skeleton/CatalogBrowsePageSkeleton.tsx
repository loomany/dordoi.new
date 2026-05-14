import {
  CatalogBrowseGridSkeleton,
  CatalogPaginationSkeleton,
} from "@/components/catalog/skeleton/CatalogBrowseGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogBrowsePageSkeleton() {
  return (
    <div className="bg-[#FAFAF8] pb-12 pt-5 sm:pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-16" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start lg:gap-x-6">
            <div className="flex flex-col gap-3 lg:col-span-2">
              <header className="space-y-3">
                <Skeleton className="h-10 w-full max-w-xl" />
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-full max-w-xl" />
                <Skeleton className="h-4 w-40" />
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Skeleton className="h-11 w-full rounded-full" />
                <Skeleton className="h-11 w-full rounded-full md:w-44" />
              </div>
            </div>

            <aside className="hidden rounded-2xl border border-border/70 bg-card p-5 lg:block">
              <Skeleton className="mx-auto size-24 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-4 w-32" />
              <Skeleton className="mx-auto mt-2 h-3 w-40" />
            </aside>
          </div>
        </div>

        <div className="mt-6">
          <CatalogBrowseGridSkeleton />
          <CatalogPaginationSkeleton />
        </div>
      </div>
    </div>
  );
}
