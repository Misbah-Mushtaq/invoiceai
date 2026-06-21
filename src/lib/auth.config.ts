import type { NextAuthConfig } from "next-auth";

// ─────────────────────────────────────────────────────────────
// EDGE-SAFE auth config.
//
// This file must NOT import Prisma, bcrypt, or any Node-only module, because
// it runs inside Edge middleware (a restricted V8 runtime). It contains only
// the pieces the middleware needs: the providers list shape, pages, and the
// `authorized` callback that decides who can see protected routes.
//
// The full config (src/lib/auth.ts) spreads this and adds the database
// adapter + the Credentials provider's heavy `authorize` logic.
// ─────────────────────────────────────────────────────────────

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Providers added in the full config. Kept empty here so the edge bundle
  // stays tiny; middleware only needs the callbacks below.
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    // Runs in middleware on every protected request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        // Block unauthenticated access — NextAuth redirects to signIn page.
        return isLoggedIn;
      }

      // Logged-in users hitting /login or /register go to the dashboard.
      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    // Persist the user id onto the JWT, then expose it on the session.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
