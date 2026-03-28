# Booking Engine Architecture

## Overview

The booking engine is the core transactional system of AnglerPass. It handles availability calculation, booking requests, confirmations, cancellations, and the handoff to payments. The engine must respect per-property constraints (rod limits, blackout dates, member-only windows) while keeping the booking experience simple for anglers.

---

## Booking Types

### Instant Book
The angler selects a date and number of rods, pays immediately, and receives a confirmed booking. No landowner approval step. Suitable for high-volume properties where the landowner trusts the platform to manage access.

Enabled per-property via `properties.instant_book = true`.

### Request to Book
The angler submits a booking request. The landowner receives a notification and has 48 hours to confirm or decline. If no response, the request expires automatically.

This is the default for all properties. Most private water landowners want to vet each booking.

---

## Booking State Machine

```
                                  +---> Completed ---> Reviewed
                                  |
Requested ---> Confirmed ---> [fishing day passes]
    |              |
    |              +---> Cancelled (by angler or landowner)
    |
    +---> Declined (by landowner)
    |
    +---> Expired (48h no response)
```

### States

| State       | Description                                                     |
|-------------|-----------------------------------------------------------------|
| `requested` | Angler submitted request. Awaiting landowner response.          |
| `confirmed` | Landowner approved (or instant book). Payment captured.         |
| `completed` | Fishing day has passed. Eligible for review.                    |
| `reviewed`  | Angler submitted a review. Terminal state.                      |
| `cancelled` | Cancelled by angler or landowner before the fishing day.        |
| `declined`  | Landowner declined the request.                                 |
| `expired`   | Landowner did not respond within 48 hours.                      |

### Transition Rules

| From        | To          | Actor         | Side Effects                                |
|-------------|-------------|---------------|---------------------------------------------|
| requested   | confirmed   | Landowner     | Payment captured, GPS revealed, notification|
| requested   | confirmed   | System        | Instant book: immediate on creation         |
| requested   | declined    | Landowner     | Notification to angler, hold released       |
| requested   | expired     | System (cron) | After 48h, notification to both parties     |
| requested   | cancelled   | Angler        | Hold released                               |
| confirmed   | completed   | System (cron) | Day after fishing date                      |
| confirmed   | cancelled   | Angler        | Refund policy applies                       |
| confirmed   | cancelled   | Landowner     | Full refund to angler, penalty possible      |
| completed   | reviewed    | Angler        | Review submitted                            |

---

## Availability Calculation

Available capacity for a given date is computed as:

```
available_rods(property, date) =
  window_max_rods(property, date)
  - confirmed_bookings_rods(property, date)
  - requested_bookings_rods(property, date)  // held capacity
```

### Step by Step

1. **Find applicable availability window.** Query `availability_windows` where `start_date <= date <= end_date` and (`day_of_week` includes the date's weekday OR `day_of_week` is null).

2. **Check blackout dates.** If `date` exists in `blackout_dates` for this property, availability is zero.

3. **Check member-only restriction.** If the window has `members_only = true`, only anglers with an active `club_membership` linked to the property's club can book.

4. **Count existing bookings.** Sum `num_rods` from `bookings` where `property_id` matches, `booking_date` matches, and `status` in (`confirmed`, `requested`). Requested bookings hold capacity to prevent overselling.

5. **Compute remaining.** `window.max_rods` (or `property.max_rods_per_day` if window does not override) minus the sum from step 4.

### Calendar View

The landowner dashboard shows a calendar where each day is colored:
- **Green**: Available capacity remaining
- **Yellow**: Partially booked
- **Red**: Fully booked or blacked out
- **Gray**: Outside availability windows (property closed)

Anglers see a simplified version: available dates (green) and unavailable dates (gray) with no booking counts.

---

## Constraints & Rules

### Rod Limits
Each property has a `max_rods_per_day` cap. Individual availability windows can override this (e.g., a special event window with fewer rods). The booking form enforces this: if an angler requests 3 rods but only 2 remain, the request is rejected client-side before submission.

### Blackout Dates
Landowners can designate specific dates as blacked out. These override any availability window. Common uses: holidays, maintenance, private use, guided-only days.

### Member-Only Windows
Availability windows can be marked `members_only`. During these windows, only anglers with an active membership in the property's associated club can book. Non-members see these dates as unavailable.

### Guest Allowances
If `properties.guest_allowed = true`, the angler can add up to `properties.max_guests` guests to their booking. Guests count against the rod limit. Guest information (names) is collected at booking time for the liability waiver.

### Property-Specific Rules
The `property_rules` table stores configurable constraints:

| Rule Type           | Example Value | Effect                                   |
|---------------------|---------------|------------------------------------------|
| `min_stay`          | 2             | Minimum consecutive days per booking     |
| `max_stay`          | 7             | Maximum consecutive days per booking     |
| `advance_booking`   | 90            | Must book at least N days in advance     |
| `cancellation_window` | 14          | Free cancellation up to N days before    |

---

## Conflict Resolution

When two anglers request the last available rod on the same date:

**Request-to-book properties:** First request holds capacity. Second request sees reduced availability. If the first is declined, capacity is released and the second can proceed.

**Instant-book properties:** First payment to succeed wins. The booking form checks availability at page load AND at payment time. If capacity changed between those checks, the angler sees an error and can pick another date.

### Race Condition Mitigation

```sql
-- Use advisory lock on property + date to prevent double-booking
SELECT pg_advisory_xact_lock(
  hashtext(property_id::text || booking_date::text)
);

-- Then check availability and insert booking within the same transaction
```

This ensures that concurrent booking attempts for the same property and date are serialized at the database level.

---

## GPS Reveal

Property coordinates (`latitude`, `longitude`) are sensitive. They represent access to private land and are the core value proposition.

**Before confirmed booking:** Angler sees only `location_label` (e.g., "Near Livingston, MT") and a regional map pin (randomized within ~10 miles).

**After confirmed booking:** Angler receives exact GPS coordinates, access instructions, and gate codes (if applicable) via a secure booking detail page. This information is only available for the booking date window (day before through day after).

**After booking completes:** GPS access is revoked. The angler must book again to access coordinates.

---

## Calendar Sync (Future)

Layer 3 will add iCal export so landowners can sync their booking calendar with Google Calendar, Apple Calendar, or other tools. The feed URL will be authenticated via a per-user token in the query string. Changes to bookings will update the feed within 5 minutes.

Importing external calendars (e.g., to auto-block dates from Airbnb) is a stretch goal.

---

## Implementation Notes

- **Bookings are per-day, not per-range.** A 3-day trip creates 3 booking rows sharing a `booking_group_id`. This simplifies availability math and allows partial cancellations.
- **Timezone handling.** All booking dates are stored as `date` (no time component). The property's state/region determines the relevant timezone for cutoff calculations (e.g., "day of fishing" ends at 11:59 PM in the property's timezone).
- **Cron jobs.** Two scheduled jobs run daily: (1) expire pending requests older than 48h, (2) transition confirmed bookings to completed after the fishing date passes.
- **Notifications at every transition.** Every state change triggers a notification to the relevant parties. See [notifications.md](./notifications.md).
