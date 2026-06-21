import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import "./globals.css";

// ─────────────────────────────────────────────────────────────
// Root layout — wraps every page.
//
// SessionProvider makes the auth session available to any client
// component via `useSession()` without extra fetch calls.
// Toaster (sonner) is mounted here once so any component can call
// toast.success() / toast.error() without prop-drilling.
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "InvoiceAI — AI-powered invoice management",
    template: "%s | InvoiceAI",
  },
  description:
    "Describe your work in plain English — Claude AI generates professional invoice line items instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
