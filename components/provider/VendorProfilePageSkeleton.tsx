import { Skeleton } from "@/components/ui/skeleton";

export function VendorProfilePageSkeleton() {
  return (
    <div className="bg-[#FAFAF8] pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div>
          <main className="order-2 min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:order-none">
            <div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="mt-6 h-10 w-full max-w-lg mx-auto" />
              <Skeleton className="mt-3 h-4 w-64 mx-auto" />
            </div>
            <Skeleton className="mt-8 h-16 w-full rounded-xl" />
            <Skeleton className="mt-8 h-5 w-32" />
            <div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="mt-8 h-5 w-28" />
            <Skeleton className="mt-4 h-40 w-full rounded-xl" />
            <Skeleton className="mt-8 aspect-video w-full rounded-xl" />
          </main>
          <aside className="order-1 min-w-0 lg:order-none">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </aside>
        </div>
      </div>
    </div>
  );
}
