"use client";

// ─────────────────────────────────────────────────────────────
// ErrorDisplay — friendly recovery UI for error boundaries.
//
// Used in:
//   • app/dashboard/error.tsx          (page-level boundary)
//   • app/global-error.tsx             (root-level boundary)
//   • inline fetch error states
// ─────────────────────────────────────────────────────────────

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  reset?: () => void;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  reset,
}: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="max-w-sm text-sm text-slate-500">{message}</p>
      </div>

      {reset && (
        <button
          onClick={reset}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
