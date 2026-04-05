"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TripDetails {
  proposedDate: string;
  startTime: string;
  durationHours: number;
  maxAnglers: number;
  notes: string;
}

export function ProposalStepDetails({
  details,
  onChange,
}: {
  details: TripDetails;
  onChange: (details: TripDetails) => void;
}) {
  function update(field: keyof TripDetails, value: string | number) {
    onChange({ ...details, [field]: value });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Set the date, time, and trip parameters.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proposed_date" className="text-sm text-text-primary">
            Trip Date
          </Label>
          <Input
            id="proposed_date"
            type="date"
            value={details.proposedDate}
            onChange={(e) => update("proposedDate", e.target.value)}
            className="border-stone-light/20"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_time" className="text-sm text-text-primary">
            Start Time
          </Label>
          <Input
            id="start_time"
            type="time"
            value={details.startTime}
            onChange={(e) => update("startTime", e.target.value)}
            className="border-stone-light/20"
            required
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="duration_hours"
            className="text-sm text-text-primary"
          >
            Duration (hours)
          </Label>
          <Input
            id="duration_hours"
            type="number"
            min={1}
            max={12}
            value={details.durationHours || ""}
            onChange={(e) =>
              update("durationHours", parseInt(e.target.value, 10) || 0)
            }
            className="border-stone-light/20"
            placeholder="e.g. 8"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_anglers" className="text-sm text-text-primary">
            Max Anglers
          </Label>
          <Input
            id="max_anglers"
            type="number"
            min={1}
            max={10}
            value={details.maxAnglers || ""}
            onChange={(e) =>
              update("maxAnglers", parseInt(e.target.value, 10) || 0)
            }
            className="border-stone-light/20"
            placeholder="e.g. 4"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm text-text-primary">
          Notes (optional)
        </Label>
        <textarea
          id="notes"
          value={details.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Anything anglers should know about this trip..."
          maxLength={2000}
          rows={3}
          className="flex w-full rounded-md border border-stone-light/20 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
