import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateInvoiceSchema } from "@/lib/validations";

type Params = { params: { id: string } };

// ── GET /api/invoices/:id ──────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await db.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { client: true, items: { orderBy: { position: "asc" } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

// ── PUT /api/invoices/:id ──────────────────────────────────────

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const existing = await db.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { status, notes, dueDate } = parsed.data;

    const updated = await db.invoice.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        // Stamp paidAt when transitioning to PAID.
        ...(status === "PAID" && !existing.paidAt && { paidAt: new Date() }),
        // Clear paidAt if un-marking as paid.
        ...(status && status !== "PAID" && existing.paidAt && { paidAt: null }),
      },
      include: { client: true, items: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error("[invoices PUT]", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/invoices/:id ───────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // README spec: deleting PAID invoices is not allowed.
  if (existing.status === "PAID") {
    return NextResponse.json(
      { error: "Paid invoices cannot be deleted" },
      { status: 403 },
    );
  }

  await db.invoice.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
