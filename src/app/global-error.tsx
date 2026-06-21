"use client";

import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// global-error.tsx — last-resort error boundary.
// Catches crashes in the root layout itself (e.g. SessionProvider
// blowing up). Must render its own <html> and <body> because the
// root layout is not available when this fires.
// ─────────────────────────────────────────────────────────────

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
            Application Error
          </h1>
          <p style={{ color: "#64748b", maxWidth: 400, fontSize: "0.875rem" }}>
            A critical error occurred. Please refresh the page or try again.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre
              style={{
                background: "#1e293b",
                color: "#f1f5f9",
                padding: "1rem",
                borderRadius: 8,
                fontSize: "0.75rem",
                maxWidth: 560,
                overflow: "auto",
                textAlign: "left",
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
