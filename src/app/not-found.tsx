import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// 404 — shown when notFound() is thrown from any page (e.g.
// invoice not found, or a manual wrong URL).
// ─────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100">
        <svg
          className="h-10 w-10 text-brand-500"
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
        <p className="text-6xl font-black text-brand-200">404</p>
        <h1 className="text-xl font-bold text-slate-800">Page not found</h1>
        <p className="max-w-xs text-sm text-slate-500">
          That invoice, page, or resource doesn&apos;t exist or may have been
          deleted.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          View invoices
        </Link>
      </div>
    </div>
  );
}
