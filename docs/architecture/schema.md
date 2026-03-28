# Database Schema Direction

## Overview

AnglerPass uses Supabase (PostgreSQL) with Row Level Security on every table. All primary keys are UUIDs. All timestamps use `timestamptz`. Major entities support soft deletes via an `archived` or `status` field rather than hard `DELETE`.

---

## Current Schema (Layer 1)

### leads
Pre-launch capture for waitlist, investor, and contact form submissions.

| Column        | Type        | Notes                                    |
|---------------|-------------|------------------------------------------|
| id            | uuid PK     | `gen_random_uuid()`                      |
| first_name    | text        | NOT NULL                                 |
| last_name     | text        |                                          |
| email         | text        | NOT NULL, unique per `type`              |
| interest_type | text        | landowner, club, angler, investor, other |
| type          | text        | waitlist, investor, contact              |
| message       | text        |                                          |
| source        | text        | Default `homepage`                       |
| created_at    | timestamptz |                                          |

RLS: No public policies. Accessed via service-role key only.

### profiles
Linked 1:1 to `auth.users`. Auto-created on signup via trigger.

| Column       | Type        | Notes                                 |
|--------------|-------------|---------------------------------------|
| id           | uuid PK     | FK to `auth.users`, CASCADE on delete |
| display_name | text        |                                       |
| role         | text        | landowner, club_admin, angler, admin  |
| created_at   | timestamptz |                                       |
| updated_at   | timestamptz | Auto-set via trigger                  |

RLS: Users can read and update their own profile.

### properties (stub)
Minimal table to support Layer 1 dashboard. Will be expanded significantly in Layer 2.

| Column     | Type        | Notes                                      |
|------------|-------------|--------------------------------------------|
| id         | uuid PK     |                                            |
| owner_id   | uuid FK     | References `profiles.id`, CASCADE          |
| name       | text        | NOT NULL                                   |
| status     | text        | draft, pending_review, published, archived |
| created_at | timestamptz |                                            |
| updated_at | timestamptz | Auto-set via trigger                       |

RLS: Enabled, policies TBD in Layer 2.

### audit_log
Append-only log of significant actions across the platform.

| Column      | Type        | Notes                             |
|-------------|-------------|-----------------------------------|
| id          | bigserial   | PK                                |
| actor_id    | uuid        | Nullable (system actions)         |
| action      | text        | NOT NULL, e.g. `property.created` |
| entity_type | text        | NOT NULL, e.g. `property`         |
| entity_id   | uuid        |                                   |
| old_data    | jsonb       | Previous state for diff review    |
| new_data    | jsonb       | New state                         |
| created_at  | timestamptz |                                   |

RLS: Enabled. Admin-only read access. No public write -- inserts via service-role or DB triggers.

---

## Planned Layer 2 Tables

### properties (expanded)

Extends the stub with full listing data.

| Column            | Type        | Notes                                                    |
|-------------------|-------------|----------------------------------------------------------|
| id                | uuid PK     | Existing                                                 |
| owner_id          | uuid FK     | Existing, references `profiles.id`                       |
| name              | text        | Existing                                                 |
| slug              | text        | URL-safe unique identifier                               |
| status            | text        | Existing, add `rejected`                                 |
| description       | text        | Long-form listing description                            |
| location_label    | text        | Human-readable, e.g. "Near Livingston, MT"               |
| latitude          | numeric     | Exact coords hidden until booking confirmed              |
| longitude         | numeric     |                                                          |
| acreage           | numeric     |                                                          |
| river_miles       | numeric     | Miles of fishable water                                  |
| max_rods_per_day  | int         | Daily capacity                                           |
| pricing_type      | text        | per_rod, per_day, per_group, membership_only             |
| price_cents       | int         | Price in cents (avoid float rounding)                    |
| currency          | text        | Default `usd`                                            |
| amenities         | jsonb       | Array of amenity slugs                                   |
| regulations       | text        | Catch-and-release rules, gear restrictions               |
| instant_book      | boolean     | Default false                                            |
| guest_allowed     | boolean     | Can booked angler bring guests?                          |
| max_guests        | int         |                                                          |
| cover_image_url   | text        |                                                          |
| archived_at       | timestamptz | Soft delete timestamp                                    |
| published_at      | timestamptz | When listing went live                                   |
| created_at        | timestamptz |                                                          |
| updated_at        | timestamptz |                                                          |

### property_media

| Column      | Type        | Notes                               |
|-------------|-------------|-------------------------------------|
| id          | uuid PK     |                                     |
| property_id | uuid FK     | References `properties.id`          |
| url         | text        | Supabase Storage path               |
| type        | text        | photo, video, map                   |
| caption     | text        |                                     |
| sort_order  | int         |                                     |
| moderation  | text        | pending, approved, rejected         |
| created_at  | timestamptz |                                     |

