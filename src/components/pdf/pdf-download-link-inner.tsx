"use client";

// This file is only ever imported via dynamic() with ssr:false, so it is
// safe to import @react-pdf/renderer here. It will never touch the server.
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePdfDocument, type PdfInvoice } from "./invoice-pdf-document";

interface Props {
  invoice: PdfInvoice;
}

export function PdfDownloadLinkInner({ invoice }: Props) {
  const filename = `${invoice.invoiceNumber}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePdfDocument invoice={invoice} />}
      fileName={filename}
    >
      {({ loading, error }) => (
        <button
          disabled={loading}
          title={error ? "PDF generation failed" : "Download PDF"}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
              Preparing PDF…
            </>
          ) : error ? (
            <>
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              PDF failed
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
