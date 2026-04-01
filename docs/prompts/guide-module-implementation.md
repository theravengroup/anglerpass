# Guide Module — Full Implementation Prompt

> This prompt describes the complete "For Guides" module for AnglerPass. Implement every section below in the order presented. Each section is self-contained but depends on the sections before it. Read the entire prompt before starting. Refer to CLAUDE.md for project conventions (styling, Supabase client discipline, route groups, etc.).

---

## 0. Pre-Requisites & Structural Changes

### 0a. Add "guide" to the role system

The multi-role system already exists (`supabase/migrations/00016_multi_role.sql`, `src/components/shared/RoleSwitcher.tsx`, `src/app/api/profile/role/route.ts`). The `profiles` table has a `role` column (active role) and a `roles` text array (all roles a user holds).

**Changes needed:**

1. **New migration**: ALTER the `role` column check constraint on `profiles` to include `'guide'`:
   ```
   ('landowner', 'club_admin', 'angler', 'admin', 'guide')
   ```
2. **`src/types/roles.ts`**: Add `'guide'` to the `UserRole` type and `ROLE_HOME_PATHS`:
   ```
   guide → /guide
   ```
3. **`src/components/shared/RoleSwitcher.tsx`**: Add `'guide'` to the addable roles list with appropriate label and description (e.g., "Become a Guide — Offer guided fishing trips on AnglerPass").
4. **`src/app/(dashboard)/layout.tsx`**: Add `ROLE_ITEMS` for the guide role:
   - Dashboard → `/guide` (home)
   - My Profile → `/guide/profile`
   - Availability → `/guide/availability`
   - Bookings → `/guide/bookings`
   - Reviews → `/guide/reviews`
   - Messages → `/guide/messages`
   - Earnings → `/guide/earnings`
5. **`middleware.ts`**: Add `/guide` to the list of protected routes.
6. **`src/app/(dashboard)/dashboard/page.tsx`**: Add `ROLE_STEPS` for the guide getting-started flow:
   1. Complete your guide profile
   2. Upload credentials (license, insurance, First Aid)
   3. Set your pricing and availability
   4. Request water approvals from clubs
   5. Wait for admin review → go live

### 0b. Instant-Book — Remove landowner approval requirement

**This is a structural change to the existing booking system.** Currently, all bookings start as `'pending'` and require landowner confirmation. The new model: if the water is available and the angler has an active club membership with access, the booking is confirmed immediately.

**Changes needed:**

1. **`src/app/api/bookings/route.ts` (POST handler)**: Change the booking insert to set `status: 'confirmed'` and `confirmed_at: new Date().toISOString()` instead of `status: 'pending'`.

2. **`src/app/api/bookings/[id]/route.ts` (PATCH handler)**: Remove the landowner confirm/decline logic entirely. Landowners no longer approve bookings. Keep:
   - Angler cancellation (unchanged)
   - Admin override capability (if needed)

3. **`src/lib/notifications.ts`**:
   - Change `notifyBookingRequested()` → `notifyBookingCreated()`. The landowner still gets notified that a booking was made (informational, not action-required). Update the email subject from "New Booking Request" to "New Booking on [Property Name]" and remove the approve/decline CTA.
   - `notifyBookingConfirmed()` is now called immediately on creation (to the angler). Update copy to reflect instant confirmation: "Your booking is confirmed!" instead of "Your booking has been approved."
   - Remove `notifyBookingDeclined()` — no longer applicable.

4. **`src/app/(dashboard)/landowner/bookings/page.tsx`**: Remove the pending/approve/decline UI. Landowner bookings page becomes read-only: shows upcoming confirmed bookings and past bookings. No action buttons needed.

5. **`src/app/(dashboard)/angler/bookings/page.tsx`**: Remove any "pending" state UI. Bookings go straight to confirmed.

6. **`src/lib/validations/bookings.ts`**: Remove `bookingStatusSchema` (the confirm/decline schema) or mark deprecated.

