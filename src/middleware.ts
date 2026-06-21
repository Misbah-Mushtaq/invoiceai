import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// ─────────────────────────────────────────────────────────────
// Edge auth guard.
//
// We initialize NextAuth with ONLY the edge-safe config (no Prisma, no
// bcrypt) and export its middleware. The `authorized` callback in
// auth.config.ts decides — at the CDN edge, before any page renders —
// whether the request may proceed. This is the README's "protected routes
// enforced at the edge, before any page loads" promise.
// ─────────────────────────────────────────────────────────────

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except Next internals, static assets, and the
  // NextAuth API routes themselves.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
