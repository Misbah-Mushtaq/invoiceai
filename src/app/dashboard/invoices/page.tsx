import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { InvoiceStatus } from "@/types";

// ─────────────────────────────────────────────────────────────
// Invoice list — server component with status-filter tabs.
// The active filter is read from the ?status= search param so
// the URL is shareable and the back button works correctly.
// ─────────────────────────────────────────────────────────────

export const metadata = { title: "Invoices" };

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
];

interface InvoicesPageProps {
  searchParams: { status?: string };
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const statusFilter = searchParams.status as InvoiceStatus | undefined;

  const invoices = await db.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: { client: true, items: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            {statusFilter ? ` · ${statusFilter.toLowerCase()}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="hidden items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 lg:flex"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Status filter tabs — horizontally scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          const href =
            tab.value
              ? `/dashboard/invoices?status=${tab.value}`
              : "/dashboard/invoices";
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                isActive
                  ? "shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white"
                  : "shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-500">
            {statusFilter ? `No ${statusFilter.toLowerCase()} invoices` : "No invoices yet"}
          </p>
          {!statusFilter && (
            <Link
              href="/dashboard/invoices/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create your first invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Invoice #</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Client</th>
                <th className="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 md:table-cell">Issued</th>
                <th className="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 md:table-cell">Due</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="group transition hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-700">{inv.client.name}</div>
                    {inv.client.company && (
                      <div className="text-xs text-slate-400">{inv.client.company}</div>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-400 md:table-cell">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <span className={inv.status === "OVERDUE" ? "text-red-500" : "text-slate-400"}>
                      {formatDate(inv.dueDate)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                    {formatCurrency(inv.total.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
