import { PrismaClient, InvoiceStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper: build an invoice's line items + computed money totals.
function buildInvoice(
  items: { description: string; quantity: number; unitPrice: number }[],
  taxRatePct: number,
) {
  const lineItems = items.map((it, idx) => ({
    description: it.description,
    quantity: new Prisma.Decimal(it.quantity),
    unitPrice: new Prisma.Decimal(it.unitPrice),
    amount: new Prisma.Decimal(it.quantity * it.unitPrice),
    position: idx,
  }));

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxAmount = Math.round(subtotal * (taxRatePct / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    lineItems,
    subtotal: new Prisma.Decimal(subtotal),
    taxRate: new Prisma.Decimal(taxRatePct),
    taxAmount: new Prisma.Decimal(taxAmount),
    total: new Prisma.Decimal(total),
  };
}

async function main() {
  console.log("🌱  Seeding database...");

  // ── Demo user ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@invoiceai.com" },
    update: {},
    create: {
      email: "demo@invoiceai.com",
      name: "Demo User",
      passwordHash,
    },
  });

  // Start clean so re-seeding is idempotent.
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  // ── Clients ────────────────────────────────────────────────
  const acme = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Jane Cooper",
      email: "jane@acme.com",
      company: "Acme Corporation",
      address: "123 Market St, San Francisco, CA 94103",
      phone: "+1 (415) 555-0101",
    },
  });

  const globex = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Tom Reed",
      email: "tom@globex.io",
      company: "Globex Inc.",
      address: "500 Tech Park, Austin, TX 78701",
      phone: "+1 (512) 555-0188",
    },
  });

  // ── Invoices in every status ───────────────────────────────
  const seeds: {
    client: string;
    number: string;
    status: InvoiceStatus;
    items: { description: string; quantity: number; unitPrice: number }[];
    taxRate: number;
    notes?: string;
    daysOffset: number; // due date relative to today
    paid?: boolean;
  }[] = [
    {
      client: acme.id,
      number: "INV-2026-0001",
      status: "PAID",
      items: [
        { description: "Landing page design (Figma)", quantity: 1, unitPrice: 1200 },
        { description: "Responsive implementation (Next.js)", quantity: 1, unitPrice: 2400 },
      ],
      taxRate: 8.5,
      notes: "Thanks for your business!",
      daysOffset: -10,
      paid: true,
    },
    {
      client: globex.id,
      number: "INV-2026-0002",
      status: "SENT",
      items: [
        { description: "API integration (Stripe + webhooks)", quantity: 1, unitPrice: 1800 },
        { description: "Consulting hours", quantity: 6, unitPrice: 150 },
      ],
      taxRate: 0,
      notes: "Net 30 — payment due within 30 days.",
      daysOffset: 20,
    },
    {
      client: acme.id,
      number: "INV-2026-0003",
      status: "DRAFT",
      items: [{ description: "Monthly retainer — June", quantity: 1, unitPrice: 3000 }],
      taxRate: 8.5,
      daysOffset: 30,
    },
    {
      client: globex.id,
      number: "INV-2026-0004",
      status: "OVERDUE",
      items: [
        { description: "Database migration & optimization", quantity: 1, unitPrice: 2200 },
      ],
      taxRate: 0,
      notes: "Reminder: this invoice is past due.",
      daysOffset: -5,
    },
    {
      client: acme.id,
      number: "INV-2026-0005",
      status: "CANCELLED",
      items: [{ description: "Scoping workshop (cancelled)", quantity: 1, unitPrice: 500 }],
      taxRate: 0,
      daysOffset: 14,
    },
  ];

  for (const s of seeds) {
    const { lineItems, subtotal, taxRate, taxAmount, total } = buildInvoice(
      s.items,
      s.taxRate,
    );
    const due = new Date();
    due.setDate(due.getDate() + s.daysOffset);

    await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: s.client,
        invoiceNumber: s.number,
        status: s.status,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: s.notes,
        dueDate: due,
        paidAt: s.paid ? new Date() : null,
        items: { create: lineItems },
      },
    });
  }

  console.log("✅  Seed complete.");
  console.log("    Login:  demo@invoiceai.com  /  password123");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
