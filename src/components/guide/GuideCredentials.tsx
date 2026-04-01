"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { GuideProfileFormData } from "@/lib/validations/guides";

interface GuideCredentialsProps {
  form: UseFormReturn<GuideProfileFormData>;
  profile: Record<string, unknown> | null;
  isEditable: boolean;
  uploading: string | null;
  onCredentialUpload: (type: string, file: File) => void;
}

export default function GuideCredentials({
  form,
  profile,
  isEditable,
  uploading,
  onCredentialUpload,
}: GuideCredentialsProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="text-base">Credentials</CardTitle>
        <CardDescription>
          Upload your certifications for admin review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { type: "license", label: "Guide/Outfitter License", urlKey: "license_url" },
          { type: "insurance", label: "Liability Insurance", urlKey: "insurance_url" },
          { type: "first_aid", label: "First Aid / CPR", urlKey: "first_aid_cert_url" },
        ].map((cred) => (
          <div key={cred.type} className="flex items-center justify-between rounded-lg border border-stone-light/20 p-3">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-text-light" />
              <div>
                <p className="text-sm font-medium text-text-primary">{cred.label}</p>
                {(profile as Record<string, unknown>)?.[cred.urlKey] ? (
                  <p className="text-xs text-forest">Uploaded</p>
                ) : (
                  <p className="text-xs text-text-light">Not uploaded</p>
                )}
              </div>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onCredentialUpload(cred.type, file);
                }}
                disabled={uploading === cred.type || !isEditable}
              />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-light/30 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-offwhite">
                {uploading === cred.type ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Upload className="size-3" />
                )}
                {(profile as Record<string, unknown>)?.[cred.urlKey] ? "Replace" : "Upload"}
              </span>
            </label>
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="license_state">License State</Label>
            <Input
              id="license_state"
              {...form.register("license_state")}
              placeholder="e.g. Montana"
              disabled={!isEditable}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_amount">Insurance Coverage</Label>
            <Input
              id="insurance_amount"
              {...form.register("insurance_amount")}
              placeholder="e.g. $1M/$2M"
              disabled={!isEditable}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="has_motorized_vessel"
            {...form.register("has_motorized_vessel")}
            className="size-4 rounded border-stone-light"
            disabled={!isEditable}
          />
          <Label htmlFor="has_motorized_vessel">
            I operate a motorized vessel (USCG license required)
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
