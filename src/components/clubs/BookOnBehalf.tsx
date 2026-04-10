'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Search, Loader2, CalendarDays, MapPin } from 'lucide-react';
import { toDateString } from '@/lib/utils';

interface ClubMember {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: string;
}

interface Property {
  id: string;
  name: string;
  location_description: string | null;
  rate_adult_full_day: number | null;
  rate_adult_half_day: number | null;
  half_day_allowed: boolean | null;
  max_rods: number | null;
}

interface BookOnBehalfProps {
  clubId: string;
  members: ClubMember[];
  properties: Property[];
}

export default function BookOnBehalf({ clubId, members, properties }: BookOnBehalfProps) {
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingEndDate, setBookingEndDate] = useState('');
  const [duration, setDuration] = useState<'full_day' | 'half_day'>('full_day');
  const [partySize, setPartySize] = useState(1);
  const [nonFishingGuests, setNonFishingGuests] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredMembers = members.filter(
    (m) =>
      m.status === 'active' &&
      (m.display_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email?.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMember) {
      setError('Please select a member');
      return;
    }
    if (!selectedProperty) {
      setError('Please select a property');
      return;
    }
    if (!bookingDate) {
      setError('Please select a date');
      return;
    }

    // Find the member's club_membership_id
    const membershipId = selectedMember.id;

    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angler_id: selectedMember.user_id,
          property_id: selectedProperty.id,
          club_membership_id: membershipId,
          booking_date: bookingDate,
          booking_end_date: bookingEndDate || undefined,
          duration,
          party_size: partySize,
          non_fishing_guests: nonFishingGuests,
          message: message || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create booking');

      setSuccess(
        `Booking created for ${selectedMember.display_name} at ${selectedProperty.name} on ${bookingDate}. ` +
        `They have been notified.`
      );

      // Reset form
      setSelectedMember(null);
      setSelectedProperty(null);
      setBookingDate('');
      setBookingEndDate('');
      setMessage('');
      setPartySize(1);
      setNonFishingGuests(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = toDateString(tomorrow);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-text-primary">
          Book on Behalf of a Member
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Create a booking for a club member. They will be notified and the booking
          will appear in their dashboard.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest" role="alert" aria-live="polite">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Member selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-text-primary mb-1">
            Member
          </label>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-lg border border-forest bg-forest/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <UserCheck className="size-4 text-forest" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{selectedMember.display_name}</p>
                  <p className="text-xs text-text-secondary">{selectedMember.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setMemberSearch('');
                }}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-light" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowMemberDropdown(true);
                }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="Search members by name or email..."
                className="w-full rounded-lg border border-parchment bg-offwhite pl-10 pr-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-parchment bg-white shadow-lg">
                  {filteredMembers.slice(0, 10).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setShowMemberDropdown(false);
                        setMemberSearch('');
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-offwhite"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{m.display_name}</p>
                        <p className="text-xs text-text-secondary">{m.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property selection */}
        <div>
          <label htmlFor="property-select" className="block text-sm font-medium text-text-primary mb-1">
            Property
          </label>
          <select
            id="property-select"
            value={selectedProperty?.id ?? ''}
            onChange={(e) => {
              const p = properties.find((prop) => prop.id === e.target.value);
              setSelectedProperty(p ?? null);
            }}
            className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="">Select a property...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.location_description}
              </option>
            ))}
          </select>
        </div>

        {/* Date and duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="booking-date" className="block text-sm font-medium text-text-primary mb-1">
              Start Date
            </label>
            <input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={minDate}
              required
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
          <div>
            <label htmlFor="booking-end-date" className="block text-sm font-medium text-text-primary mb-1">
              End Date <span className="text-text-light">(optional)</span>
            </label>
            <input
              id="booking-end-date"
              type="date"
              value={bookingEndDate}
              onChange={(e) => setBookingEndDate(e.target.value)}
              min={bookingDate || minDate}
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
          <div>
            <label htmlFor="duration-select" className="block text-sm font-medium text-text-primary mb-1">
              Duration
            </label>
            <select
              id="duration-select"
              value={duration}
              onChange={(e) => setDuration(e.target.value as 'full_day' | 'half_day')}
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="full_day">Full Day</option>
              {selectedProperty?.half_day_allowed && (
                <option value="half_day">Half Day</option>
              )}
            </select>
          </div>
        </div>

        {/* Party size */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="party-size" className="block text-sm font-medium text-text-primary mb-1">
              Anglers (rods)
            </label>
            <input
              id="party-size"
              type="number"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              min={1}
              max={selectedProperty?.max_rods ?? 20}
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
          <div>
            <label htmlFor="non-fishing" className="block text-sm font-medium text-text-primary mb-1">
              Non-fishing guests
            </label>
            <input
              id="non-fishing"
              type="number"
              value={nonFishingGuests}
              onChange={(e) => setNonFishingGuests(parseInt(e.target.value) || 0)}
              min={0}
              max={50}
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="booking-message" className="block text-sm font-medium text-text-primary mb-1">
            Note <span className="text-text-light">(optional)</span>
          </label>
          <textarea
            id="booking-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Any special requests or notes for the property owner..."
            className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !selectedMember || !selectedProperty || !bookingDate}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CalendarDays className="size-4" />
            )}
            Create Booking
          </button>
          {selectedMember && (
            <span className="text-xs text-text-secondary">
              Booking for {selectedMember.display_name}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
