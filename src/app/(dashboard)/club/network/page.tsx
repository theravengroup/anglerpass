"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Network, ArrowUpCircle } from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";
import AgreementCard from "@/components/clubs/AgreementCard";
import ClubSearchResult from "@/components/clubs/ClubSearchResult";
import type { Agreement } from "@/components/clubs/AgreementCard";
import type { SearchClub } from "@/components/clubs/ClubSearchResult";

interface ClubData {
  id: string;
  name: string;
  subscription_tier: string;
}

export default function NetworkPage() {
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Agreements
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchClub[]>([]);
  const [searching, setSearching] = useState(false);
  const [proposingClubId, setProposingClubId] = useState<string | null>(null);

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  const showFeedback = (msg: string, type: "success" | "error") => {
    setFeedbackMsg(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  async function fetchAgreements(clubId: string) {
    try {
      const res = await fetch(`/api/clubs/${clubId}/agreements`);
      if (res.ok) {
        const data = await res.json();
        setAgreements(data.agreements ?? []);
      }
    } catch {
      // Silent fail — agreements section will be empty
    }
  }

  async function init() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) {
        setError(true);
        return;
      }

      const data = await res.json();
      if (!data.owned?.length) {
        setError(true);
        return;
      }

      const owned = data.owned[0];
      setClub(owned);
      await fetchAgreements(owned.id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `/api/clubs/browse?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        // Filter out own club and clubs with existing active/pending agreements
        const existingPartnerIds = new Set(
          agreements
            .filter((a) => a.status === "active" || a.status === "pending")
            .map((a) => a.partnerClub.id)
        );
        const filtered = (data.clubs ?? []).filter(
          (c: SearchClub) => c.id !== club?.id && !existingPartnerIds.has(c.id)
        );
        setSearchResults(filtered);
      }
    } catch {
      showFeedback("Failed to search clubs", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handlePropose(partnerClubId: string) {
    if (!club) return;

    setProposingClubId(partnerClubId);
    try {
      const res = await fetch(`/api/clubs/${club.id}/agreements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_club_id: partnerClubId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error ?? "Failed to propose agreement", "error");
        return;
      }

      showFeedback("Partnership proposed successfully", "success");
      setSearchResults((prev) => prev.filter((c) => c.id !== partnerClubId));
      await fetchAgreements(club.id);
    } catch {
      showFeedback("An unexpected error occurred", "error");
    } finally {
      setProposingClubId(null);
    }
  }

  async function handleAccept(agreementId: string) {
    if (!club) return;

    setActionLoading(agreementId);
    try {
      const res = await fetch(
        `/api/clubs/${club.id}/agreements/${agreementId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error ?? "Failed to accept agreement", "error");
        return;
      }

      showFeedback("Agreement accepted", "success");
      await fetchAgreements(club.id);
    } catch {
      showFeedback("An unexpected error occurred", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke(agreementId: string) {
    if (!club) return;

    setActionLoading(agreementId);
    try {
      const res = await fetch(
        `/api/clubs/${club.id}/agreements/${agreementId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error ?? "Failed to revoke agreement", "error");
        return;
      }

      showFeedback("Agreement revoked", "success");
      await fetchAgreements(club.id);
    } catch {
      showFeedback("An unexpected error occurred", "error");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load club data." onRetry={init} />
      </div>
    );
  }

  // Starter tier upgrade prompt
  if (club.subscription_tier === "starter") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Cross-Club Network
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Partner with other clubs to share property access for your members.
          </p>
        </div>

        <Card className="border-bronze/20 bg-bronze/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpCircle className="size-5 text-bronze" />
              Upgrade Required
            </CardTitle>
            <CardDescription>
              Cross-club agreements are available on Standard and Pro tiers.
              Upgrade your subscription to partner with other clubs and expand
              your members&rsquo; access to private waters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-bronze text-white hover:bg-bronze/90">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAgreements = agreements.filter((a) => a.status === "active");
  const pendingAgreements = agreements.filter((a) => a.status === "pending");
  const revokedAgreements = agreements.filter((a) => a.status === "revoked");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Cross-Club Network
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Partner with other clubs to share property access. When an agreement is
          active, members from both clubs can book each other&rsquo;s properties.
        </p>
      </div>

      {/* Feedback message */}
      {feedbackMsg && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-lg px-4 py-3 text-sm ${
            feedbackType === "success"
              ? "bg-forest/10 text-forest"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Search for clubs */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4 text-river" />
            Find Clubs to Partner With
          </CardTitle>
          <CardDescription>
            Search for clubs by name and propose a cross-club partnership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Input
              placeholder="Search clubs by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Search
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((c) => (
                <ClubSearchResult
                  key={c.id}
                  club={c}
                  proposing={proposingClubId === c.id}
                  onPropose={handlePropose}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending agreements (incoming) */}
      {pendingAgreements.filter((a) => !a.isProposer).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-text-primary">
            Incoming Proposals
          </h3>
          {pendingAgreements
            .filter((a) => !a.isProposer)
            .map((a) => (
              <AgreementCard
                key={a.id}
                agreement={a}
                actionLoading={actionLoading}
                onAccept={handleAccept}
                onRevoke={handleRevoke}
              />
            ))}
        </div>
      )}

      {/* Pending agreements (outgoing) */}
      {pendingAgreements.filter((a) => a.isProposer).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-text-primary">
            Pending Proposals
          </h3>
          {pendingAgreements
            .filter((a) => a.isProposer)
            .map((a) => (
              <AgreementCard
                key={a.id}
                agreement={a}
                actionLoading={actionLoading}
                onAccept={handleAccept}
                onRevoke={handleRevoke}
              />
            ))}
        </div>
      )}

      {/* Active agreements */}
      <div className="space-y-3">
        <h3 className="text-base font-medium text-text-primary">
          Active Partnerships
        </h3>
        {activeAgreements.length === 0 ? (
          <Card className="border-stone-light/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-river/10">
                <Network className="size-5 text-river" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-text-primary">
                No active partnerships yet
              </h3>
              <p className="mt-1 max-w-sm text-center text-xs text-text-secondary">
                Search for clubs above and propose a partnership to expand your
                members&rsquo; access.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeAgreements.map((a) => (
            <AgreementCard
              key={a.id}
              agreement={a}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onRevoke={handleRevoke}
            />
          ))
        )}
      </div>

      {/* Revoked agreements */}
      {revokedAgreements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-text-light">
            Past Agreements
          </h3>
          {revokedAgreements.map((a) => (
            <AgreementCard
              key={a.id}
              agreement={a}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
}
