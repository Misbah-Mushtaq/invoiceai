import Anthropic from "@anthropic-ai/sdk";
import { aiResultSchema, type AiResult } from "@/lib/validations";

// ─────────────────────────────────────────────────────────────
// Anthropic client + helpers for the AI Invoice Assistant.
//
// The model is Claude Sonnet (claude-sonnet-4-6), per the README. We stream
// the response so the UI can show Claude "thinking" in real time, then parse
// the final JSON block into editable line items.
// ─────────────────────────────────────────────────────────────

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

/** Lazily construct the client so a missing key fails loudly at call time. */
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const SYSTEM_PROMPT = `You are an expert invoicing assistant for freelancers and small businesses.

Given a plain-English description of work performed, you produce professional invoice line items with clear descriptions and realistic market-rate pricing in USD.

Rules:
- Break the work into logical, billable line items.
- Each item needs: a concise professional "description", a numeric "quantity", and a numeric "unitPrice" (USD, no currency symbol).
- Use realistic freelance/agency rates. Prefer round, sensible numbers.
- Do NOT include tax — tax is applied separately by the app.
- Keep descriptions specific but brief (one line each).

Output protocol — follow EXACTLY:
1. First, write 1-3 short sentences of natural-language reasoning about how you are breaking down the work. This is shown to the user as "thinking".
2. Then output a single fenced JSON code block (\`\`\`json ... \`\`\`) containing an object of the form:
   { "items": [ { "description": string, "quantity": number, "unitPrice": number } ], "suggestedNotes": string }
   where "suggestedNotes" is a short, friendly payment note for the invoice.
Output nothing after the closing fence.`;

/**
 * Extract the JSON object embedded in Claude's response (inside a ```json
 * fence, or as a bare {...} block) and validate it against our schema.
 * Returns null if no valid structured data can be parsed yet.
 */
export function parseAiResult(fullText: string): AiResult | null {
  const fenced = fullText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced
    ? fenced[1]
    : (() => {
        const start = fullText.indexOf("{");
        const end = fullText.lastIndexOf("}");
        return start !== -1 && end > start
          ? fullText.slice(start, end + 1)
          : null;
      })();

  if (!candidate) return null;

  try {
    const parsed = JSON.parse(candidate);
    const result = aiResultSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Strip the JSON fence out of the streamed text so the "thinking" we display
 * to the user doesn't include the raw JSON payload.
 */
export function stripJsonBlock(fullText: string): string {
  return fullText
    .replace(/```(?:json)?\s*[\s\S]*?```/gi, "")
    .replace(/\{[\s\S]*\}\s*$/, "")
    .trim();
}