7. **Update the refund preview endpoint** (`/api/bookings/[id]/refund-preview`): Since bookings are instantly confirmed, cancellation refund tiers always apply (no more "free cancel because it's still pending" path).

8. **`src/app/(marketing)/policies/page.tsx`**: Update the booking section to reflect instant-book. Remove references to landowner approval or request-to-book.

---

## 1. Database Schema

Create a single migration file `supabase/migrations/00027_guides.sql` with the following:

### 1a. `guide_profiles` table

Stores the guide's professional profile, separate from the user's base `profiles` record.

```sql
create table public.guide_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,

  -- Display
  display_name text not null,
  bio text,
  profile_photo_url text,
  photos text[] default '{}',

  -- Service details
  techniques text[] default '{}',
  -- values: 'walk_wade', 'drift_boat', 'raft', 'euro_nymphing', 'streamer', 'dry_fly', 'wet_fly', 'tenkara', 'bass', 'stillwater'
  species text[] default '{}',
  skill_levels text[] default '{}',
  -- values: 'beginner', 'intermediate', 'advanced'
  max_anglers int not null default 2,
  gear_included boolean not null default true,
  gear_details text,
  languages text[] default '{English}',

  -- Location
  base_location text,
  service_region text,
  closest_airports text,

  -- Pricing (guide sets their own rates — AnglerPass adds 10% service fee on top)
  rate_full_day numeric(10,2),
  rate_half_day numeric(10,2),
  rate_description text,  -- optional note like "Includes lunch" or "Drift boat trips start at $X"

  -- Availability
  lead_time_days int not null default 1,  -- minimum days in advance to book

  -- Credentials (uploaded documents — paths in Supabase Storage)
  license_url text,
  license_state text,
  license_expiry date,
  insurance_url text,
  insurance_expiry date,
  insurance_amount text,  -- e.g. "$1M/$2M"
  first_aid_cert_url text,
  first_aid_expiry date,
  uscg_license_url text,
  uscg_license_expiry date,
  has_motorized_vessel boolean not null default false,

  -- Vetting status
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'suspended', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  rejection_reason text,
  suspended_reason text,

  -- Stats (denormalized for performance)
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  trips_completed int default 0,
  cancellation_rate numeric(5,2) default 0,
  response_time_hours numeric(5,1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS: Guide can read/update own profile. Club admins can read approved guide profiles. Anglers can read approved guide profiles. Admins can read/update all.

### 1b. `guide_water_approvals` table

Which guides are approved to operate on which waters. Club admins manage these.

```sql
create table public.guide_water_approvals (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'revoked')),

  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decline_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(guide_id, property_id)
);
```

RLS: Guide can read own approvals and create requests. Club admins (for the relevant club) can read and update. Admins can read all.

### 1c. `guide_club_affiliations` table

Optional affiliations — "Preferred Guide for Rocky Mountain Angling Club."

```sql
create table public.guide_club_affiliations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked')),

  label text default 'Affiliated Guide',  -- e.g. "Preferred Guide", "Head Guide"

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(guide_id, club_id)
);
```

### 1d. `guide_availability` table

Guides set their available dates. Blocked dates are NOT shown to anglers.

```sql
create table public.guide_availability (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  date date not null,
  status text not null default 'available'
    check (status in ('available', 'blocked', 'booked')),
  booking_id uuid references public.bookings(id) on delete set null,

  created_at timestamptz not null default now(),

  unique(guide_id, date)
);
```

### 1e. Modify `bookings` table

Add guide-related columns to the existing bookings table:

```sql
alter table public.bookings
  add column if not exists guide_id uuid references public.guide_profiles(id) on delete set null,
  add column if not exists guide_rate numeric(10,2) default 0,
  add column if not exists guide_service_fee numeric(10,2) default 0,
  add column if not exists guide_payout numeric(10,2) default 0;
