import Link from "next/link";

// Shown when notFound() is thrown from the invoice detail page —
// i.e. the invoice ID doesn't exist or belongs to another user.
export default function InvoiceNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-800">Invoice not found</h2>
        <p className="text-sm text-slate-500">
          This invoice doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
      </div>
      <Link
        href="/dashboard/invoices"
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Back to invoices
      </Link>
    </div>
  );
}
