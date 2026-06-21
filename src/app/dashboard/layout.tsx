import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

// ─────────────────────────────────────────────────────────────
// Dashboard layout — server component that:
//   1. Re-checks auth (belt-and-suspenders after middleware)
//   2. Passes user info to the sidebar
//   3. Renders the two-column shell every dashboard page shares
// ─────────────────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Fixed-width sidebar */}
      <Sidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