```

Update `total_amount` calculation to include guide costs:
`total_amount = base_rate + platform_fee + cross_club_fee + guide_rate + guide_service_fee`

### 1f. `reviews` table

Airbnb-style mutual reviews with simultaneous reveal.

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  -- Who wrote it and who it's about
  reviewer_id uuid not null references public.profiles(id),
  reviewer_role text not null check (reviewer_role in ('angler', 'guide')),
  subject_id uuid not null references public.profiles(id),
  subject_role text not null check (subject_role in ('angler', 'guide')),

  -- Content
  rating int not null check (rating between 1 and 5),
  title text,
  body text,

  -- Reveal logic
  is_revealed boolean not null default false,
  -- A review is revealed when BOTH sides have submitted, or after the review window closes

  -- Review window
  review_window_closes_at timestamptz not null,
  -- Typically 14 days after booking_date

  created_at timestamptz not null default now(),

  unique(booking_id, reviewer_role)
  -- Each role can only leave one review per booking
);
```

RLS: Users can create reviews where they are the reviewer. Users can read reviews where `is_revealed = true`. Admins can read all.

### 1g. `messages` table

In-app messaging between angler/guide and guide/club.

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,  -- groups messages in a conversation
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),

  body text not null,
  read_at timestamptz,

  -- Optional booking context
  booking_id uuid references public.bookings(id) on delete set null,

  created_at timestamptz not null default now()
);

create index idx_messages_thread on public.messages(thread_id);
create index idx_messages_recipient on public.messages(recipient_id, read_at);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_booking on public.messages(booking_id);

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id),
  participant_b uuid not null references public.profiles(id),

  -- Optional context
  booking_id uuid references public.bookings(id) on delete set null,

  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique(participant_a, participant_b, booking_id)
);
```

RLS: Users can read/create messages where they are sender or recipient. Same for threads where they are a participant.

### 1h. Platform settings additions

```sql
insert into public.platform_settings (key, value, description) values
  ('guide_service_fee_pct', '10', 'Service fee percentage added to guide rates on bookings (paid by angler)'),
  ('guide_review_window_days', '14', 'Number of days after a trip that reviews can be submitted'),
  ('guide_min_insurance_amount', '1000000', 'Minimum liability insurance per-occurrence amount required for guides')
