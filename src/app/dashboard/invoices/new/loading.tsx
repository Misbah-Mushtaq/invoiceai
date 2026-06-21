import { Skeleton } from "@/components/ui/skeleton";

export default function NewInvoiceLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Client card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* Line items card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-6 h-9 rounded-lg" />
            <Skeleton className="col-span-2 h-9 rounded-lg" />
            <Skeleton className="col-span-3 h-9 rounded-lg" />
            <Skeleton className="col-span-1 h-9 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Details card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-16" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="col-span-2 h-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
