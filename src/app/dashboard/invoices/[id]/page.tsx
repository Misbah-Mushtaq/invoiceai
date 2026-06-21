import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { DeleteInvoiceButton } from "@/components/invoices/delete-invoice-button";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Invoice ${params.id.slice(0, 8)}` };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invoice = await db.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { client: true, items: { orderBy: { position: "asc" } } },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Issued {formatDate(invoice.issueDate)}
            {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
            {invoice.paidAt && ` · Paid ${formatDate(invoice.paidAt)}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <PdfDownloadButton invoice={{
            ...invoice,
            subtotal: invoice.subtotal.toString(),
            taxRate: invoice.taxRate.toString(),
            taxAmount: invoice.taxAmount.toString(),
            total: invoice.total.toString(),
            issueDate: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate?.toISOString() ?? null,
            items: invoice.items.map((item) => ({
              ...item,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              amount: item.amount.toString(),
            })),
          }} />
          <InvoiceActions
            invoiceId={invoice.id}
            currentStatus={invoice.status}
          />
          <DeleteInvoiceButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            status={invoice.status}
          />
        </div>
      </div>

      {/* Invoice card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Bill to / from */}
        <div className="grid gap-6 border-b border-slate-100 p-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Bill To
            </p>
            <p className="font-semibold text-slate-800">{invoice.client.name}</p>
            {invoice.client.company && (
              <p className="text-sm text-slate-500">{invoice.client.company}</p>
            )}
            {invoice.client.email && (
              <p className="text-sm text-slate-500">{invoice.client.email}</p>
            )}
            {invoice.client.address && (
              <p className="mt-1 text-sm text-slate-400 whitespace-pre-line">
                {invoice.client.address}
              </p>
            )}
          </div>

          <div className="space-y-3 sm:text-right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Invoice #
              </p>
              <p className="font-medium text-slate-700">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Issue Date
              </p>
              <p className="font-medium text-slate-700">
                {formatDate(invoice.issueDate)}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Due Date
                </p>
                <p
                  className={`font-medium ${invoice.status === "OVERDUE" ? "text-red-600" : "text-slate-700"}`}
                >
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3.5 text-slate-700">
                    {item.description}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-500">
                    {Number(item.quantity)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-500">
                    {formatCurrency(item.unitPrice.toString())}
                  </td>
                  <td className="px-6 py-3.5 text-right font-medium text-slate-700">
                    {formatCurrency(item.amount.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end border-t border-slate-100 p-6">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(invoice.subtotal.toString())}</dd>
            </div>
            {Number(invoice.taxRate) > 0 && (
              <div className="flex justify-between text-slate-500">
                <dt>Tax ({Number(invoice.taxRate)}%)</dt>
                <dd>{formatCurrency(invoice.taxAmount.toString())}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatCurrency(invoice.total.toString())}</dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-slate-100 px-6 py-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes
            </p>
            <p className="whitespace-pre-line text-sm text-slate-600">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
