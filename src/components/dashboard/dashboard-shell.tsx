"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";

// ─────────────────────────────────────────────────────────────
// DashboardShell — client component that manages mobile sidebar
// state. The layout server component stays clean; all the toggle
// logic lives here.
//
// Desktop (lg+): sidebar is always visible on the left.
// Mobile (<lg):  sidebar is hidden; a top bar shows a hamburger
//                button that slides in an overlay drawer.
// ─────────────────────────────────────────────────────────────

interface DashboardShellProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  userName,
  userEmail,
  userImage,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Desktop sidebar — hidden below lg ─────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
      </div>

      {/* ── Mobile drawer overlay ──────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative h-full w-72 shadow-2xl">
            <Sidebar
              userName={userName}
              userEmail={userEmail}
              userImage={userImage}
              onLinkClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main content column ────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar — hidden on lg+ */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">InvoiceAI</span>
            </div>
          </div>

          {/* Quick new-invoice shortcut */}
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </Link>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