### property_rules

Per-property configurable constraints that feed into the booking engine.

| Column        | Type        | Notes                                          |
|---------------|-------------|-------------------------------------------------|
| id            | uuid PK     |                                                 |
| property_id   | uuid FK     |                                                 |
| rule_type     | text        | min_stay, max_stay, advance_booking, cancellation_window |
| value_int     | int         | For numeric rules                              |
| value_text    | text        | For text-based rules                           |
| created_at    | timestamptz |                                                 |

### water_types

Lookup table for categorizing water on a property.

| Column      | Type    | Notes                                  |
|-------------|---------|----------------------------------------|
| id          | uuid PK |                                        |
| label       | text    | e.g. "Spring Creek", "Tailwater"       |
| slug        | text    | URL-safe                               |

### property_water_types (join table)

| Column        | Type    |
|---------------|---------|
| property_id   | uuid FK |
| water_type_id | uuid FK |

Composite PK on both columns.

### species

| Column | Type    | Notes                           |
|--------|---------|---------------------------------|
| id     | uuid PK |                                 |
| name   | text    | e.g. "Brown Trout", "Rainbow"   |
| slug   | text    |                                 |

### property_species (join table)

| Column      | Type    |
|-------------|---------|
| property_id | uuid FK |
| species_id  | uuid FK |

Composite PK on both columns.

### bookings

| Column           | Type        | Notes                                                    |
|------------------|-------------|----------------------------------------------------------|
| id               | uuid PK     |                                                          |
| property_id      | uuid FK     |                                                          |
| angler_id        | uuid FK     | References `profiles.id`                                 |
| status           | text        | requested, confirmed, completed, cancelled, declined     |
| booking_date     | date        | The fishing day                                          |
| num_rods         | int         | Number of rods booked                                    |
| num_guests       | int         |                                                          |
| total_cents      | int         |                                                          |
| platform_fee     | int         | AnglerPass cut in cents                                  |
| special_requests | text        |                                                          |
| confirmed_at     | timestamptz |                                                          |
| cancelled_at     | timestamptz |                                                          |
| cancellation_reason | text     |                                                          |
| created_at       | timestamptz |                                                          |
| updated_at       | timestamptz |                                                          |

### availability_windows

Recurring or one-off windows when a property is open for booking.

| Column      | Type        | Notes                                |
|-------------|-------------|--------------------------------------|
| id          | uuid PK     |                                      |
| property_id | uuid FK     |                                      |
| start_date  | date        |                                      |
| end_date    | date        |                                      |
| day_of_week | int[]       | 0=Sun..6=Sat, null = every day       |
| max_rods    | int         | Override property default for window |
| members_only| boolean     | Default false                        |
| created_at  | timestamptz |                                      |

### blackout_dates

| Column      | Type        | Notes               |
|-------------|-------------|----------------------|
| id          | uuid PK     |                      |
| property_id | uuid FK     |                      |
| date        | date        |                      |
| reason      | text        | Optional             |
| created_at  | timestamptz |                      |

### memberships (club tiers)

| Column          | Type        | Notes                            |
|-----------------|-------------|----------------------------------|
| id              | uuid PK     |                                  |
| club_profile_id | uuid FK     | The club_admin's profile         |
| name            | text        | e.g. "Gold Member"               |
| description     | text        |                                  |
| price_cents     | int         | Annual or monthly                |
| billing_period  | text        | monthly, annually                |
| max_members     | int         | Cap, null = unlimited            |
| benefits        | jsonb       |                                  |
| stripe_price_id | text        |                                  |
| created_at      | timestamptz |                                  |
| updated_at      | timestamptz |                                  |

### club_memberships (join: user to club tier)

| Column        | Type        | Notes                           |
|---------------|-------------|---------------------------------|
| id            | uuid PK     |                                 |
| membership_id | uuid FK     | References `memberships.id`     |
| angler_id     | uuid FK     | References `profiles.id`        |
| status        | text        | pending, active, expired, cancelled |
| started_at    | timestamptz |                                 |
| expires_at    | timestamptz |                                 |
| stripe_sub_id | text        |                                 |
| created_at    | timestamptz |                                 |

### payments

| Column            | Type        | Notes                                  |
|-------------------|-------------|----------------------------------------|
| id                | uuid PK     |                                        |
| booking_id        | uuid FK     | Nullable (memberships use this too)    |
| club_membership_id| uuid FK     | Nullable                               |
| payer_id          | uuid FK     |                                        |
| amount_cents      | int         |                                        |
| platform_fee_cents| int         |                                        |
| currency          | text        |                                        |
| stripe_payment_id | text        |                                        |
| status            | text        | pending, succeeded, failed, refunded   |
| created_at        | timestamptz |                                        |

