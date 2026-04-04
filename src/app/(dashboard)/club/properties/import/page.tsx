"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { FetchError } from "@/components/shared/FetchError";
import { CSV_COLUMNS } from "@/lib/validations/property-import";

interface PreviewRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

interface PreviewSummary {
  total: number;
  valid: number;
  invalid: number;
}

type Step = "upload" | "preview" | "importing" | "done";

export default function ImportPropertiesPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
  } | null>(null);

  async function init() {
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) {
        setError("Failed to load club");
        return;
      }
      const data = await res.json();
      if (data.owned?.length) {
        setClubId(data.owned[0].id);
      } else {
        setError("No club found");
      }
    } catch {
      setError("Failed to load club");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
    await handlePreview(text);
  }

  async function handlePreview(text: string) {
    if (!clubId) return;
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/properties/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse CSV");
        return;
      }

      setPreview(data.preview);
      setSummary(data.summary);
      setStep("preview");
    } catch {
      setError("Failed to parse CSV");
    }
  }

  async function handleConfirm() {
    if (!clubId) return;
    setStep("importing");
    setError(null);

    try {
      const res = await fetch(
        `/api/clubs/${clubId}/properties/import/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: csvText }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        setStep("preview");
        return;
      }

      setImportResult({ imported: data.imported, failed: data.failed });
      setStep("done");
    } catch {
      setError("Import failed");
      setStep("preview");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error && step === "upload" && !clubId) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message={error} onRetry={init} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/club/properties">
            <ArrowLeft className="mr-1 size-3.5" />
            Back
          </Link>
        </Button>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Import Properties from CSV
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Bulk import property listings. Properties are created as drafts —
            you&rsquo;ll still need to add photos and invite landowners.
          </p>
        </div>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="csv-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-stone-light/30 bg-offwhite/50 py-12 transition-colors hover:border-river/30 hover:bg-offwhite"
              >
                <Upload className="size-8 text-text-light" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">
                    Click to upload a CSV file
                  </p>
                  <p className="mt-1 text-xs text-text-light">
                    Max 100 properties, 500KB file size
                  </p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {error && (
                <div
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV format guide */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg">
                <FileText className="size-4" />
                CSV Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-secondary">
                Your CSV should have a header row with these columns. Only{" "}
                <strong>name</strong> is required; all others are optional.
              </p>
              <div className="overflow-x-auto rounded-md bg-offwhite p-3">
                <code className="text-xs text-text-secondary">
                  {CSV_COLUMNS.join(",")}
                </code>
              </div>
              <ul className="space-y-1 text-xs text-text-light">
                <li>
                  <strong>water_type:</strong> river, stream, lake, pond,
                  spring_creek, tailwater, reservoir
                </li>
                <li>
                  <strong>species:</strong> Semicolon-separated (e.g.
                  &quot;Rainbow Trout;Brown Trout&quot;)
                </li>
                <li>
                  <strong>coordinates:</strong> Latitude, Longitude (e.g.
                  &quot;39.2242, -105.9731&quot;)
                </li>
                <li>
                  <strong>rates:</strong> Numeric values in dollars (e.g.
                  &quot;150&quot;)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && summary && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-stone-light/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium text-text-primary">
                    {summary.total} rows found
                  </span>
                  <span className="mx-2 text-text-light">|</span>
                  <span className="text-forest">
                    {summary.valid} valid
                  </span>
                  {summary.invalid > 0 && (
                    <>
                      <span className="mx-2 text-text-light">|</span>
                      <span className="text-red-500">
                        {summary.invalid} invalid (will be skipped)
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep("upload");
                    setCsvText("");
                    setPreview([]);
                    setSummary(null);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={summary.valid === 0}
                >
                  Import {summary.valid} Properties
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview table */}
          <Card className="border-stone-light/20">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 bg-offwhite/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Row
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Water Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr
                      key={row.row}
                      className={`border-b border-stone-light/10 ${
                        !row.valid ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-text-light">
                        {row.row}
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle2 className="size-4 text-forest" />
                        ) : (
                          <AlertCircle className="size-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-text-primary">
                        {row.data.name || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-text-secondary">
                        {row.data.location_description || "—"}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {row.data.water_type || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-red-600">
                        {row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center py-16">
            <Loader2 className="size-8 animate-spin text-river" />
            <p className="mt-4 text-sm text-text-secondary">
              Importing properties...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <Card className="border-forest/20">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <CheckCircle2 className="size-7 text-forest" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-forest">
              Import Complete
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {importResult.imported} properties imported as drafts.
              {importResult.failed > 0 && (
                <span className="text-red-500">
                  {" "}
                  {importResult.failed} failed.
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-text-light">
              Add photos and invite landowners to claim their properties.
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push("/club/properties")}
            >
              View Properties
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
