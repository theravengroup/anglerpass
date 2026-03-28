# Notifications Architecture

## Overview

AnglerPass sends notifications across three channels: email, SMS, and in-app. Notifications are triggered by platform events (booking confirmations, moderation results, payment receipts) and delivered based on user preferences.

---

## Channels

| Channel | Provider | Use Case                                    | Priority |
|---------|----------|---------------------------------------------|----------|
| In-app  | Supabase | All notifications, read/unread tracking     | Default  |
| Email   | Resend   | Booking confirmations, payment receipts, moderation | Primary |
| SMS     | Twilio   | Time-sensitive: booking day reminders, urgent cancellations | Opt-in |

### Channel Selection Logic

Every notification event has a default channel set. Users can override via preferences:

1. **In-app**: Always created for every notification. This is the system of record.
2. **Email**: Sent for all transactional events unless the user disables email notifications for that category.
3. **SMS**: Only sent for events the user has opted into SMS for, and only if they have a verified phone number.

---

## Trigger Events

### Booking Lifecycle

| Event                    | Notify          | Channels          |
|--------------------------|-----------------|--------------------|
| Booking requested        | Landowner       | In-app, email      |
| Booking confirmed        | Angler          | In-app, email, SMS |
| Booking declined         | Angler          | In-app, email      |
| Booking expired (48h)    | Both            | In-app, email      |
| Booking cancelled (angler)| Landowner      | In-app, email      |
| Booking cancelled (landowner)| Angler      | In-app, email, SMS |
| Fishing day reminder (1 day before) | Angler | In-app, email, SMS |
| Booking completed        | Angler          | In-app, email      |
| Review submitted         | Landowner       | In-app, email      |

### Payments

| Event                    | Notify          | Channels          |
|--------------------------|-----------------|--------------------|
| Payment captured         | Angler          | In-app, email      |
| Payout sent              | Landowner/Club  | In-app, email      |
| Payment failed           | Angler          | In-app, email, SMS |
| Refund issued            | Angler          | In-app, email      |

### Memberships

| Event                    | Notify          | Channels          |
|--------------------------|-----------------|--------------------|
| Membership application   | Club admin      | In-app, email      |
| Membership approved      | Angler          | In-app, email      |
| Membership renewal       | Angler          | In-app, email      |
| Membership expiring soon | Angler          | In-app, email      |
| Membership cancelled     | Club admin      | In-app, email      |

### Moderation

| Event                    | Notify          | Channels          |
|--------------------------|-----------------|--------------------|
| Content submitted        | Admin team      | In-app, email      |
| Content approved         | Author          | In-app, email      |
| Content rejected         | Author          | In-app, email      |

### Account

| Event                    | Notify          | Channels          |
|--------------------------|-----------------|--------------------|
| Welcome (signup)         | User            | Email              |
| Password reset           | User            | Email              |
| Document requires signature | User         | In-app, email      |

---

## Template System

Email and SMS notifications use templates stored as code (not in the database). Each template is a function that accepts a typed payload and returns rendered content.

### Template Structure

```
src/lib/notifications/
  templates/
    booking-confirmed.tsx    -- React Email template
    booking-requested.tsx
    payment-receipt.tsx
    ...
  sms/
    booking-confirmed.ts     -- Plain text SMS
    ...
  channels/
    email.ts                 -- Resend send logic
    sms.ts                   -- Twilio send logic
    in-app.ts                -- DB insert logic
  dispatcher.ts              -- Routes events to channels
  types.ts                   -- Event type definitions
```

### Email Templates

Built with [React Email](https://react.email) for type-safe, component-based email templates. Each template receives a strongly-typed props object:

```typescript
interface BookingConfirmedPayload {
  anglerName: string;
  propertyName: string;
  bookingDate: string;
  numRods: number;
  totalFormatted: string;
  accessInstructionsUrl: string;
}
```

### SMS Templates

Plain text with variable interpolation. Kept under 160 characters for single-segment delivery:

```
AnglerPass: Your booking at {propertyName} on {date} is confirmed. Details: {url}
```

---

## User Preferences

Stored in a `notification_preferences` table (or a `preferences` jsonb column on `profiles`):

```typescript
interface NotificationPreferences {
  email: {
    booking_updates: boolean;   // default true
    payment_receipts: boolean;  // default true
    membership_updates: boolean;// default true
    marketing: boolean;         // default false
  };
  sms: {
    booking_reminders: boolean; // default false
    urgent_cancellations: boolean; // default false
  };
}
```

Users manage preferences from `/dashboard/settings`. The platform respects CAN-SPAM and TCPA requirements:
- Marketing emails require opt-in
- SMS requires explicit opt-in and verified phone number
- Transactional emails (payment receipts, booking confirmations) cannot be fully disabled but can be reduced to in-app only
- Every email includes an unsubscribe link

---

## Delivery Tracking

Each notification row in the `notifications` table tracks delivery state:

| Field      | Purpose                                    |
|------------|--------------------------------------------|
| `sent_at`  | When the notification was dispatched        |
| `read_at`  | When the user opened/read it (in-app only) |
| `metadata` | Delivery IDs from Resend/Twilio for debugging |

For email, Resend provides delivery webhooks (delivered, bounced, complained). These update a `delivery_status` field on the notification row for monitoring.

Failed deliveries are retried up to 3 times with exponential backoff (1 min, 5 min, 30 min).

---

## Batch vs Real-Time

| Delivery Mode | Use Case                                      |
|---------------|-----------------------------------------------|
| Real-time     | Booking confirmations, payment events, cancellations |
| Batched       | Daily digest of new booking requests (for busy landowners), weekly membership summaries |

### Real-Time Delivery

Event triggers immediately dispatch to all channels. The notification dispatcher runs in the API route handler or Stripe webhook handler that processes the event.

### Batched Delivery (Future)

A daily cron job aggregates events and sends a single digest email:
- "You have 3 new booking requests"
- "2 bookings completed this week"
- "Your payout of $X was sent"

Users can switch between real-time and digest mode per notification category.

---

## In-App Notification UI

The dashboard topbar shows an unread notification count (bell icon with badge). Clicking opens a dropdown with recent notifications, each linking to the relevant entity (booking detail, property listing, payment receipt).

Notifications are paginated and loaded on demand. Marking as read happens on click (navigating to the linked entity) or via a "Mark all as read" action.

Real-time updates use Supabase Realtime subscriptions on the `notifications` table filtered by `user_id`.

---

## Implementation Notes

- **Notification dispatcher is a single entry point.** All events go through `dispatcher.ts`, which determines channels and renders templates. Individual feature code calls `notify(event, payload)` and does not deal with channels directly.
- **No external notification service for Layer 2.** In-app notifications are DB rows. Email is Resend. SMS is Twilio. If volume grows, migrating to a service like Knock or Novu is straightforward because the dispatcher pattern abstracts channel logic.
- **Idempotency.** Each notification has a composite key of `(user_id, type, entity_id)` to prevent duplicate notifications for the same event. The dispatcher checks for existing notifications before creating new ones.
- **Rate limiting.** SMS is limited to 1 message per event per user per hour. Email is limited to 10 per user per hour. In-app has no limit.
