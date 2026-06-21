import { handlers } from "@/lib/auth";

// NextAuth v5 exports GET and POST handlers directly.
// The [...nextauth] catch-all segment handles every auth route:
//   /api/auth/signin, /api/auth/callback/google, /api/auth/session, etc.
export const { GET, POST } = handlers;
