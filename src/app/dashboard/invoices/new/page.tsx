import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewInvoiceForm } from "@/components/invoices/new-invoice-form";

// ─────────────────────────────────────────────────────────────
// New invoice page — server component that fetches the client
// list and passes it to the client-side form. Keeping the fetch
// here means the form mounts with data already available (no
// loading spinner inside the form itself).
// ─────────────────────────────────────────────────────────────

export const metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await db.client.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Fill in the details below or let AI generate your line items.
        </p>
      </div>
      <NewInvoiceForm clients={clients} />
    </div>
  );
}
