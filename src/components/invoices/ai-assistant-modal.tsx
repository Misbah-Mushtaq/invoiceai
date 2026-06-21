"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { aiGenerateSchema, type AiGenerateInput } from "@/lib/validations";
import { stripJsonBlock } from "@/lib/utils";
import type { AiLineItem } from "@/types";

// ─────────────────────────────────────────────────────────────
// AiAssistantModal — the real-time streaming AI panel.
//
// Flow:
//   1. User types a plain-English project description and submits.
//   2. We POST to /api/ai/generate-invoice and read the SSE stream.
//   3. Each `t:` chunk is appended to the "thinking" display.
//   4. When the `d:` line arrives we parse the JSON, show a preview,
//      and enable the "Use these items" button.
//   5. Clicking the button calls onResult() to hydrate the form.
// ─────────────────────────────────────────────────────────────

interface AiAssistantModalProps {
  onClose: () => void;
  onResult: (items: AiLineItem[], suggestedNotes: string) => void;
}

type Phase = "idle" | "streaming" | "done" | "error";

export function AiAssistantModal({ onClose, onResult }: AiAssistantModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [thinkingText, setThinkingText] = useState("");
  const [resultItems, setResultItems] = useState<AiLineItem[]>([]);
  const [suggestedNotes, setSuggestedNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AiGenerateInput>({
    resolver: zodResolver(aiGenerateSchema),
  });

  // Auto-scroll the thinking panel as text streams in.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thinkingText]);

  async function onSubmit({ description }: AiGenerateInput) {
    setPhase("streaming");
    setThinkingText("");
    setResultItems([]);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "AI request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("t:")) {
            const chunk = line.slice(2);
            rawText += chunk;
            setThinkingText(stripJsonBlock(rawText));
          } else if (line.startsWith("d:")) {
            const payload = JSON.parse(line.slice(2));
            setResultItems(payload.items ?? []);
            setSuggestedNotes(payload.suggestedNotes ?? "");
            setPhase("done");
          } else if (line.startsWith("e:")) {
            throw new Error(line.slice(2));
          }
        }
      }

      if (phase !== "done") setPhase("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
      setPhase("error");
      toast.error(msg);
    }
  }

  function handleUseItems() {
    onResult(resultItems, suggestedNotes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
              <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">AI Invoice Assistant</h2>
              <p className="text-xs text-slate-400">Powered by Claude AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          {/* Prompt form — hide once streaming starts */}
          {phase === "idle" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Describe your project
                </label>
                <textarea
                  {...register("description")}
                  rows={5}
                  placeholder={`e.g. "Built a landing page for a SaaS startup — Figma design, responsive React implementation, 2 rounds of revisions. Also set up CI/CD on Vercel."`}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Generate invoice items
              </button>
            </form>
          )}

          {/* Streaming / thinking panel */}
          {(phase === "streaming" || phase === "done") && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                {phase === "streaming" ? (
                  <>
                    <span className="flex h-2 w-2 rounded-full bg-brand-500">
                      <span className="h-2 w-2 animate-ping rounded-full bg-brand-400 opacity-75" />
                    </span>
                    <span className="text-xs font-medium text-brand-600">Claude is thinking…</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-emerald-600">Done</span>
                  </>
                )}
              </div>
              <div
                ref={scrollRef}
                className="scrollbar-thin max-h-48 overflow-y-auto rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed"
              >
                {thinkingText || <span className="text-slate-400">Generating…</span>}
              </div>
            </div>
          )}

          {/* Result preview */}
          {phase === "done" && resultItems.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Generated Line Items
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-slate-700">{item.description}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {suggestedNotes && (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-medium">Suggested note:</span> {suggestedNotes}
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {phase === "done" ? "Discard" : "Cancel"}
          </button>
          {phase === "done" && resultItems.length > 0 && (
            <button
              onClick={handleUseItems}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Use these items
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
