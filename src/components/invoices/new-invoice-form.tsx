"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations";
import { formatCurrency, round2 } from "@/lib/utils";
import { AiAssistantModal } from "@/components/invoices/ai-assistant-modal";
import type { AiLineItem } from "@/types";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
}

interface NewInvoiceFormProps {
  clients: Client[];
}

export function NewInvoiceForm({ clients }: NewInvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [useNewClient, setUseNewClient] = useState(clients.length === 0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      taxRate: 0,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedTaxRate = watch("taxRate") ?? 0;

  // Live totals — computed from form state so the user sees them update instantly.
  const subtotal = round2(
    (watchedItems ?? []).reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0,
    ),
  );
  const taxAmount = round2(subtotal * (Number(watchedTaxRate) / 100));
  const total = round2(subtotal + taxAmount);

  // Called by the AI modal when Claude finishes generating.
  function handleAiResult(items: AiLineItem[], suggestedNotes: string) {
    replace(items);
    if (suggestedNotes) setValue("notes", suggestedNotes);
    setShowAiModal(false);
    toast.success("AI-generated line items applied!");
  }

  async function onSubmit(data: CreateInvoiceInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to create invoice");
        return;
      }

      toast.success(`Invoice ${json.invoice.invoiceNumber} created!`);
      router.push(`/dashboard/invoices/${json.invoice.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Client ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Client</h2>
            {clients.length > 0 && (
              <button
                type="button"
                onClick={() => setUseNewClient((v) => !v)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {useNewClient ? "Select existing client" : "+ New client"}
              </button>
            )}
          </div>

          {useNewClient ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("newClient.name")}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {errors.newClient?.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.newClient.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  {...register("newClient.email")}
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
                <input
                  {...register("newClient.company")}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <input
                  {...register("newClient.address")}
                  placeholder="123 Main St, City, State"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          ) : (
            <div>
              <select
                {...register("clientId")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-xs text-red-500">{errors.clientId.message}</p>
              )}
            </div>
          )}
        </section>

        {/* ── Line items ──────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Line Items</h2>
            {/* AI assistant trigger */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Assistant
            </button>
          </div>

          {/* Column headers — hidden on mobile, visible sm+ */}
          <div className="mb-2 hidden grid-cols-12 gap-3 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-3 text-right">Unit Price</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                {/* Description: full width on mobile, 6/12 on sm+ */}
                <div className="col-span-12 sm:col-span-6">
                  <input
                    {...register(`items.${idx}.description`)}
                    placeholder="Service or product description"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  {errors.items?.[idx]?.description && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.items[idx]?.description?.message}
                    </p>
                  )}
                </div>
                {/* Qty: 5/12 on mobile, 2/12 on sm+ */}
                <div className="col-span-5 sm:col-span-2">
                  <input
                    {...register(`items.${idx}.quantity`)}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                {/* Unit price: 6/12 on mobile, 3/12 on sm+ */}
                <div className="col-span-6 sm:col-span-3">
                  <input
                    {...register(`items.${idx}.unitPrice`)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                {/* Remove: 1/12 always */}
                <div className="col-span-1 flex justify-center pt-2">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-slate-300 transition hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add line item
          </button>

          {errors.items?.root && (
            <p className="mt-2 text-xs text-red-500">{errors.items.root.message}</p>
          )}
        </section>

        {/* ── Details ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tax Rate (%)
              </label>
              <input
                {...register("taxRate")}
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Due Date
              </label>
              <input
                {...register("dueDate")}
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Payment terms, thank-you note, bank details…"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </section>

        {/* ── Totals + submit ──────────────────────────────── */}
        <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Totals */}
          <dl className="w-full max-w-xs space-y-1.5 text-sm sm:order-2">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            {Number(watchedTaxRate) > 0 && (
              <div className="flex justify-between text-slate-500">
                <dt>Tax ({watchedTaxRate}%)</dt>
                <dd>{formatCurrency(taxAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isSubmitting ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </form>

      {/* AI modal — rendered outside the form so it sits above everything */}
      {showAiModal && (
        <AiAssistantModal
          onClose={() => setShowAiModal(false)}
          onResult={handleAiResult}
        />
      )}
    </>
  );
}
