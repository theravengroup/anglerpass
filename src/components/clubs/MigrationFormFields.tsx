"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { MigrationInquiryFormData } from "@/lib/validations/migration-inquiry";

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

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

interface MigrationFormFieldsProps {
  register: UseFormRegister<MigrationInquiryFormData>;
  errors: FieldErrors<MigrationInquiryFormData>;
  saving: boolean;
}

export default function MigrationFormFields({
  register,
  errors,
  saving,
}: MigrationFormFieldsProps) {
  return (
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
            {...register("memberCount", { valueAsNumber: true })}
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
            className={SELECT_CLASS}
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
            className={SELECT_CLASS}
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
            className={SELECT_CLASS}
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
  );
}
