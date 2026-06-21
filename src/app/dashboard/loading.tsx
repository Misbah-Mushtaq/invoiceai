import { DashboardStatsSkeleton, InvoiceListSkeleton, Skeleton } from "@/components/ui/skeleton";

// ─────────────────────────────────────────────────────────────
// loading.tsx — Next.js automatically renders this file while
// dashboard/page.tsx is streaming its server data. It is a
// pixel-matched shimmer version of the real dashboard layout.
// ─────────────────────────────────────────────────────────────

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Stats grid skeleton */}
      <DashboardStatsSkeleton />

      {/* Recent invoices skeleton */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <InvoiceListSkeleton />
      </div>
    </div>
  );
}
