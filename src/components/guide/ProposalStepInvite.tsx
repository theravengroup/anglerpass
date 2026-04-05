"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserPlus, X } from "lucide-react";

export interface InvitedAngler {
  id: string;
  display_name: string;
  email: string;
}

export function ProposalStepInvite({
  invitees,
  onAdd,
  onRemove,
}: {
  invitees: InvitedAngler[];
  onAdd: (angler: InvitedAngler) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InvitedAngler[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/proposals/search-anglers?query=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.anglers ?? []);
        }
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const inviteeIds = new Set(invitees.map((a) => a.id));

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Search for anglers to invite to this trip. At least one angler is
        required.
      </p>

      {/* Search input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="border-stone-light/20 pl-9"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-text-light" />
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="max-w-md space-y-1 rounded-lg border border-stone-light/20 p-2">
          {results
            .filter((r) => !inviteeIds.has(r.id))
            .map((angler) => (
              <button
                key={angler.id}
                type="button"
                onClick={() => {
                  onAdd(angler);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-charcoal/5"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {angler.display_name}
                  </p>
                  <p className="text-xs text-text-light">{angler.email}</p>
                </div>
                <UserPlus className="size-4 text-charcoal" />
              </button>
            ))}
          {results.filter((r) => !inviteeIds.has(r.id)).length === 0 && (
            <p className="px-3 py-2 text-xs text-text-light">
              All results already invited.
            </p>
          )}
        </div>
      )}

      {query.trim().length >= 2 &&
        !searching &&
        results.length === 0 && (
          <p className="text-xs text-text-light">
            No anglers found matching &ldquo;{query}&rdquo;.
          </p>
        )}

      {/* Invited anglers list */}
      {invitees.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-secondary">
            Invited ({invitees.length})
          </h4>
          <div className="space-y-1">
            {invitees.map((angler) => (
              <div
                key={angler.id}
                className="flex items-center justify-between rounded-lg border border-stone-light/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {angler.display_name}
                  </p>
                  <p className="text-xs text-text-light">{angler.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(angler.id)}
                  aria-label={`Remove ${angler.display_name}`}
                  className="size-8 p-0 text-text-light hover:text-red-500"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
