"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { InvoiceStatus } from "@/types";

// ─────────────────────────────────────────────────────────────
// InvoiceActions — status lifecycle dropdown.
//
// Shows only the transitions that make sense from the current
// status, matching the README's Draft → Sent → Paid lifecycle.
// ─────────────────────────────────────────────────────────────

const TRANSITIONS: Record<InvoiceStatus, { label: string; next: InvoiceStatus }[]> = {
  DRAFT: [
    { label: "Mark as Sent", next: "SENT" },
    { label: "Cancel invoice", next: "CANCELLED" },
  ],
  SENT: [
    { label: "Mark as Paid", next: "PAID" },
    { label: "Mark as Overdue", next: "OVERDUE" },
    { label: "Revert to Draft", next: "DRAFT" },
    { label: "Cancel invoice", next: "CANCELLED" },
  ],
  OVERDUE: [
    { label: "Mark as Paid", next: "PAID" },
    { label: "Revert to Sent", next: "SENT" },
    { label: "Cancel invoice", next: "CANCELLED" },
  ],
  PAID: [],
  CANCELLED: [{ label: "Reopen as Draft", next: "DRAFT" }],
};

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}

export function InvoiceActions({ invoiceId, currentStatus }: InvoiceActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<InvoiceStatus | null>(null);

  const transitions = TRANSITIONS[currentStatus];

  if (transitions.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">No further actions</span>
    );
  }

  async function changeStatus(next: InvoiceStatus) {
    setLoadingStatus(next);
    setIsOpen(false);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to update status");
        return;
      }

      toast.success(`Status updated to ${next.toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={loadingStatus !== null}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {loadingStatus ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        ) : (
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        )}
        {loadingStatus ? "Updating…" : "Update status"}
        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {transitions.map(({ label, next }) => (
              <button
                key={next}
                onClick={() => changeStatus(next)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
