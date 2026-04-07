"use client";

import { useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Compass, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompassMessage from "./CompassMessage";
import CompassSuggestionChips from "./CompassSuggestionChips";

export default function CompassChat() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/compass/chat" }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({ transport });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSuggestion(text: string) {
    sendMessage({ text });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = (formData.get("message") as string)?.trim();
    if (!text || isLoading) return;

    sendMessage({ text });

    // Clear the input
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-parchment px-4 py-3 sm:px-6">
        <div className="flex size-9 items-center justify-center rounded-full bg-bronze/10">
          <Compass className="size-5 text-bronze" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-forest-deep">
            Compass
          </h2>
          <p className="text-xs text-text-secondary">
            Your AI trip planner
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-bronze/10 mb-4">
              <Compass className="size-8 text-bronze" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-forest-deep mb-2">
              Where are we heading?
            </h3>
            <p className="max-w-md text-sm text-text-secondary mb-6">
              I&apos;m Compass, your AI trip planner. Ask me anything — find
              private water, plan a trip, check conditions, or get gear
              recommendations.
            </p>
            <CompassSuggestionChips onSelect={handleSuggestion} />
          </div>
        ) : (
          messages.map((message) => (
            <CompassMessage key={message.id} message={message} />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && !messages.some((m) => m.role === "assistant" && m.parts.some((p) => p.type === "text" && p.state === "streaming")) && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bronze/10 text-bronze">
              <Compass className="size-4" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-parchment bg-white px-4 py-3">
              <Loader2 className="size-4 animate-spin text-bronze" />
              <span className="text-sm text-text-secondary">
                Thinking...
              </span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-xs text-red-600">
                {error.message || "Please try again."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-parchment bg-parchment-light/30 px-4 py-3 sm:px-6">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              name="message"
              placeholder="Ask about fishing spots, trip planning, conditions..."
              rows={1}
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-lg border border-stone-light bg-white px-4 py-2.5 pr-4 text-sm text-text-primary placeholder:text-text-light focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 disabled:opacity-50 font-body"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading}
            className="shrink-0 bg-forest text-white hover:bg-forest-deep disabled:opacity-40"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-text-light">
          Compass may provide general fishing advice. Always verify availability and conditions.
        </p>
      </div>
    </div>
  );
}
