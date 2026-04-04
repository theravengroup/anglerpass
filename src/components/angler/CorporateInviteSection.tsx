"use client";

import { useEffect, useState } from "react";
import { CorporateInviteForm } from "./CorporateInviteForm";
import { CorporateInvitationsTable } from "./CorporateInvitationsTable";
import {
  isValidEmail,
  parseEmailInput,
  type CorporateInviteSectionProps,
  type Invitation,
  type SkippedEmail,
} from "./corporate-invite-utils";

// ─── Component ──────────────────────────────────────────────────────

export default function CorporateInviteSection({
  membershipId,
  clubId,
  clubName,
  companyName,
}: CorporateInviteSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<SkippedEmail[]>([]);

  // ─── Fetch invitations ──────────────────────────────────────────

  async function fetchInvitations() {
    try {
      const res = await fetch(
        `/api/corporate-invitations?membership_id=${membershipId}`
      );
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvitations();
  }, [membershipId]);

  // ─── Email input handling ───────────────────────────────────────

  function processInput(raw: string) {
    setInputValue(raw);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSkipped([]);

    const candidates = parseEmailInput(raw);
    const valid: string[] = [];
    const invalid: string[] = [];

    const existingEmails = new Set(
      invitations.map((inv) => inv.email.toLowerCase())
    );
    const seen = new Set<string>();

    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      if (!isValidEmail(candidate)) {
        if (candidate.length > 0) invalid.push(candidate);
      } else if (existingEmails.has(normalized)) {
        // Skip already invited
      } else {
        valid.push(candidate);
      }
    }

    setParsedEmails(valid);
    setInvalidEmails(invalid);
  }

  // ─── Send invitations ───────────────────────────────────────────

  async function sendInvitations() {
    if (parsedEmails.length === 0) return;

    setSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSkipped([]);

    try {
      const res = await fetch("/api/corporate-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: parsedEmails,
          club_id: clubId,
          membership_id: membershipId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to send invitations");
        return;
      }

      const sent = data.sent ?? 0;
      const skippedList: SkippedEmail[] = data.skipped ?? [];

      if (sent > 0) {
        setSuccessMessage(
          `${sent} invitation${sent !== 1 ? "s" : ""} sent successfully.`
        );
      }
      if (skippedList.length > 0) {
        setSkipped(skippedList);
      }

      setInputValue("");
      setParsedEmails([]);
      setInvalidEmails([]);
      await fetchInvitations();
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // ─── Resend invitation ──────────────────────────────────────────

  async function resendInvitation(invitationId: string) {
    setResendingId(invitationId);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/corporate-invitations/${invitationId}/resend`,
        { method: "POST" }
      );

      if (res.ok) {
        setSuccessMessage("Invitation resent successfully.");
        await fetchInvitations();
      } else {
        const data = await res.json();
        setErrorMessage(data.error ?? "Failed to resend invitation");
      }
    } catch {
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setResendingId(null);
    }
  }

  // ─── Computed values ────────────────────────────────────────────

  const existingEmailSet = new Set(
    invitations.map((inv) => inv.email.toLowerCase())
  );
  const newEmailCount = parsedEmails.filter(
    (e) => !existingEmailSet.has(e.toLowerCase())
  ).length;
  const skippedCount = parsedEmails.length - newEmailCount;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <CorporateInviteForm
        clubName={clubName}
        companyName={companyName}
        inputValue={inputValue}
        parsedEmails={parsedEmails}
        invalidEmails={invalidEmails}
        sending={sending}
        successMessage={successMessage}
        errorMessage={errorMessage}
        skipped={skipped}
        newEmailCount={newEmailCount}
        skippedCount={skippedCount}
        onProcessInput={processInput}
        onSendInvitations={sendInvitations}
      />

      <CorporateInvitationsTable
        invitations={invitations}
        loading={loading}
        resendingId={resendingId}
        onResendInvitation={resendInvitation}
      />
    </div>
  );
}
