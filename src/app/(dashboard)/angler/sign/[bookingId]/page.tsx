"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  FileText,
  Loader2,
  CheckCircle2,
  PenLine,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { substituteVariables } from "@/lib/validations/documents";

interface Template {
  id: string;
  title: string;
  body: string;
  required: boolean;
}

interface Booking {
  id: string;
  property_id: string;
  booking_date: string;
  party_size: number;
  status: string;
  properties: {
    name: string;
  } | null;
}

interface SigningStatus {
  templateId: string;
  signed: boolean;
  signedAt?: string;
}

export default function SignDocumentsPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [statuses, setStatuses] = useState<SigningStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch booking
        const bookingRes = await fetch(`/api/bookings/${bookingId}`);
        if (!bookingRes.ok) {
          setError("Booking not found");
          setLoading(false);
          return;
        }
        const bookingData = await bookingRes.json();
        const b = bookingData.booking;
        setBooking(b);

        // Fetch templates for this property
        const templatesRes = await fetch(
          `/api/documents?property_id=${b.property_id}`
        );
        if (!templatesRes.ok) {
          setLoading(false);
          return;
        }
        const templatesData = await templatesRes.json();
        const tpls = (templatesData.templates ?? []).filter(
          (t: Template) => t.required
        );
        setTemplates(tpls);

        // Check signing status for each template
        const statusPromises = tpls.map(async (t: Template) => {
          const res = await fetch(
            `/api/documents/${t.id}/sign?booking_id=${bookingId}`
          );
          if (res.ok) {
            const data = await res.json();
            return {
              templateId: t.id,
              signed: data.signed,
              signedAt: data.signed_document?.signed_at,
            };
          }
          return { templateId: t.id, signed: false };
        });

        const results = await Promise.all(statusPromises);
        setStatuses(results);

        // Set first unsigned template as active
        const firstUnsigned = results.find((s) => !s.signed);
        if (firstUnsigned) {
          setActiveTemplate(firstUnsigned.templateId);
        }
      } catch {
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const allSigned =
    templates.length > 0 &&
    statuses.length === templates.length &&
    statuses.every((s) => s.signed);

  const handleSign = async () => {
    if (!activeTemplate || !agreed || !signerName) return;

    setSigning(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${activeTemplate}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          signer_name: signerName,
          agreed: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to sign document");
        return;
      }

      // Update status
      setStatuses((prev) =>
        prev.map((s) =>
          s.templateId === activeTemplate
            ? { ...s, signed: true, signedAt: new Date().toISOString() }
            : s
        )
      );

      // Move to next unsigned template
      setAgreed(false);
      const nextUnsigned = statuses.find(
        (s) => !s.signed && s.templateId !== activeTemplate
      );
      if (nextUnsigned) {
        setActiveTemplate(nextUnsigned.templateId);
      } else {
        setActiveTemplate(null);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="size-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyName =
    (booking?.properties as { name: string } | null)?.name ?? "the property";

  if (templates.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-forest/20 bg-forest/5">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="size-12 text-forest" />
            <h3 className="mt-4 text-lg font-medium text-text-primary">
              No documents required
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              There are no required documents for this booking at{" "}
              <strong>{propertyName}</strong>.
            </p>
            <Button
              className="mt-4 bg-forest text-white hover:bg-forest/90"
              onClick={() => router.push("/angler/bookings")}
            >
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Sign Documents
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Please review and sign the required documents for your booking at{" "}
          <strong>{propertyName}</strong> on{" "}
          {booking?.booking_date
            ? new Date(booking.booking_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )
            : ""}{" "}
          .
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2">
        {templates.map((t, i) => {
          const status = statuses.find((s) => s.templateId === t.id);
          const isSigned = status?.signed;
          const isActive = activeTemplate === t.id;

          return (
            <button
              key={t.id}
              onClick={() => !isSigned && setActiveTemplate(t.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                isSigned
                  ? "border-forest/20 bg-forest/10 text-forest"
                  : isActive
                    ? "border-forest bg-white text-forest"
                    : "border-stone-light/20 text-text-light"
              }`}
            >
              {isSigned ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <span className="flex size-4 items-center justify-center rounded-full border border-current text-[10px]">
                  {i + 1}
                </span>
              )}
              {t.title.length > 30 ? t.title.slice(0, 30) + "..." : t.title}
            </button>
          );
        })}
      </div>

      {/* All signed state */}
      {allSigned && (
        <Card className="border-forest/20 bg-forest/5">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="size-12 text-forest" />
            <h3 className="mt-4 text-lg font-medium text-text-primary">
              All documents signed!
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              You&apos;re all set for your trip. Access details will be available
              in your booking once confirmed.
            </p>
            <Button
              className="mt-4 bg-forest text-white hover:bg-forest/90"
              onClick={() => router.push("/angler/bookings")}
            >
              Back to Bookings
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active template */}
      {activeTemplate && !allSigned && (() => {
        const template = templates.find((t) => t.id === activeTemplate);
        if (!template) return null;

        // Substitute variables for preview
        const previewBody = substituteVariables(template.body, {
          angler_name: signerName || "[Your Name]",
          property_name: propertyName,
          trip_date: booking?.booking_date ?? "",
          party_size: String(booking?.party_size ?? 1),
        });

        return (
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5 text-forest" />
                {template.title}
              </CardTitle>
              <CardDescription>
                Please read the document carefully, then type your name and
                agree below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document body */}
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-stone-light/20 bg-offwhite p-6">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap font-[family-name:var(--font-body)] text-sm leading-relaxed text-text-primary">
                  {previewBody}
                </div>
              </div>

              {/* Signature section */}
              <div className="space-y-4 rounded-lg border border-forest/20 bg-forest/5 p-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-forest">
                  <PenLine className="size-4" />
                  Sign Below
                </h4>

                <div>
                  <Label htmlFor="signer-name">Type Your Full Legal Name</Label>
                  <Input
                    id="signer-name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="mt-1.5 font-[family-name:var(--font-heading)] text-lg"
                    required
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 rounded border-stone-light/20"
                  />
                  <span className="text-sm leading-relaxed text-text-secondary">
                    I have read and understand this document. By typing my name
                    above, I agree to be bound by its terms. I confirm I am at
                    least 18 years of age or have parental/guardian consent.
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  onClick={handleSign}
                  disabled={signing || !agreed || signerName.length < 2}
                  className="w-full bg-forest text-white hover:bg-forest/90"
                >
                  {signing ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <PenLine className="mr-1.5 size-4" />
                  )}
                  Sign Document
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
