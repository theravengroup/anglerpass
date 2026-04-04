"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv";

interface BulkInviteFormProps {
  clubId: string;
  onComplete: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 200;

function parseEmailsFromText(text: string): {
  valid: string[];
  invalid: string[];
} {
  const entries = text
    .split(/[,;\n\r]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const entry of entries) {
    if (EMAIL_REGEX.test(entry)) {
      valid.push(entry.toLowerCase());
    } else {
      invalid.push(entry);
    }
  }

  return { valid: [...new Set(valid)], invalid };
}

function parseEmailsFromCSV(csvText: string): {
  valid: string[];
  invalid: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return { valid: [], invalid: [] };

  // Check first line for an "email" column header
  const headerCells = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/"/g, ""));
  const emailColIndex = headerCells.findIndex((h) => h === "email");

  const valid: string[] = [];
  const invalid: string[] = [];

  const dataLines = emailColIndex >= 0 ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim().replace(/"/g, ""));

    if (emailColIndex >= 0) {
      // Extract from the email column
      const cell = cells[emailColIndex] ?? "";
      if (EMAIL_REGEX.test(cell)) {
        valid.push(cell.toLowerCase());
      } else if (cell.length > 0) {
        invalid.push(cell);
      }
    } else {
      // No email header found — scan all fields for emails
      for (const cell of cells) {
        if (EMAIL_REGEX.test(cell)) {
          valid.push(cell.toLowerCase());
        }
      }
    }
  }

  return { valid: [...new Set(valid)], invalid };
}

export default function BulkInviteForm({ clubId, onComplete }: BulkInviteFormProps) {
  const [pasteText, setPasteText] = useState("");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    invited: number;
    skipped: number;
    skippedEmails: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePasteChange(text: string) {
    setPasteText(text);
    setResult(null);
    setError(null);
    setFileName(null);

    if (text.trim().length === 0) {
      setParsedEmails([]);
      setInvalidEntries([]);
      return;
    }

    const { valid, invalid } = parseEmailsFromText(text);
    setParsedEmails(valid);
    setInvalidEntries(invalid);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError(null);
    setPasteText("");

    const text = await file.text();
    const { valid, invalid } = parseEmailsFromCSV(text);
    setParsedEmails(valid);
    setInvalidEntries(invalid);
    setFileName(file.name);

    // Reset file input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClear() {
    setPasteText("");
    setParsedEmails([]);
    setInvalidEntries([]);
    setFileName(null);
    setResult(null);
    setError(null);
  }

  async function handleSend() {
    if (parsedEmails.length === 0) return;

    if (parsedEmails.length > MAX_EMAILS) {
      setError(`Maximum ${MAX_EMAILS} emails per request. You have ${parsedEmails.length}.`);
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedEmails }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to send invitations");
        return;
      }

      setResult(data);
      onComplete();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }

  function handleDownloadTemplate() {
    downloadCSV(
      [
        ["email"],
        ["angler@example.com"],
        ["member@fishingclub.com"],
      ],
      "member-import-template.csv"
    );
  }

  return (
    <Card className="border-river/20 bg-river/5">
      <CardContent className="space-y-4 py-5">
        {/* File upload area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">
              Upload a CSV or paste emails
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs text-river hover:text-river/80"
            >
              <Download className="size-3.5" />
              Download Template
            </Button>
          </div>

          <label
            htmlFor="bulk-csv-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-light/30 bg-offwhite/50 py-8 transition-colors hover:border-river/30 hover:bg-offwhite"
          >
            <Upload className="size-6 text-text-light" />
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                {fileName ? fileName : "Click to upload a CSV file"}
              </p>
              <p className="mt-0.5 text-xs text-text-light">
                Accepts .csv or .txt files
              </p>
            </div>
            <input
              ref={fileInputRef}
              id="bulk-csv-upload"
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Paste area */}
        <div className="space-y-2">
          <label
            htmlFor="bulk-paste"
            className="text-sm font-medium text-text-primary"
          >
            Or paste emails below
          </label>
          <textarea
            id="bulk-paste"
            rows={4}
            placeholder="angler@example.com, member@club.com&#10;Or one email per line..."
            value={pasteText}
            onChange={(e) => handlePasteChange(e.target.value)}
            disabled={sending}
            className="w-full resize-none rounded-md border border-stone-light/30 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-light focus:border-river focus:outline-none focus:ring-2 focus:ring-river/20"
          />
          <p className="text-xs text-text-light">
            Separate emails with commas, semicolons, or new lines
          </p>
        </div>

        {/* Parsed results summary */}
        {(parsedEmails.length > 0 || invalidEntries.length > 0) && (
          <div className="flex items-center gap-3 rounded-md bg-offwhite px-3 py-2">
            <FileText className="size-4 shrink-0 text-river" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-text-primary">
                {parsedEmails.length} valid email{parsedEmails.length !== 1 ? "s" : ""} found
              </span>
              {invalidEntries.length > 0 && (
                <span className="ml-2 text-red-600">
                  ({invalidEntries.length} invalid entr{invalidEntries.length !== 1 ? "ies" : "y"} skipped)
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-text-light hover:text-text-primary"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Invalid entries detail */}
        {invalidEntries.length > 0 && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
            aria-live="polite"
          >
            <p className="font-medium">Invalid entries:</p>
            <p className="mt-1">{invalidEntries.slice(0, 10).join(", ")}</p>
            {invalidEntries.length > 10 && (
              <p className="mt-0.5 text-red-500">
                ...and {invalidEntries.length - 10} more
              </p>
            )}
          </div>
        )}

        {parsedEmails.length > MAX_EMAILS && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
            aria-live="polite"
          >
            Maximum {MAX_EMAILS} emails per request. Please reduce the list.
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Success result */}
        {result && (
          <div className="space-y-2 rounded-md border border-forest/20 bg-forest/5 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-forest">
              <CheckCircle2 className="size-4" />
              {result.invited} invitation{result.invited !== 1 ? "s" : ""} sent
            </div>
            {result.skipped > 0 && (
              <div className="text-xs text-text-secondary">
                <p>
                  {result.skipped} skipped (already members or previously invited):
                </p>
                <p className="mt-1 text-text-light">
                  {result.skippedEmails.slice(0, 5).join(", ")}
                  {result.skippedEmails.length > 5 &&
                    ` ...and ${result.skippedEmails.length - 5} more`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={sending || parsedEmails.length === 0 || parsedEmails.length > MAX_EMAILS}
          className="bg-river text-white hover:bg-river/90"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {sending
            ? "Sending..."
            : `Send ${parsedEmails.length > 0 ? parsedEmails.length : ""} Invitation${parsedEmails.length !== 1 ? "s" : ""}`}
        </Button>
      </CardContent>
    </Card>
  );
}
