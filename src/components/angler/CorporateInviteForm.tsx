"use client";

import { useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { SkippedEmail } from "./corporate-invite-utils";
import { extractEmailsFromCSV } from "./corporate-invite-utils";

// ─── Types ──────────────────────────────────────────────────────────

interface CorporateInviteFormProps {
  clubName: string;
  companyName: string;
  inputValue: string;
  parsedEmails: string[];
  invalidEmails: string[];
  sending: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  skipped: SkippedEmail[];
  newEmailCount: number;
  skippedCount: number;
  onProcessInput: (raw: string) => void;
  onSendInvitations: () => void;
}

// ─── Component ──────────────────────────────────────────────────────

export function CorporateInviteForm({
  clubName,
  companyName,
  inputValue,
  parsedEmails,
  invalidEmails,
  sending,
  successMessage,
  errorMessage,
  skipped,
  newEmailCount,
  skippedCount,
  onProcessInput,
  onSendInvitations,
}: CorporateInviteFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && parsedEmails.length > 0) {
      e.preventDefault();
      onSendInvitations();
    }
  }

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
      onProcessInput(combined);
    };
    reader.readAsText(file);

    // Reset file input so re-uploading same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex size-9 items-center justify-center rounded-lg bg-river/10">
            <Users className="size-[18px] text-river" />
          </div>
          Invite Employees
        </CardTitle>
        <CardDescription>
          Invite {companyName} employees to join {clubName}. Employees skip the
          initiation fee with your corporate membership.
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
              onChange={(e) => onProcessInput(e.target.value)}
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
              onClick={onSendInvitations}
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
  );
}
