"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ui/error-display";

// ─────────────────────────────────────────────────────────────
// error.tsx — Next.js page-level error boundary.
// Must be a client component because it uses the `reset` callback.
// Wraps every route segment inside /dashboard.
// ─────────────────────────────────────────────────────────────

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[dashboard error boundary]", error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Something went wrong"
      message={
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred. Please try again."
      }
      reset={reset}
    />
  );
}
