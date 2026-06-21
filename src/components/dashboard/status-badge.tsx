import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";

// ─────────────────────────────────────────────────────────────
// StatusBadge — coloured pill for invoice status.
// Covers every state in the InvoiceStatus enum.
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  PAID: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-orange-50 text-orange-600 ring-orange-200",
  },
};

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
