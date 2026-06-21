import { redirect } from "next/navigation";

// The root URL "/" is not a real page — redirect everyone immediately.
// Logged-out users hit middleware before reaching here and get sent to /login.
// Logged-in users land here briefly and are pushed to /dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