on conflict (key) do nothing;
```

---

## 2. Fee Constants

**`src/lib/constants/fees.ts`**: Add guide fee constant and update `FeeBreakdown` interface and `calculateFeeBreakdown()`.

```typescript
/** 10% service fee on guide rates, paid by the angler to AnglerPass. */
export const GUIDE_SERVICE_FEE_RATE = 0.10;
```

Update the `FeeBreakdown` interface to include:
```typescript
/** Guide's day rate (full or half day), $0 if no guide */
guideRate: number;
/** Guide service fee (10% of guideRate), paid by angler to AnglerPass */
guideServiceFee: number;
/** Guide payout (guideRate — guide keeps 100%) */
guidePayout: number;
```

Update `calculateFeeBreakdown()` to accept an optional `guideRate` parameter:
```typescript
export function calculateFeeBreakdown(
  ratePerRod: number,
  rodCount: number,
  isCrossClub: boolean = false,
  guideRate: number = 0
): FeeBreakdown
```

Total = baseRate + platformFee + crossClubFee + guideRate + guideServiceFee.

---

## 3. API Routes

### 3a. Guide Profile CRUD

**`src/app/api/guides/profile/route.ts`**

- `GET` — Fetch current user's guide profile (or 404 if not a guide).
- `POST` — Create guide profile. Adds 'guide' to user's `roles` array if not present. Sets `status: 'draft'`.
- `PATCH` — Update guide profile fields. If all required fields + credentials are complete, allow setting `status: 'pending_review'`.

### 3b. Guide Credential Upload

**`src/app/api/guides/credentials/route.ts`**

- `POST` — Upload credential document to Supabase Storage (`guides/credentials/{userId}/{type}`). Returns the public URL. Types: `license`, `insurance`, `first_aid`, `uscg_license`.

### 3c. Guide Water Approvals

**`src/app/api/guides/water-approvals/route.ts`**

- `GET` — List guide's water approval statuses.
- `POST` — Request approval for a property. Requires `property_id` and `club_id`. Creates a pending record and notifies the club admin.

**`src/app/api/clubs/[id]/guide-approvals/route.ts`**

- `GET` — List pending/approved guide requests for this club's waters (club admin view).
- `PATCH` — Approve or decline a guide request. Notifies the guide.

### 3d. Guide Availability

**`src/app/api/guides/availability/route.ts`**

- `GET` — Fetch guide's availability for a date range.
- `PUT` — Bulk set dates as available or blocked. Accepts `{ dates: string[], status: 'available' | 'blocked' }`.

### 3e. Guide Discovery (for booking add-on flow)

**`src/app/api/guides/match/route.ts`**

Called during the booking flow to find eligible guides.

- `GET ?property_id=X&date=YYYY-MM-DD&party_size=N&duration=full_day`
- Returns guides that are:
  1. `status = 'approved'` on their guide profile
  2. Have an approved `guide_water_approval` for this property
  3. Available on the requested date (not blocked or booked)
  4. `max_anglers >= party_size`
- Sorted by: rating (descending), trips completed, response time
- Returns: guide profile summary, rates, rating, techniques, species, availability confirmation

### 3f. Guide Public Profile

**`src/app/api/guides/[id]/route.ts`**

- `GET` — Public-facing guide profile for display on the booking page. Only returns approved guides. Includes: bio, photos, techniques, species, ratings, review excerpts, waters they guide on.

### 3g. Booking Route Updates

**`src/app/api/bookings/route.ts` (POST)**:

Extend the booking creation to accept an optional `guide_id`:

1. If `guide_id` is provided:
   - Verify guide profile exists and `status = 'approved'`
   - Verify guide has an approved `guide_water_approval` for this property
   - Verify guide is available on the booking date
   - Calculate guide fees: `guideRate` (full or half day based on `duration`), `guideServiceFee` (10%), `guidePayout` (= guideRate)
   - Mark the guide's availability as `'booked'` for that date with the `booking_id`
   - Include guide fees in `total_amount`
2. Set `status: 'confirmed'` and `confirmed_at` immediately (instant-book).
3. Send notifications: angler gets confirmation, landowner gets booking notice, guide gets booking notice.

### 3h. Reviews

**`src/app/api/reviews/route.ts`**

- `POST` — Submit a review. Validate: booking exists, booking is completed (date has passed), user is the angler or guide on the booking, review window hasn't closed, user hasn't already reviewed this booking.
  - After both sides submit, set `is_revealed = true` on both reviews.
  - After review window closes, a scheduled job (or on-read check) reveals any submitted reviews.
  - After creating/revealing, recalculate guide's `rating_avg` and `rating_count`.

- `GET ?guide_id=X` — Fetch revealed reviews for a guide (public).
- `GET ?booking_id=X` — Fetch reviews for a booking (only if revealed or user is a participant).

### 3i. Messaging

**`src/app/api/messages/route.ts`**

- `GET` — List user's message threads, ordered by `last_message_at` descending. Include unread count per thread.
- `POST` — Send a message. Creates thread if none exists. Updates `last_message_at`. Only allow messaging between:
  - Angler and guide (if they share a booking, or guide has approved water the angler can access)
  - Guide and club admin (if guide has a water approval request or affiliation with that club)

**`src/app/api/messages/[threadId]/route.ts`**

- `GET` — Fetch messages in a thread (paginated). Mark unread messages as read.
- `POST` — Send a message to this thread.

### 3j. Admin Guide Management

**`src/app/api/admin/guides/route.ts`**

- `GET` — List all guide profiles with filters (status, pending review, etc.).
- `PATCH` — Approve, reject, or suspend a guide. Sets `approved_at`, `approved_by`, `rejection_reason`, or `suspended_reason`.

---

## 4. Guide Dashboard Pages

All guide pages go in `src/app/(dashboard)/guide/`.

### 4a. Guide Home — `/guide/page.tsx`

Dashboard overview:
- Upcoming bookings (next 7 days)
- Quick stats: trips completed, rating, earnings this month, pending approvals
- Profile completion indicator (if draft/pending)
- Unread messages count

### 4b. Guide Profile — `/guide/profile/page.tsx`

Multi-step profile editor:
1. **Basic Info**: display name, bio, profile photo, additional photos
2. **Services**: techniques, species, skill levels, max anglers, gear included/details, languages
3. **Location**: base location, service region, closest airports
4. **Pricing**: full-day rate, half-day rate, rate description
5. **Credentials**: license upload + state + expiry, insurance upload + expiry + amount, First Aid upload + expiry, USCG license (conditional on `has_motorized_vessel`)

Show profile status badge (draft, pending review, approved, suspended, rejected) prominently.

"Submit for Review" button that sets `status: 'pending_review'` — only enabled when all required fields and blocking credentials are complete.

### 4c. Guide Availability — `/guide/availability/page.tsx`

Calendar view (month grid). Guide can:
- Click dates to toggle available/blocked
- Drag to select ranges
- See booked dates (non-editable, linked to bookings)
- Default: all dates available unless explicitly blocked

### 4d. Guide Bookings — `/guide/bookings/page.tsx`

List of bookings where this guide is attached:
- Upcoming (confirmed, sorted by date)
- Past (completed)
- Each row: property name, angler name, date, duration, party size, guide rate, status
- Link to booking detail with angler contact info (revealed only for confirmed bookings)

### 4e. Guide Reviews — `/guide/reviews/page.tsx`

- Overall stats: average rating, total reviews, rating distribution (5-star breakdown)
- List of revealed reviews with rating, title, body, angler first name, date
- Pending reviews: "You have X reviews to write" with links to submit

### 4f. Guide Messages — `/guide/messages/page.tsx`

Inbox/conversation view:
- Left panel: thread list with last message preview, unread indicator
- Right panel: message thread with full conversation history
- Compose input at bottom
- Thread grouped by participant and booking context

### 4g. Guide Earnings — `/guide/earnings/page.tsx`

- Total earnings (all time, this month, this year)
- Per-booking breakdown: date, property, party size, guide rate, payout status
- Payout info (linked to Stripe Connect — can stub for now with "Payout setup coming soon")

---

## 5. Angler Booking Flow Updates

### 5a. Property Detail Page — Guide Add-On

**`src/app/(dashboard)/angler/properties/[id]/page.tsx`**

After the existing booking form fields (date, duration, party size, etc.), add a "Add a Guide" section that appears once a date is selected:

1. Call `GET /api/guides/match?property_id=X&date=Y&party_size=N&duration=Z`
2. If guides are available, show:
   - "Add a Guide" toggle/section header
   - Top 3-5 matched guides as cards: photo, name, rating (stars + count), techniques, rate, "Best match" badge on the top result
   - "Browse all eligible guides" link if more than 5
   - Selected guide shows their rate added to the fee breakdown
3. If no guides available, show: "No guides available for this date" (subtle, not blocking)

**Fee breakdown update:**
```
$100 x 2 rods                    $200.00
Platform fee (15%)                 $30.00
Guide — John Smith (full day)    $600.00
Guide service fee (10%)            $60.00
─────────────────────────────────
Total                            $890.00
```

### 5b. Booking Confirmation

After instant-book confirmation, show:
- "Your booking is confirmed!" (not "requested")
- If guide was added: guide name, guide contact info (or "your guide will message you before the trip")
- Trip summary with all line items

### 5c. Angler Bookings Page — Guide Info

On the angler bookings list, show the guide name and photo if a guide was attached.

On past bookings, show "Leave a Review" button if the review window is open and the angler hasn't reviewed yet. Also show "Book Again with [Guide Name]" button.

### 5d. Rebooking Flow

"Book again with this guide" on a past booking:
- Pre-selects the same property and guide
- Angler picks a new date (checks guide + property availability)
- Pre-fills party size from last trip
- Everything else flows through the normal booking path

---

## 6. Club Dashboard Updates

### 6a. Guide Approvals Page — `/club/guide-approvals/page.tsx`

New page in the club dashboard sidebar.

- List of pending guide approval requests for this club's properties
- Each request shows: guide name, photo, rating, techniques, species, which property they're requesting, credentials summary (licensed ✓, insured ✓, First Aid ✓)
- Approve / Decline buttons with optional decline reason
- Approved guides tab showing all currently approved guides per property

### 6b. Club Properties Page

On each property card/detail, add a count: "3 approved guides" with a link to the guide approvals filtered by that property.

---

## 7. Admin Dashboard Updates

### 7a. Guide Review Queue — `/admin/guides/page.tsx`

New page in admin dashboard.

- List of guides with `status = 'pending_review'`
- Each guide shows: full profile, uploaded credentials (viewable/downloadable), self-reported info
- Actions: Approve, Reject (with required reason), Request Changes
- Filter by status: pending, approved, suspended, rejected
- Quick stats: total guides, pending review count, approved count

### 7b. Admin Settings

Add the new platform settings to the admin settings page:
- Guide service fee percentage (10%)
- Review window days (14)
- Minimum insurance amount ($1,000,000)

---

## 8. Marketing Page — `/guides`

**`src/app/(marketing)/guides/page.tsx`**

Full audience page following the same pattern as `/landowners`, `/clubs`, `/anglers`. Uses inline styles with CSS variables (NOT Tailwind — this is a marketing page in the `(marketing)` route group).

### Structure:

**Hero**: "Guide on Private Water. Grow Your Business."
Subhead: "Join AnglerPass to connect with anglers booking private fly fishing access. Keep your rate. Build your reputation. Fill your calendar."

**Value Props** (3-column grid):
1. "Keep Your Full Rate" — You set your pricing. We add a small service fee to the angler's total. You receive 100% of your listed rate.
2. "Access Private Water" — Guide on exclusive private waters through club partnerships. No more cold-calling ranches.
3. "Build Your Reputation" — Verified reviews from real trips. Your profile, your calendar, your business — all in one place.

**How It Works** (numbered steps):
1. Create your free guide profile
2. Upload credentials (license, insurance, First Aid)
3. Request approval for waters you want to guide on
4. Anglers add you to their bookings — you get paid

**What You Need** (requirements section):
- State guide/outfitter license (where required)
- Liability insurance ($1M per occurrence / $2M aggregate)
- Current First Aid + CPR certification
- USCG Captain's License (if operating a motorized vessel)
- Platform review before going live

**Pricing section**:
"Free to join. Free to list. You keep 100% of your rate."
Table showing: Guide sets $600/day → Angler sees $660 ($600 + 10% service fee) → Guide receives $600.

**FAQ section** (accordion):
- How much does it cost to be a guide on AnglerPass?
- How do I get approved for private waters?
- Can I guide on multiple properties?
- Do I need to be a club member?
- How do reviews work?
- When do I get paid?

**CTA / Waitlist**: Lead capture form: Name, Email, Base location, Years of experience, Brief bio. Saves to the existing `leads` table with `role: 'guide'`.

---

## 9. Notification Updates

Add these notification types to `src/lib/notifications.ts`:

- `guide_booking_created` — Guide notified when they're added to a booking
- `guide_booking_cancelled` — Guide notified when a booking with them is cancelled
- `guide_water_approval_requested` — Club admin notified when a guide requests water approval
- `guide_water_approved` — Guide notified when their water request is approved
- `guide_water_declined` — Guide notified when their water request is declined
- `guide_profile_approved` — Guide notified when admin approves their profile
- `guide_profile_rejected` — Guide notified when admin rejects their profile
- `guide_review_received` — Guide notified when a review is revealed
- `guide_credential_expiring` — Guide notified 30 days before a credential expires
- `guide_message_received` — Guide notified of new message (email if preference enabled)
- `angler_review_received` — Angler notified when their review for a guide is revealed (both reviews now visible)

---

## 10. Validation Schemas

**`src/lib/validations/guides.ts`**

Zod schemas for:
- `guideProfileSchema` — all profile fields with proper constraints
- `guideCredentialSchema` — file upload validation
- `guideWaterApprovalSchema` — property_id + club_id
- `guideAvailabilitySchema` — dates array + status
- `reviewSchema` — booking_id, rating (1-5), title (optional, max 100), body (optional, max 2000)
- `messageSchema` — recipient_id, body (max 5000), booking_id (optional)

---

## 11. File Organization

```
src/app/(dashboard)/guide/                    # Guide dashboard pages
  page.tsx                                     # Guide home/overview
  profile/page.tsx                             # Profile editor
  availability/page.tsx                        # Calendar
  bookings/page.tsx                            # Guide's bookings
  reviews/page.tsx                             # Reviews received + pending
  messages/page.tsx                            # Message inbox
  earnings/page.tsx                            # Earnings summary

