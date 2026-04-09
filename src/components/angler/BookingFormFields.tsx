"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookingFormFieldsProps {
  startDate: string;
  endDate: string;
  duration: string;
  partySize: number;
  nonFishingGuests: number;
  selectedMembership: string;
  message: string;
  submitting: boolean;
  minDate: string;
  numberOfDays: number;
  property: {
    half_day_allowed: boolean;
    max_rods: number | null;
    max_guests: number | null;
    accessible_through: {
      membership_id: string;
      club_id: string;
      club_name: string;
    }[];
  };
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPartySizeChange: (value: number) => void;
  onNonFishingGuestsChange: (value: number) => void;
  onMembershipChange: (value: string) => void;
  onMessageChange: (value: string) => void;
}

export default function BookingFormFields({
  startDate,
  endDate,
  duration,
  partySize,
  nonFishingGuests,
  selectedMembership,
  message,
  submitting,
  minDate,
  numberOfDays,
  property,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
  onPartySizeChange,
  onNonFishingGuestsChange,
  onMembershipChange,
  onMessageChange,
}: BookingFormFieldsProps) {
  return (
    <>
      {/* Date range */}
      <div className="space-y-2">
        <Label>Dates</Label>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-text-light">Start</span>
            <Input
              id="start_date"
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-xs text-text-light">End</span>
            <Input
              id="end_date"
              type="date"
              min={startDate || minDate}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={submitting || !startDate}
            />
          </div>
        </div>
        {startDate && numberOfDays > 1 && (
          <p className="text-xs font-medium text-bronze">
            {numberOfDays} day{numberOfDays > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Duration */}
      {property.half_day_allowed && (
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select
            value={duration}
            onValueChange={onDurationChange}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_day">Full Day</SelectItem>
              <SelectItem value="half_day">Half Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Anglers (rods) */}
      <div className="space-y-2">
        <Label htmlFor="party_size">
          Anglers (Rods)
          {property.max_rods && (
            <span className="ml-1 font-normal text-text-light">
              max {property.max_rods}
            </span>
          )}
        </Label>
        <Input
          id="party_size"
          type="number"
          min={1}
          max={property.max_rods ?? 20}
          value={partySize}
          onChange={(e) => onPartySizeChange(parseInt(e.target.value) || 1)}
          disabled={submitting}
        />
        <p className="text-xs text-text-light">
          Only you (the booking member) need to be a club member.
          Your fishing companions do not need memberships.
        </p>
      </div>

      {/* Non-fishing guests */}
      <div className="space-y-2">
        <Label htmlFor="non_fishing_guests">
          Non-Fishing Guests
          <span className="ml-1 font-normal text-text-light">(no rod fee)</span>
        </Label>
        <Input
          id="non_fishing_guests"
          type="number"
          min={0}
          max={
            property.max_guests
              ? Math.max(0, property.max_guests - partySize)
              : 50
          }
          value={nonFishingGuests}
          onChange={(e) => onNonFishingGuestsChange(parseInt(e.target.value) || 0)}
          disabled={submitting}
        />
        <p className="text-xs text-text-light">
          Family or friends who won&apos;t be fishing. No charge, but
          they count toward the property&apos;s total guest limit
          {property.max_guests ? ` of ${property.max_guests}` : ""}.
        </p>
      </div>

      {/* Total people summary */}
      {partySize + nonFishingGuests > 1 && (
        <div className="rounded-md bg-offwhite/80 px-3 py-2 text-xs text-text-secondary">
          <span className="font-medium text-text-primary">
            Total party: {partySize + nonFishingGuests} people
          </span>
          {" — "}
          {partySize} angler{partySize > 1 ? "s" : ""} +{" "}
          {nonFishingGuests} non-fishing guest
          {nonFishingGuests !== 1 ? "s" : ""}
        </div>
      )}

      {/* Club membership (if multiple) */}
      {property.accessible_through.length > 1 && (
        <div className="space-y-2">
          <Label>Book Through</Label>
          <Select
            value={selectedMembership}
            onValueChange={onMembershipChange}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select club" />
            </SelectTrigger>
            <SelectContent>
              {property.accessible_through.map((club) => (
                <SelectItem
                  key={club.membership_id}
                  value={club.membership_id}
                >
                  {club.club_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">
          Message to Landowner{" "}
          <span className="text-text-light">(optional)</span>
        </Label>
        <textarea
          id="message"
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Introduce yourself, mention your experience..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={submitting}
        />
      </div>
    </>
  );
}
