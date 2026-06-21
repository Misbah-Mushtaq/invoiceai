import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAnthropic, MODEL, SYSTEM_PROMPT, parseAiResult } from "@/lib/anthropic";
import { aiGenerateSchema } from "@/lib/validations";

// ─────────────────────────────────────────────────────────────
// POST /api/ai/generate-invoice
//
// Streams Claude's response as newline-delimited chunks.
// Protocol (from the README):
//   t:<text>\n   — thinking text (display to user)
//   d:<json>\n   — final structured data (parse as JSON)
//   e:<message>\n — error
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = aiGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { description } = parsed.data;
    const anthropic = getAnthropic();

    // Create a ReadableStream that pipes Claude's output to the client.
    const stream = new ReadableStream({
      async start(controller) {
        const encode = (chunk: string) =>
          new TextEncoder().encode(chunk);

        try {
          let fullText = "";

          const response = await anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Generate invoice line items for the following project:\n\n${description}`,
              },
            ],
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullText += event.delta.text;
              // Stream each text chunk to the client as a "thinking" line.
              controller.enqueue(encode(`t:${event.delta.text}\n`));
            }
          }

          // After streaming finishes, try to extract structured data.
          const result = parseAiResult(fullText);
          if (result) {
            controller.enqueue(encode(`d:${JSON.stringify(result)}\n`));
          } else {
            controller.enqueue(
              encode(`e:Could not parse AI response. Please try again.\n`),
            );
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "AI generation failed";
          controller.enqueue(encode(`e:${message}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Disable buffering on Vercel / nginx so chunks arrive immediately.
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[ai/generate-invoice]", error);
    return NextResponse.json(
      { error: "Failed to start AI generation" },
      { status: 500 },
    );
  }
}
