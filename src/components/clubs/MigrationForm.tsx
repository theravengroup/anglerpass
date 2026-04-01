"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  migrationInquirySchema,
  type MigrationInquiryFormData,
} from "@/lib/validations/migration-inquiry";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

const DATA_SOURCE_OPTIONS = [
  { value: "", label: "Select one..." },
  { value: "excel-sheets", label: "Excel or Google Sheets" },
  { value: "google-forms", label: "Google Forms" },
  { value: "club-software", label: "Club management software" },
  { value: "paper", label: "Paper records" },
  { value: "legacy-dos", label: "Legacy or DOS system" },
  { value: "other", label: "Other" },
];

const WEBSITE_OPTIONS = [
  { value: "", label: "Select one..." },
  { value: "wordpress", label: "WordPress" },
  { value: "squarespace", label: "Squarespace" },
  { value: "wix", label: "Wix" },
  { value: "custom", label: "Custom built" },
  { value: "none", label: "No website" },
  { value: "other", label: "Other" },
];

const MULTIYEAR_OPTIONS = [
  { value: "", label: "Select one..." },
  { value: "yes", label: "Yes, definitely" },
  { value: "possibly", label: "Possibly" },
  { value: "not-sure", label: "Not sure yet" },
];

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

      {/* Loom instructions */}
      <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-forest">
        Before You Fill Out the Form &mdash; Record a Short Loom Video
      </h4>

      <p className="text-sm leading-relaxed text-text-secondary">
        Loom is a free screen recording tool. Before filling out the form,
        record a short video showing us where your member data currently lives.
        No preparation needed &mdash; just show us what you&rsquo;re working
        with.
      </p>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
        <li>
          Go to{" "}
          <a
            href="https://loom.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-river underline"
          >
            loom.com
          </a>{" "}
          and create a free account
        </li>
        <li>
          Click <strong className="text-text-primary">New Recording</strong> and
          select Screen + Camera or Screen Only
        </li>
        <li>
          Navigate to wherever your member data lives &mdash; a spreadsheet,
          software system, folder of files, anything
        </li>
        <li>
          Hit record and walk us through what you have. Aim for 2&ndash;5
          minutes.
        </li>
        <li>
          When finished, click <strong className="text-text-primary">Stop</strong>{" "}
          and copy your shareable Loom link
        </li>
        <li>Paste the link into the form below</li>
      </ol>

      {/* Loom example video embed — add src when ready */}
      <div>{/* Loom example video embed — add src when ready */}</div>

      {/* Migration inquiry form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="border-stone-light/20">
          <CardContent className="space-y-5 pt-6">
            {/* Club name */}
            <div className="space-y-2">
              <Label htmlFor="mig-clubName">
                Club name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mig-clubName"
                placeholder="e.g. South Platte Anglers Club"
                {...register("clubName")}
                disabled={saving}
              />
              {errors.clubName && (
                <p className="text-xs text-red-600">
                  {errors.clubName.message}
                </p>
              )}
            </div>

            {/* Your name */}
            <div className="space-y-2">
              <Label htmlFor="mig-contactName">
                Your name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mig-contactName"
                placeholder="First and last name"
                {...register("contactName")}
                disabled={saving}
              />
              {errors.contactName && (
                <p className="text-xs text-red-600">
                  {errors.contactName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="mig-email">
                Email address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mig-email"
                type="email"
                placeholder="you@yourclub.com"
                {...register("email")}
                disabled={saving}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Member count */}
            <div className="space-y-2">
              <Label htmlFor="mig-memberCount">
                Number of active members <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mig-memberCount"
                type="number"
                min={1}
                placeholder="e.g. 150"
                {...register("memberCount")}
                disabled={saving}
              />
              {errors.memberCount && (
                <p className="text-xs text-red-600">
                  {errors.memberCount.message}
                </p>
              )}
            </div>

            {/* Data source */}
            <div className="space-y-2">
              <Label htmlFor="mig-dataSource">
                Where does your member data currently live?{" "}
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="mig-dataSource"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("dataSource")}
                disabled={saving}
              >
                {DATA_SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.dataSource && (
                <p className="text-xs text-red-600">
                  {errors.dataSource.message}
                </p>
              )}
            </div>

            {/* Website platform */}
            <div className="space-y-2">
              <Label htmlFor="mig-websitePlatform">
                What platform is your club website on?
              </Label>
              <select
                id="mig-websitePlatform"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("websitePlatform")}
                disabled={saving}
              >
                {WEBSITE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.websitePlatform && (
                <p className="text-xs text-red-600">
                  {errors.websitePlatform.message}
                </p>
              )}
            </div>

            {/* Multi-year interest */}
            <div className="space-y-2">
              <Label htmlFor="mig-multiyear">
                Are you interested in a multi-year commitment with AnglerPass?
              </Label>
              <select
                id="mig-multiyear"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("multiyearInterest")}
                disabled={saving}
              >
                {MULTIYEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target launch date */}
            <div className="space-y-2">
              <Label htmlFor="mig-targetLaunch">Target launch date</Label>
              <Input
                id="mig-targetLaunch"
                type="date"
                {...register("targetLaunch")}
                disabled={saving}
              />
            </div>

            {/* Loom URL */}
            <div className="space-y-2">
              <Label htmlFor="mig-loomUrl">
                Your Loom video link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mig-loomUrl"
                type="url"
                placeholder="https://loom.com/share/..."
                {...register("loomUrl")}
                disabled={saving}
              />
              {errors.loomUrl && (
                <p className="text-xs text-red-600">
                  {errors.loomUrl.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="mig-notes">Anything else we should know</Label>
              <textarea
                id="mig-notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Current pain points, timeline considerations, questions..."
                {...register("notes")}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

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
