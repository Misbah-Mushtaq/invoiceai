import type { Invoice, InvoiceItem, Client, User, InvoiceStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Re-export Prisma-generated enums and extend the types with
// the nested relations we use throughout the app.
// ─────────────────────────────────────────────────────────────

export type { InvoiceStatus };

/** Invoice with its client and line items pre-joined. */
export type InvoiceWithRelations = Invoice & {
  client: Client;
  items: InvoiceItem[];
};

/** Client with an optional nested invoices array. */
export type ClientWithInvoices = Client & {
  invoices?: Invoice[];
};

/** Shape returned by the dashboard stats query. */
export type DashboardStats = {
  totalRevenue: number;
  outstanding: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalInvoices: number;
};

/** A single AI-generated line item before it reaches the DB. */
export type AiLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

/** The full parsed result from the AI streaming endpoint. */
export type AiGeneratedInvoice = {
  items: AiLineItem[];
  suggestedNotes: string;
};

/** Extend NextAuth's built-in Session.user with our `id` field. */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
