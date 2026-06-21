import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names intelligently. `clsx` handles conditional
 * classes; `twMerge` resolves conflicts (e.g. `px-2 px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number (or Prisma Decimal / string) as USD currency.
 * Prisma Decimals serialize as strings, so we coerce with Number().
 */
export function formatCurrency(
  value: number | string,
  currency = "USD",
): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Format a date as e.g. "Jun 22, 2026". Accepts Date | string | null.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Generate a human-friendly invoice number like "INV-2026-0001".
 * `sequence` is the next per-user invoice count.
 */
export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(4, "0");
  return `INV-${year}-${padded}`;
}

/**
 * Round a number to 2 decimal places, returned as a number.
 * Used when computing money on the server before persisting as Decimal.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Strip the JSON fence (```json ... ```) and any trailing bare `{...}` block
 * from Claude's streamed output so the "thinking" text shown to the user
 * doesn't contain raw JSON. Safe to call client-side — no Anthropic SDK dep.
 */
export function stripJsonBlock(fullText: string): string {
  return fullText
    .replace(/```(?:json)?\s*[\s\S]*?```/gi, "")
    .replace(/\{[\s\S]*\}\s*$/, "")
    .trim();
}
