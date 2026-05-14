import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CatalogCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "flex min-h-0 w-full flex-col rounded-[var(--d-radius-2xl)] border border-[var(--d-catalog-card-border)] bg-card px-4 pt-4 pb-2.5 shadow-[var(--d-catalog-card-shadow-mobile)] sm:px-5 sm:pt-5 sm:pb-3 lg:shadow-[var(--d-shadow-soft)]",
        className,
      )}
      aria-hidden
    >
      <div className="flex gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full sm:size-[3.25rem]" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 max-w-[12rem]" />
          <Skeleton className="h-3 w-1/2 max-w-[9rem]" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
      <Skeleton className="mt-4 aspect-[4/3] w-full rounded-xl" />
    </article>
  );
}
