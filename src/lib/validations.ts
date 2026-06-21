import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Zod schemas — shared between server (API routes) and client
// (react-hook-form). One definition, validated in both places.
// ─────────────────────────────────────────────────────────────

export const InvoiceStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);
export type InvoiceStatusType = z.infer<typeof InvoiceStatusEnum>;

// ── Auth ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── Clients ──────────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(120),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});
export type ClientInput = z.infer<typeof clientSchema>;

// ── Invoice line items ───────────────────────────────────────

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(300),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
});
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// ── Create invoice ───────────────────────────────────────────

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client").optional(),
  // Allow creating a brand-new client inline.
  newClient: clientSchema.optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(1000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
})
  .refine((data) => data.clientId || data.newClient, {
    message: "Either select an existing client or provide a new one",
    path: ["clientId"],
  });
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ── Update invoice (status / notes / due date) ───────────────

export const updateInvoiceSchema = z.object({
  status: InvoiceStatusEnum.optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ── AI generation request ────────────────────────────────────

export const aiGenerateSchema = z.object({
  description: z
    .string()
    .min(10, "Describe your project in at least 10 characters")
    .max(2000, "Description is too long"),
});
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;

// The structured shape Claude is asked to return.
export const aiResultSchema = z.object({
  items: z.array(invoiceItemSchema).min(1),
  suggestedNotes: z.string().default(""),
});
export type AiResult = z.infer<typeof aiResultSchema>;
