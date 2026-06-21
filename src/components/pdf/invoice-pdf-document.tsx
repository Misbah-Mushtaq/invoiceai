// No "use client" — this is imported only inside the PDFDownloadLink on the
// client. The @react-pdf/renderer components are NOT HTML: they use their own
// Yoga-based layout engine (flexbox-like) and render to a PDF canvas.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ──────��──────────────────────────────────────────────────────
// Types — serialised versions of Prisma models.
// Decimal fields arrive as strings after the Next.js boundary.
// ──────────────────────────────────────────���──────────────────

export interface PdfInvoiceItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
}

export interface PdfClient {
  name: string;
  company: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
}

export interface PdfInvoice {
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date | null;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  total: string | number;
  notes: string | null;
  client: PdfClient;
  items: PdfInvoiceItem[];
}

// ─────────���───────────────────────────���───────────────────────
// Helpers
// ───────────────────────────────────────��─────────────────────

function fmtCurrency(value: string | number): string {
  const n = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(n) ? n : 0);
}

function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

// ──────────────────────────────────────────────���──────────────
// Styles — @react-pdf uses a subset of CSS properties.
// All sizes are in points (1pt ≈ 1/72 inch).
// ────────────────��────────────────────────────���───────────────

const BRAND = "#4f46e5";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";
const MUTED = "#94a3b8";
const DARK = "#0f172a";
const BODY = "#334155";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BODY,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brandMark: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  invoiceLabel: {
    fontSize: 10,
    color: MUTED,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: LIGHT_BG,
    fontSize: 9,
    color: BRAND,
    fontFamily: "Helvetica-Bold",
  },

  // Bill-to / dates grid
  metaRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 24,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },
  metaSub: {
    fontSize: 9,
    color: BODY,
    marginTop: 1,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 16,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_BG,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDesc: { flex: 4, paddingRight: 8 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  headerCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cell: { fontSize: 10, color: BODY },
  cellBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },

  // Totals
  totalsSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 10, color: BODY },
  totalsValue: { fontSize: 10, color: BODY },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 4,
  },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: BRAND },

  // Notes
  notesSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  notesText: { fontSize: 9, color: BODY, lineHeight: 1.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
  },
});

// ──────────────────────────────────────���──────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface InvoicePdfDocumentProps {
  invoice: PdfInvoice;
}

export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  const { client, items } = invoice;
  const taxRate = Number(invoice.taxRate);

  return (
    <Document
      title={invoice.invoiceNumber}
      author="InvoiceAI"
      subject={`Invoice for ${client.name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ─��────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandMark}>InvoiceAI</Text>
            <Text style={styles.invoiceLabel}>Tax Invoice</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{invoice.status}</Text>
          </View>
        </View>

        {/* ── Bill to / dates ──��───────────────────────── */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaValue}>{client.name}</Text>
            {client.company && (
              <Text style={styles.metaSub}>{client.company}</Text>
            )}
            {client.email && (
              <Text style={styles.metaSub}>{client.email}</Text>
            )}
            {client.address && (
              <Text style={styles.metaSub}>{client.address}</Text>
            )}
          </View>

          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
          </View>

          {invoice.dueDate && (
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Line items table ─────────────────────────── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colDesc]}>Description</Text>
          <Text style={[styles.headerCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerCell, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.cell, styles.colQty]}>
              {Number(item.quantity)}
            </Text>
            <Text style={[styles.cell, styles.colPrice]}>
              {fmtCurrency(item.unitPrice)}
            </Text>
            <Text style={[styles.cellBold, styles.colAmount]}>
              {fmtCurrency(item.amount)}
            </Text>
          </View>
        ))}

        {/* ── Totals ─────────────���─────────────────────── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {fmtCurrency(invoice.subtotal)}
              </Text>
            </View>
            {taxRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {fmtCurrency(invoice.taxAmount)}
                </Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{fmtCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ───��───────────────���───────────────── */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────��─────────────────────── */}
        <Text style={styles.footer} fixed>
          Generated by InvoiceAI · {invoice.invoiceNumber}
        </Text>
      </Page>
    </Document>
  );
}
