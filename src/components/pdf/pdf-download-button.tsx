"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PdfInvoice } from "./invoice-pdf-document";

// ─────��───────────────────────────────��───────────────────────
// PDFDownloadButton — dynamically loads @react-pdf/renderer
// client-side only (ssr: false). The library renders PDFs in a
// Web Worker and is not compatible with the Node.js runtime.
//
// We lazy-import the heavy PDFDownloadLink so it never appears
// in the server bundle and the initial page load stays fast.
// ───────��────────────────────────────────��────────────────────

// We can't import PDFDownloadLink at the top level — it must stay
// out of the SSR bundle. Instead we render an inner component that
// is loaded lazily with ssr:false.
const PdfDownloadLinkInner = dynamic(
  () => import("./pdf-download-link-inner").then((m) => m.PdfDownloadLinkInner),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
      >
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
        Preparing PDF…
      </button>
    ),
  },
);

interface PdfDownloadButtonProps {
  invoice: PdfInvoice;
}

export function PdfDownloadButton({ invoice }: PdfDownloadButtonProps) {
  return <PdfDownloadLinkInner invoice={invoice} />;
}
