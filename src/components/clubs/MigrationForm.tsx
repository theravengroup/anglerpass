"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  migrationInquirySchema,
  type MigrationInquiryFormData,
} from "@/lib/validations/migration-inquiry";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

import MigrationLoomInstructions from "./MigrationLoomInstructions";
import MigrationFormFields from "./MigrationFormFields";

export default function MigrationForm() {
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MigrationInquiryFormData>({
    resolver: zodResolver(migrationInquirySchema),
  });

  async function onSubmit(data: MigrationInquiryFormData) {
    setServerError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/migration-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Failed to submit inquiry");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mt-5 border-forest/20 bg-forest/5">
        <CardContent className="flex items-start gap-3 py-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" />
          <div>
            <p className="text-sm font-medium text-forest">
              Migration inquiry received!
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              We&rsquo;ll review your Loom video and details, then get back to
              you within 2 business days. Check your email for a confirmation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <p className="text-sm leading-relaxed text-text-secondary">
        We&rsquo;ve helped clubs migrate from DOS systems, paper ledgers, Excel
        spreadsheets, and everything in between. Whatever you&rsquo;re working
        with, we&rsquo;ll figure it out with you.
      </p>

      {/* Free migration callout */}
      <div className="rounded-xl border border-river/20 bg-river/10 px-5 py-4">
        <p className="text-sm leading-relaxed text-text-primary">
          Clubs committing to a 3-year AnglerPass plan may qualify for
          completely free migration. Qualification depends on data format and
          complexity. Fill out the form below to find out where you stand
          &mdash; there&rsquo;s no obligation.
        </p>
      </div>

      <MigrationLoomInstructions />

      {/* Migration inquiry form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <MigrationFormFields
          register={register}
          errors={errors}
          saving={saving}
        />

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-river text-white hover:bg-river/90"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Submit Migration Inquiry
          </Button>
        </div>
      </form>
    </div>
  );
}