src/app/(dashboard)/club/guide-approvals/     # Club admin: manage guide approvals
  page.tsx

src/app/(admin)/admin/guides/                 # Admin: guide review queue
  page.tsx

src/app/(marketing)/guides/                   # Public marketing page
  page.tsx

src/app/api/guides/                           # Guide API routes
  profile/route.ts
  credentials/route.ts
  water-approvals/route.ts
  availability/route.ts
  match/route.ts
  [id]/route.ts

src/app/api/clubs/[id]/guide-approvals/       # Club admin guide approval API
  route.ts

src/app/api/reviews/                          # Review API
  route.ts

src/app/api/messages/                         # Messaging API
  route.ts
  [threadId]/route.ts

src/app/api/admin/guides/                     # Admin guide management API
  route.ts

src/lib/validations/guides.ts                 # Zod schemas
src/lib/constants/fees.ts                     # Updated with GUIDE_SERVICE_FEE_RATE

supabase/migrations/00027_guides.sql          # All guide-related tables
```

---

## 12. Implementation Order

Build in this order to maintain a working app at each step:

1. **Migration + role system** (Section 0a + Section 1) — database foundation
2. **Instant-book structural change** (Section 0b) — removes landowner approval
3. **Fee constants update** (Section 2) — guide fee math
4. **Guide profile API + dashboard** (Section 3a-3d + Section 4a-4c) — guides can sign up and build profiles
5. **Admin guide review** (Section 3j + Section 7a) — admin can approve guides
6. **Guide water approvals** (Section 3c + Section 6a) — clubs can approve guides for waters
7. **Guide matching API** (Section 3e-3f) — anglers can discover guides
8. **Booking flow update** (Section 3g + Section 5a-5b) — anglers can add guides to bookings
9. **Guide bookings + earnings** (Section 4d + Section 4g) — guides can see their bookings
10. **Reviews** (Section 3h + Section 4e + Section 5c) — post-trip reviews
11. **Messaging** (Section 3i + Section 4f) — in-app communication
12. **Rebooking** (Section 5d) — book again with same guide
13. **Notifications** (Section 9) — wire up all notification types
14. **Marketing page** (Section 8) — public-facing guide recruitment page
15. **Admin settings + policies page updates** (Section 7b + Section 0b policies)

---

## Key Reminders

- **Homepage uses bespoke CSS** — do not add Tailwind to homepage components.
- **Marketing pages** (`/guides`) use inline styles with CSS variables, NOT Tailwind.
- **Dashboard pages** use Tailwind + shadcn/ui.
- **All forms** use React Hook Form + Zod.
- **Supabase client discipline**: browser → `client.ts`, server components → `server.ts`, API routes → `admin.ts`.
- **Service-role client** (`admin.ts`) bypasses RLS — only use in API routes.
- **All new tables need RLS policies.** Follow existing patterns in the codebase.
- **Color coding**: forest = landowners, river = clubs, bronze = anglers. Pick a new color for guides — suggest using `charcoal` or a new warm tone that sits between bronze (anglers) and forest (landowners) since guides serve both.
- **Do not install additional component libraries.** Use shadcn/ui and Radix.
