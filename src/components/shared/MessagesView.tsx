"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Send } from "lucide-react";

interface Thread {
  id: string;
  other_participant: { id: string; display_name: string };
  last_message: {
    body: string;
    is_own: boolean;
    created_at: string;
  } | null;
  unread_count: number;
  last_message_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface MessagesViewProps {
  accentColor?: string;
  subtitle?: string;
  emptyDescription?: string;
}

export function MessagesView({
  accentColor = "forest",
  subtitle = "Communicate with landowners, club managers, and independent guides.",
  emptyDescription = "Your conversations will appear here.",
}: MessagesViewProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  async function loadThreads() {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  const loadMessages = async (threadId: string) => {
    setSelectedThread(threadId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedThread}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        loadThreads();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const accentClasses = {
    forest: {
      selected: "bg-forest/10",
      badge: "bg-forest",
      ownBubble: "bg-forest text-white",
      ownTime: "text-white/60",
      sendBtn: "bg-forest text-white hover:bg-forest/90",
      spinner: "text-forest",
    },
    charcoal: {
      selected: "bg-charcoal/10",
      badge: "bg-charcoal",
      ownBubble: "bg-charcoal text-white",
      ownTime: "text-white/60",
      sendBtn: "bg-charcoal text-white hover:bg-charcoal/90",
      spinner: "text-charcoal",
    },
    river: {
      selected: "bg-river/10",
      badge: "bg-river",
      ownBubble: "bg-river text-white",
      ownTime: "text-white/60",
      sendBtn: "bg-river text-white hover:bg-river/90",
      spinner: "text-river",
    },
    bronze: {
      selected: "bg-bronze/10",
      badge: "bg-bronze",
      ownBubble: "bg-bronze text-white",
      ownTime: "text-white/60",
      sendBtn: "bg-bronze text-white hover:bg-bronze/90",
      spinner: "text-bronze",
    },
  } as const;

  const colors = accentClasses[accentColor as keyof typeof accentClasses] ?? accentClasses.forest;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className={`size-6 animate-spin ${colors.spinner}`} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Messages
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>

      {threads.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="size-8 text-text-light" />
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No messages yet
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {emptyDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* Thread list */}
          <div className="space-y-1 lg:max-h-[600px] lg:overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => loadMessages(thread.id)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selectedThread === thread.id
                    ? colors.selected
                    : "hover:bg-offwhite"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {thread.other_participant.display_name}
                  </span>
                  {thread.unread_count > 0 && (
                    <span
                      className={`flex size-5 items-center justify-center rounded-full text-[10px] text-white ${colors.badge}`}
                    >
                      {thread.unread_count}
                    </span>
                  )}
                </div>
                {thread.last_message && (
                  <p className="mt-0.5 truncate text-xs text-text-light">
                    {thread.last_message.is_own ? "You: " : ""}
                    {thread.last_message.body}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Message area */}
          <Card className="border-stone-light/20">
            {selectedThread ? (
              <CardContent className="flex h-[500px] flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-5 animate-spin text-text-light" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const thread = threads.find(
                          (t) => t.id === selectedThread
                        );
                        const isOwn =
                          msg.sender_id !== thread?.other_participant.id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                                isOwn
                                  ? colors.ownBubble
                                  : "bg-offwhite text-text-primary"
                              }`}
                            >
                              {msg.body}
                              <p
                                className={`mt-1 text-[10px] ${
                                  isOwn ? colors.ownTime : "text-text-light"
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString(
                                  "en-US",
                                  { hour: "numeric", minute: "2-digit" }
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Compose */}
                <div className="border-t border-stone-light/15 p-3">
                  <div className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className={colors.sendBtn}
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex h-[500px] items-center justify-center">
                <p className="text-sm text-text-light">
                  Select a conversation to view messages
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
