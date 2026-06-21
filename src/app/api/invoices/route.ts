import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validations";
import { generateInvoiceNumber, round2 } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const invoices = await db.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as never } : {}),
    },
    include: { client: true, items: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { clientId, newClient, items, taxRate, notes, dueDate } = parsed.data;

    // ── Resolve client ─────────────────────────────────────
    let resolvedClientId = clientId;

    if (!resolvedClientId && newClient) {
      const created = await db.client.create({
        data: {
          userId: session.user.id,
          name: newClient.name,
          email: newClient.email || null,
          company: newClient.company || null,
          address: newClient.address || null,
          phone: newClient.phone || null,
        },
      });
      resolvedClientId = created.id;
    }

    if (!resolvedClientId) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 },
      );
    }

    // Verify the client belongs to this user.
    const client = await db.client.findFirst({
      where: { id: resolvedClientId, userId: session.user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // ── Compute money ──────────────────────────────────────
    const subtotal = round2(
      items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    );
    const taxAmount = round2(subtotal * ((taxRate ?? 0) / 100));
    const total = round2(subtotal + taxAmount);

    // ── Auto-increment invoice number ──────────────────────
    const count = await db.invoice.count({ where: { userId: session.user.id } });
    const invoiceNumber = generateInvoiceNumber(count + 1);

    // ── Create invoice + items in one transaction ──────────
    const invoice = await db.invoice.create({
      data: {
        userId: session.user.id,
        clientId: resolvedClientId,
        invoiceNumber,
        subtotal,
        taxRate: taxRate ?? 0,
        taxAmount,
        total,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((it, idx) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: round2(it.quantity * it.unitPrice),
            position: idx,
          })),
        },
      },
      include: { client: true, items: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("[invoices POST]", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
