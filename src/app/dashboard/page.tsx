import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { DashboardStats } from "@/types";

// ─────────────────────────────────────────────────────────────
// Dashboard home — server component, fetches data directly from
// the DB (no API round-trip needed in App Router).
// ─────────────────────────────────────────────────────────────

export const metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const [invoices, paidAgg, outstandingAgg] = await Promise.all([
    db.invoice.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.invoice.aggregate({
      where: { userId, status: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    db.invoice.aggregate({
      where: { userId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
  ]);

  const overdueCount = await db.invoice.count({
    where: { userId, status: "OVERDUE" },
  });

  const pendingCount = await db.invoice.count({
    where: { userId, status: { in: ["DRAFT", "SENT"] } },
  });

  const totalInvoices = await db.invoice.count({ where: { userId } });

  const stats: DashboardStats = {
    totalRevenue: Number(paidAgg._sum.total ?? 0),
    outstanding: Number(outstandingAgg._sum.total ?? 0),
    paidCount: paidAgg._count,
    pendingCount,
    overdueCount,
    totalInvoices,
  };

  return { invoices, stats };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { invoices, stats } = await getDashboardData(session.user.id);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      sub: `${stats.paidCount} paid invoice${stats.paidCount !== 1 ? "s" : ""}`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
        </svg>
      ),
    },
    {
      label: "Outstanding",
      value: formatCurrency(stats.outstanding),
      sub: `${stats.overdueCount} overdue`,
      color: "text-orange-600",
      bg: "bg-orange-50",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: stats.pendingCount,
      sub: "drafts & sent",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
        </svg>
      ),
    },
    {
      label: "Total Invoices",
      value: stats.totalInvoices,
      sub: "all time",
      color: "text-brand-600",
      bg: "bg-brand-50",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2 ${card.bg}`}>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Recent Invoices
          </h2>
          <Link
            href="/dashboard/invoices"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-500">No invoices yet</p>
            <p className="text-xs text-slate-400">Create your first invoice to get started</p>
            <Link
              href="/dashboard/invoices/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Invoice</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Client</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400 sm:table-cell">Due</th>
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
                    <td className="px-5 py-3.5 text-slate-600">
                      {inv.client.name}
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-400 sm:table-cell">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                      {formatCurrency(inv.total.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