### payouts

| Column            | Type        | Notes                                  |
|-------------------|-------------|----------------------------------------|
| id                | uuid PK     |                                        |
| recipient_id      | uuid FK     | Landowner or club profile              |
| amount_cents      | int         |                                        |
| stripe_transfer_id| text        |                                        |
| status            | text        | pending, paid, failed                  |
| period_start      | date        |                                        |
| period_end        | date        |                                        |
| created_at        | timestamptz |                                        |

### reviews

| Column      | Type        | Notes                             |
|-------------|-------------|-----------------------------------|
| id          | uuid PK     |                                   |
| booking_id  | uuid FK     | One review per booking            |
| reviewer_id | uuid FK     | The angler                        |
| property_id | uuid FK     |                                   |
| rating      | int         | 1-5                               |
| body        | text        |                                   |
| moderation  | text        | pending, approved, rejected       |
| created_at  | timestamptz |                                   |

### documents

| Column         | Type        | Notes                                   |
|----------------|-------------|-----------------------------------------|
| id             | uuid PK     |                                         |
| type           | text        | waiver, regulation, agreement, bylaws   |
| title          | text        |                                         |
| storage_path   | text        | Supabase Storage bucket path            |
| version        | int         | Incrementing                            |
| property_id    | uuid FK     | Nullable (some are platform-wide)       |
| membership_id  | uuid FK     | Nullable                                |
| requires_signature | boolean |                                         |
| created_at     | timestamptz |                                         |

### document_signatures

| Column      | Type        | Notes                         |
|-------------|-------------|-------------------------------|
| id          | uuid PK     |                               |
| document_id | uuid FK     |                               |
| signer_id   | uuid FK     |                               |
| signed_at   | timestamptz |                               |
| ip_address  | inet        | For audit purposes            |
| signature_data | text     | Signature image or hash       |

### notifications

| Column      | Type        | Notes                                   |
|-------------|-------------|-----------------------------------------|
| id          | uuid PK     |                                         |
| user_id     | uuid FK     |                                         |
| channel     | text        | email, sms, in_app                      |
| type        | text        | e.g. `booking.confirmed`                |
| title       | text        |                                         |
| body        | text        |                                         |
| metadata    | jsonb       | Structured payload for deep links       |
| read_at     | timestamptz | Null = unread                           |
| sent_at     | timestamptz |                                         |
| created_at  | timestamptz |                                         |

---

## Relationships Diagram (Text)

```
auth.users
  |
  +--< profiles (1:1)
         |
         +--< properties (owner_id)
         |      |
         |      +--< property_media
         |      +--< property_rules
         |      +--< availability_windows
         |      +--< blackout_dates
         |      +--< bookings
         |      |      |
         |      |      +--< payments
         |      |      +--< reviews (1:1 per booking)
         |      |
         |      +-->< water_types (via property_water_types)
         |      +-->< species (via property_species)
         |      +--< documents (property-scoped)
         |
         +--< memberships (club_profile_id, for club_admin users)
         |      |
         |      +--< club_memberships (angler joins club tier)
         |      |      +--< payments
         |      |
         |      +--< documents (membership-scoped)
         |
         +--< bookings (angler_id)
         +--< reviews (reviewer_id)
         +--< payments (payer_id)
         +--< payouts (recipient_id)
         +--< document_signatures (signer_id)
         +--< notifications (user_id)

audit_log (standalone, references any entity by type + id)
leads (standalone, pre-auth)
```

---

## Key Schema Decisions

1. **UUID primary keys everywhere.** Avoids sequential ID enumeration. Safe for client-side generation when needed.

2. **`timestamptz` for all timestamps.** Postgres stores UTC internally; display conversion happens in the app layer. No ambiguity across time zones.

3. **RLS on every table.** Even tables that are currently admin-only have RLS enabled with no public policies, enforcing defense-in-depth. New policies are added per feature.

4. **Soft deletes on major entities.** Properties use `status = 'archived'` and `archived_at`. Bookings use `cancelled_at`. Club memberships use `status = 'cancelled'`. Hard deletes are reserved for GDPR/data-deletion requests processed via admin tooling.

5. **Money stored as integers (cents).** Avoids floating-point rounding. All `*_cents` columns are `int`. Formatting to dollars happens in the UI.

6. **JSONB for flexible data.** Amenities, membership benefits, and notification metadata use `jsonb` to avoid premature normalization while keeping queryability.

7. **Audit log captures diffs.** `old_data` and `new_data` as `jsonb` enable before/after comparison for moderation review and rollback support.

8. **Composite foreign keys for join tables.** `property_water_types` and `property_species` use composite PKs rather than a surrogate UUID to prevent duplicates at the DB level.
