"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

interface StaffNote {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
  author_name: string;
}

interface StaffNotesProps {
  clubId: string;
  entityType: "member" | "property" | "landowner";
  entityId: string;
  /** Start collapsed (default: true) */
  defaultCollapsed?: boolean;
}

export default function StaffNotes({
  clubId,
  entityType,
  entityId,
  defaultCollapsed = true,
}: StaffNotesProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        entity_type: entityType,
        entity_id: entityId,
      });
      const res = await fetch(`/api/clubs/${clubId}/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      } else {
        setError("Failed to load notes");
      }
    } catch {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [clubId, entityType, entityId]);

  // Fetch when first expanded
  useEffect(() => {
    if (!collapsed && !loaded) {
      fetchNotes();
    }
  }, [collapsed, loaded, fetchNotes]);

  const handleSubmit = async () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          body: trimmed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNote("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save note");
      }
    } catch {
      setError("Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-lg border border-stone-light/30 bg-white">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <StickyNote className="size-4 text-bronze" />
          Staff Notes
          {loaded && notes.length > 0 && (
            <span className="rounded-full bg-bronze/10 px-2 py-0.5 text-xs font-normal text-bronze">
              {notes.length}
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronDown className="size-4 text-text-light" />
        ) : (
          <ChevronUp className="size-4 text-text-light" />
        )}
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="border-t border-stone-light/20 px-4 pb-4 pt-3">
          {/* New note input */}
          <div className="mb-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note..."
              maxLength={5000}
              rows={2}
              className="w-full resize-none rounded-md border border-stone-light/40 bg-parchment-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light focus:border-bronze focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-text-light">
                {newNote.length > 0 && `${newNote.length}/5000`}
              </span>
              <Button
                size="sm"
                className="h-7 gap-1.5 bg-bronze text-xs text-white hover:bg-bronze/90"
                onClick={handleSubmit}
                disabled={submitting || !newNote.trim()}
              >
                {submitting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Send className="size-3" />
                )}
                Submit Note
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-bronze" />
            </div>
          )}

          {/* Notes list */}
          {!loading && notes.length === 0 && (
            <p className="py-4 text-center text-xs text-text-light">
              No notes yet. Add one above.
            </p>
          )}

          {!loading && notes.length > 0 && (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-stone-light/20 bg-parchment-light/20 px-3 py-2.5"
                >
                  <p className="whitespace-pre-wrap text-sm text-text-primary">
                    {note.body}
                  </p>
                  <p className="mt-1.5 text-xs text-text-light">
                    {note.author_name} &middot; {formatDate(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
