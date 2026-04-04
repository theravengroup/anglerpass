"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { MEMBERSHIP_STATUS } from "@/lib/constants/status";
import {
  Users,
  Upload,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Mail,
  AlertCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface CorporateInviteSectionProps {
  membershipId: string;
  clubId: string;
  clubName: string;
  companyName: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

interface SkippedEmail {
  email: string;
  reason: string;
}

// ─── CSV Parsing ────────────────────────────────────────────────────

const EMAIL_HEADER_PATTERNS = [
  "email",
  "e-mail",
  "email address",
  "emailaddress",
  "e-mail address",
  "mail",
];

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function extractEmailsFromCSV(text: string): string[] {
  const cleaned = stripBom(text);
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headerFields = parseCSVLine(lines[0]);
  const emailColIndex = headerFields.findIndex((h) =>
    EMAIL_HEADER_PATTERNS.includes(h.toLowerCase().trim())
  );

  if (emailColIndex >= 0) {
    // Header found - extract from that column
    return lines.slice(1).map((line) => {
      const fields = parseCSVLine(line);
      return fields[emailColIndex]?.trim() ?? "";
    });
  }

  // No header found - try to extract emails from all fields
  const emails: string[] = [];
  for (const line of lines) {
    const fields = parseCSVLine(line);
    for (const field of fields) {
      const trimmed = field.trim();
      if (isValidEmail(trimmed)) {
        emails.push(trimmed);
      }
    }
  }
  return emails;
}

// ─── Email Validation ───────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function parseEmailInput(input: string): string[] {
  // Split on commas, semicolons, newlines, or spaces followed by email-like strings
  return input
    .split(/[,;\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && parsedEmails.length > 0) {
      e.preventDefault();
      sendInvitations();
    }
  }

  // ─── CSV upload ─────────────────────────────────────────────────

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") return;

      const emails = extractEmailsFromCSV(text);
      const combined = inputValue
        ? `${inputValue}\n${emails.join("\n")}`
        : emails.join("\n");
      processInput(combined);
    };
    reader.readAsText(file);

    // Reset file input so re-uploading same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === "accepted"
  );

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Section header */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex size-9 items-center justify-center rounded-lg bg-river/10">
              <Users className="size-[18px] text-river" />
            </div>
            Invite Employees
          </CardTitle>
          <CardDescription>
            Invite {companyName} employees to join {clubName}. Employees skip
            the initiation fee with your corporate membership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Smart email input */}
          <div className="space-y-2">
            <label
              htmlFor="corporate-email-input"
              className="text-sm font-medium text-text-primary"
            >
              Employee Emails
            </label>
            <div className="flex gap-2">
              <textarea
                id="corporate-email-input"
                aria-label="Enter employee email addresses separated by commas, semicolons, or new lines"
                placeholder="Enter emails separated by commas, semicolons, or new lines..."
                value={inputValue}
                onChange={(e) => processInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={sending}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload CSV file with employee emails"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-nowrap border-stone-light/30 bg-white px-3 py-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  aria-label="Upload CSV file"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Upload CSV
                </Button>
              </div>
            </div>
            <p className="text-xs text-text-light">
              Paste a list of emails, or upload a CSV file with an email column.
            </p>
          </div>

          {/* Invalid email warnings */}
          {invalidEmails.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div className="text-xs text-red-700">
                <p className="font-medium">Invalid email format:</p>
                <p className="mt-0.5">
                  {invalidEmails.slice(0, 5).join(", ")}
                  {invalidEmails.length > 5 &&
                    ` and ${invalidEmails.length - 5} more`}
                </p>
              </div>
            </div>
          )}

          {/* Confirmation summary */}
          {parsedEmails.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-river/20 bg-river/5 px-4 py-3">
              <div className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">
                  Ready to send {newEmailCount} invitation
                  {newEmailCount !== 1 ? "s" : ""}.
                </span>
                {skippedCount > 0 && (
                  <span className="ml-1">
                    {skippedCount} skipped (already invited).
                  </span>
                )}
              </div>
              <Button
                onClick={sendInvitations}
                disabled={sending || newEmailCount === 0}
                className="bg-river text-white hover:bg-river/90"
                aria-label="Send all invitations"
              >
                {sending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 size-4" />
                )}
                Send All
              </Button>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-forest">
              <CheckCircle2 className="size-4" />
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {/* Skipped details */}
          {skipped.length > 0 && (
            <div className="rounded-md border border-stone-light/20 bg-offwhite px-3 py-2">
              <p className="text-xs font-medium text-text-secondary">
                Skipped {skipped.length} email
                {skipped.length !== 1 ? "s" : ""}:
              </p>
              <ul className="mt-1 space-y-0.5">
                {skipped.map((s) => (
                  <li key={s.email} className="text-xs text-text-light">
                    {s.email} &mdash; {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invited Employees table */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-river" />
            Invited Employees
          </CardTitle>
          <CardDescription>
            {invitations.length > 0
              ? `${acceptedInvitations.length} accepted, ${pendingInvitations.length} pending`
              : "No invitations sent yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-river" />
            </div>
          ) : invitations.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Invitations Yet"
              description="Invite employees above to get started. They'll receive an email with a link to join the club."
              iconColor="text-river"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Invited employees">
                <thead>
                  <tr className="border-b border-stone-light/15">
                    <th className="pb-2 text-left text-xs font-medium text-text-light">
                      Email
                    </th>
                    <th className="pb-2 text-left text-xs font-medium text-text-light">
                      Status
                    </th>
                    <th className="pb-2 text-left text-xs font-medium text-text-light">
                      Invited
                    </th>
                    <th className="pb-2 text-left text-xs font-medium text-text-light">
                      Accepted
                    </th>
                    <th className="pb-2 text-right text-xs font-medium text-text-light">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 text-sm text-text-primary">
                        {inv.email}
                      </td>
                      <td className="py-3">
                        <StatusBadge
                          status={inv.status}
                          config={MEMBERSHIP_STATUS}
                          fallbackKey="pending"
                        />
                      </td>
                      <td className="py-3 text-xs text-text-light">
                        {new Date(inv.invited_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-xs text-text-light">
                        {inv.accepted_at
                          ? new Date(inv.accepted_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "\u2014"}
                      </td>
                      <td className="py-3 text-right">
                        {inv.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => resendInvitation(inv.id)}
                            disabled={resendingId === inv.id}
                            aria-label={`Resend invitation to ${inv.email}`}
                          >
                            {resendingId === inv.id ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 size-3" />
                            )}
                            Resend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
