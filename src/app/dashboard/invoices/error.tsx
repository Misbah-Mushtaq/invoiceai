"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ui/error-display";

// Error boundary scoped to the /dashboard/invoices subtree.
// Catches failures in the invoice list, detail, and new-invoice pages
// without taking down the whole dashboard.
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InvoicesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[invoices error boundary]", error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Couldn't load invoices"
      message={
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong loading your invoices. Please try again."
      }
      reset={reset}
    />
  );
}
