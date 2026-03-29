"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Save } from "lucide-react";
import { DEFAULT_WAIVER_TEMPLATE } from "@/lib/validations/documents";

function NewDocumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const useTemplate = searchParams.get("template");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [required, setRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useTemplate === "waiver") {
      setTitle("Liability Waiver & Release of Claims");
      setBody(DEFAULT_WAIVER_TEMPLATE);
    }
  }, [useTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          title,
          body,
          required,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create document");
        return;
      }

      router.push("/landowner/documents");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!propertyId) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-red-600">
          Missing property_id. Go back to documents and select a property.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          New Document
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create a waiver or agreement that anglers must sign before their trip.
          Use {"{{angler_name}}"}, {"{{property_name}}"}, {"{{trip_date}}"},{" "}
          {"{{party_size}}"} for auto-filled fields.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-forest" />
              Document Template
            </CardTitle>
            <CardDescription>
              The document will be shown to anglers before they can confirm their
              booking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Liability Waiver & Release of Claims"
                required
                minLength={3}
              />
            </div>

            <div>
              <Label htmlFor="body">Document Body</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-stone-light/20 bg-white px-3 py-2 text-sm font-mono leading-relaxed text-text-primary focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                rows={20}
                required
                minLength={20}
                placeholder="Enter your document text here. Supports markdown formatting."
              />
              <p className="mt-1 text-[11px] text-text-light">
                Supports markdown formatting. Variables like {"{{angler_name}}"}{" "}
                will be replaced with actual values when the angler signs.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="rounded border-stone-light/20"
              />
              <span className="text-sm text-text-primary">
                Required before trip (angler must sign to access the property)
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/landowner/documents")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-forest text-white hover:bg-forest/90"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 size-4" />
                )}
                Save Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-forest" />
        </div>
      }
    >
      <NewDocumentForm />
    </Suspense>
  );
}
