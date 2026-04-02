# AnglerPass Layer 2 Implementation Roadmap

> Optimized for a founder working iteratively with Claude Code.
> Each phase is designed to be completable in 1-3 focused sessions.
> Phases are sequenced so that each one builds on the last and delivers a testable increment.

---

## V1 Business Model

> These principles shape how every phase is built. They can be revisited if the model evolves.

**Core model:** Clubs are the trust and vetting layer. All anglers access private water through club membership — there is no direct angler-to-landowner booking without a club intermediary.

**Club pricing tiers:**
- **Starter** — $149/month (up to 500 members, 25 properties, basic scheduling)
- **Standard** — $349/month (up to 2,000 members, 100 properties, cross-club eligible)
- **Pro** — $699/month (unlimited members, unlimited properties, cross-club eligible)

**Angler booking fees:** 15% platform fee on each booking (paid by the angler on top of the property's base rate), plus a $10/rod cross-club fee when booking outside the angler's home club. No subscription required for anglers.

**Cross-club access:** Standard and Pro clubs can opt in to reciprocal access agreements, allowing members of one club to book water managed by another club in the network. This is the network effect that grows the platform.

**Revenue streams:**
1. Club subscription fees (monthly SaaS)
2. Angler booking fees (per-transaction)
3. Future: premium placement, analytics upgrades

---

## Phase 1: Auth Protection & Role System

**Goal:** Lock down routes, enforce roles, and make the existing auth pages functional end-to-end.

**Key Features:**
- Middleware that redirects unauthenticated users away from `/dashboard`, `/landowner`, `/club`, `/angler`, `/admin`
- Middleware that redirects authenticated users away from `/login`, `/signup`
- Role-based redirects after login (landowner → `/landowner`, club_admin → `/club`, angler → `/angler`, admin → `/admin`)
- Session refresh on every request (Supabase SSR pattern)
- Admin role check on `/admin/*` routes
- "Sign out" button in dashboard topbar
- Display user's name and role in sidebar/topbar

**Major Files/Systems:**
- `middleware.ts` (new — root level)
- `src/lib/supabase/middleware.ts` (new — session refresh helper)
- `src/components/shared/DashboardTopbar.tsx` (add sign out, user display)
- `src/app/(dashboard)/layout.tsx` (fetch user, pass to shell)
- `src/app/(admin)/layout.tsx` (admin role gate)
- `src/app/(auth)/login/page.tsx` (redirect after login based on role)

**Dependencies:** Supabase project created with env vars in `.env.local`

**Risks/Complexity:**
- Edge Runtime compatibility — Supabase SSR middleware must avoid Node.js APIs. Previous attempt failed on Vercel Edge. Use the `@supabase/ssr` `createServerClient` pattern specifically designed for middleware, not the full server client.
- Test locally AND on Vercel before moving on. Middleware bugs are hard to debug in production.

---

### Verified Trip Review System — Completed

The verified trip review system shipped as a cross-cutting feature built on top of the booking and property infrastructure. All items below are complete and in production.

**Completed:**
- ✅ Verified review tied to completed booking (no booking, no review)
- ✅ One review per booking enforced at database level
- ✅ 21-day review window from end of last fishing day
- ✅ One 7-day angler-requested extension
- ✅ Landowner-fault cancellation review with restricted categories and trip-did-not-complete badge
- ✅ Five-step submission flow (overall rating, category ratings, written review, would-fish-again, private notes)
- ✅ Seven fishing-specific category ratings
- ✅ Private feedback field (never public)
- ✅ Blind review period (published at window close or 48-hour buffer)
- ✅ Landowner and club admin public response (one per review, 24-hour edit)
- ✅ Moderation queue with 24-hour acknowledgment and 72-hour resolution SLA
- ✅ Landowner and club admin flagging rights
- ✅ Ranking suppression for properties with fewer than 5 reviews
- ✅ Automated email and SMS prompts with day-14 email and day-18 SMS reminders
- ✅ Property listing review section: summary strip, category averages, individual review cards
- ✅ Verified Angler Review badge and trip-completion status badge
- ✅ Would-fish-again percentage in summary strip
- ✅ Public moderation policy at /legal/review-policy
- ✅ No anonymous reviews enforced

**Database tables:** `trip_reviews`, `review_category_ratings`, `review_flags`, `review_responses`, `review_prompt_log`, `property_review_stats` (view)

**Migrations:** `00033_verified_trip_reviews.sql`, `00034_review_prompt_log.sql`, `00035_nullable_flag_user.sql`

---

## Phase 2: Landowner Property Management

**Goal:** Landowners can create, edit, and manage property listings through a full CRUD interface.

**Key Features:**
- Property creation form (name, description, location, water type, species, photos, regulations, pricing tiers)
- Property list view with status badges (draft, pending_review, published, archived)
- Property detail/edit page
- Photo upload to Supabase Storage
- Property status transitions (draft → pending_club → pending_review → published)
- Basic availability calendar (which dates are open)
- **Note:** Properties require at least one club association before they can be submitted for review. The club association UI and invite flow are built in Phase 4 — until then, properties can be created as drafts.

**Major Files/Systems:**
- `supabase/migrations/00005_expand_properties.sql` (add columns: description, location, water_type, species, regulations, pricing, photos, coordinates)
- `src/app/(dashboard)/landowner/properties/page.tsx` (list view)
- `src/app/(dashboard)/landowner/properties/new/page.tsx` (create form)
- `src/app/(dashboard)/landowner/properties/[id]/page.tsx` (detail/edit)
- `src/app/api/properties/route.ts` (CRUD endpoints)
- `src/app/api/properties/[id]/route.ts` (single property operations)
- `src/lib/validations/properties.ts` (Zod schemas)
- `src/types/supabase.ts` (regenerate after migration)

**Dependencies:** Phase 1 (auth must work so we know who the landowner is)

**Risks/Complexity:**
- Photo upload to Supabase Storage requires bucket setup and RLS policies on the storage bucket. Test with a single image first before building a multi-upload UI.
- Location/coordinates will be text input initially — don't build a map picker yet (that's Phase 8).
- Keep the form simple. Avoid building a rich text editor for descriptions — a textarea is fine for now.

---

## Phase 3: Moderation Workflow

**Goal:** Admin can review, approve, or reject property listings before they go public.

**Key Features:**
- Moderation queue page showing all `pending_review` properties
- Property review detail view (see everything the landowner submitted)
- Approve / Request Changes / Reject actions with required notes
- Audit log entries for every moderation action
- Email notification to landowner on status change (optional — can stub with console.log first)
- Status history visible on property detail page

**Major Files/Systems:**
- `src/app/(admin)/admin/moderation/page.tsx` (queue list — replace placeholder)
- `src/app/(admin)/admin/moderation/[id]/page.tsx` (review detail)
- `src/app/api/moderation/[id]/route.ts` (approve/reject actions)
- `supabase/migrations/00006_moderation.sql` (moderation_notes table, status history)
- `src/lib/validations/moderation.ts`
- Audit log integration (insert into audit_log on every action)

**Dependencies:** Phase 2 (need properties to moderate)

**Risks/Complexity:**
- The moderation flow should be simple: pending_review → approved (published) OR pending_review → changes_requested → pending_review (resubmitted). Don't build a complex state machine.
- Audit log writes should happen in the same database transaction as the status change.

---

## Phase 4: Club Management & Trust Layer

**Goal:** Club admins can set up their club, manage members, vet applicants, and coordinate access to properties. Clubs serve as the trust/vetting intermediary between anglers and landowners — all angler access flows through club membership.

> **V1 model note:** The club-as-intermediary design is a core V1 assumption. If this model evolves (e.g., to allow direct angler booking), the club requirement can be relaxed without major architectural changes — the club_membership foreign key on bookings would become optional rather than required.

**Key Features:**
- Club profile creation (name, description, location, rules, membership tiers)
- Member roster with invite system (invite by email)
- Member vetting workflow (application → review → approve/reject)
- Member status management (active, inactive, pending)
- Club-property association (which properties the club has access to)
- **Property → club association flow on the landowner side:**
  - Properties cannot be published without at least one associated club
  - Property status flow: draft → pending_club (no club yet) → pending_review → published
  - Landowner can search existing clubs on the platform and send an access request
  - Landowner can invite a club not yet on the platform (club name + admin email → invitation email sent → pending association created → auto-linked when club admin signs up and approves)
  - Landowner can also create a club themselves if they wear both hats (links to club registration)
  - Club admin approves or declines property association requests
  - Dashboard indicator on landowner properties: "Associate a club to make this property bookable"
- Basic scheduling: assign members to properties on specific dates
- Club subscription billing (Starter $149/mo, Standard $349/mo, Pro $699/mo) — can defer to Phase 7
- Cross-club access opt-in (Standard and Pro tiers only)

**Major Files/Systems:**
- `supabase/migrations/00007_clubs.sql` (clubs, club_memberships, club_property_access, club_invitations tables, subscription_tier column)
- `src/app/(dashboard)/club/page.tsx` (club dashboard — replace placeholder)
- `src/app/(dashboard)/club/members/page.tsx` (roster — replace placeholder)
- `src/app/(dashboard)/club/applications/page.tsx` (new — vetting queue)
- `src/app/(dashboard)/club/properties/page.tsx` (new — manage property association requests)
- `src/app/(dashboard)/club/settings/page.tsx` (club profile edit)
- `src/app/(dashboard)/landowner/properties/[id]/clubs/page.tsx` (new — manage club associations for a property)
- `src/app/api/clubs/route.ts`
- `src/app/api/clubs/[id]/members/route.ts`
- `src/app/api/clubs/[id]/properties/route.ts` (approve/decline property associations)
- `src/app/api/clubs/invite/route.ts` (send club invitation email from landowner)
- `src/lib/validations/clubs.ts`

**Dependencies:** Phase 1 (auth), Phase 2 (properties exist to associate with)

**Risks/Complexity:**
- The member invite system needs careful thought. Options: (a) invite by email → creates a pending membership → user signs up and is auto-linked, or (b) user signs up first, then requests to join. Start with (a) — it's what club admins expect.
- The club invitation flow (landowner inviting a club) is a growth mechanism — every landowner who invites their club is a warm lead. Store invitations in a `club_invitations` table with status tracking (sent, accepted, expired). When a club admin signs up via an invitation link, auto-create the club and queue the property association for their approval.
- Club-property access is a many-to-many relationship. Keep it simple: a club either has access to a property or it doesn't. Don't build per-member permissions on properties yet.
- Club subscription billing can use Stripe Subscriptions. Wire this up alongside Phase 7 (Payments) or as a parallel effort.
- Cross-club access needs a `cross_club_agreements` table and eligibility checks on the booking flow. Keep it simple: two clubs either have a reciprocal agreement or they don't.

---

## Phase 5: Angler Discovery & Booking (Club-Based)

**Goal:** Anglers can browse properties available through their club, view details, and request bookings. All bookings flow through club membership — anglers cannot book without belonging to a club that has access to the property.

> **V1 model note:** The booking flow requires `club_membership_id` as a foreign key. If the model evolves to allow direct booking, this field becomes optional. The discovery page filters properties to those accessible via the angler's club(s).

**Key Features:**
- Property discovery page filtered by angler's club access (grid with filters)
- Cross-club property discovery (if angler's club has cross-club agreements)
- Property detail page (photos, description, species, regulations, availability)
- Booking request form (select date, party size, message to landowner — must select which club membership to book through)
- Platform fee calculation (15% added to base rate, paid by angler)
- Booking status tracking for anglers (pending, confirmed, declined)
- Booking management for landowners (approve/decline requests, view calendar)
- Angler's "My Bookings" page

**Major Files/Systems:**
- `supabase/migrations/00008_bookings.sql` (bookings table with status enum, club_membership_id FK, platform_fee column)
- `src/app/(marketing)/properties/page.tsx` (public discovery — new route in marketing group)
- `src/app/(marketing)/properties/[id]/page.tsx` (public property detail)
- `src/app/(dashboard)/angler/page.tsx` (replace placeholder)
- `src/app/(dashboard)/angler/bookings/page.tsx` (replace placeholder)
- `src/app/(dashboard)/landowner/bookings/page.tsx` (new — manage incoming requests)
- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/[id]/route.ts`
- `src/lib/validations/bookings.ts`

**Dependencies:** Phase 2 (published properties must exist), Phase 1 (auth for booking), Phase 4 (club membership required for booking)

**Risks/Complexity:**
- Availability conflicts: two anglers booking the same date. Use a database constraint or check-then-insert pattern. Start simple — first-come-first-served with landowner approval.
- The public property pages live in the `(marketing)` route group so they get the marketing nav/footer. They'll need to import homepage.css styles or use inline styles consistent with the marketing pages.
- Don't build real-time availability updates yet. A simple "request and wait" flow is fine.
- Cross-club discovery needs to check the angler's club's cross-club agreements. Keep the query simple: join through `club_memberships → cross_club_agreements → club_property_access`.

---

## Phase 5b: Calendar Feeds (iCal)

**Goal:** Landowners can subscribe to a private iCal feed for each property so bookings appear on their phone (Google Calendar, Apple Calendar, Outlook, etc.).

**Key Features:**
- Private iCal (.ics) feed URL per property with a secret token for auth
- Feed returns standard iCalendar VEVENT entries for each booking (angler name, date, full/half day, party size)
- "Subscribe to Calendar" button on the landowner property dashboard with copy-to-clipboard URL
- Token regeneration (invalidates old subscriptions if compromised)
- Feed is read-only — one-way sync from AnglerPass to the landowner's calendar app

**Major Files/Systems:**
- `supabase/migrations/00009_calendar_tokens.sql` (calendar_tokens table: property_id, token, created_at)
- `src/app/api/properties/[id]/calendar.ics/route.ts` (GET — generates iCal feed, auth via token query param)
- `src/app/(dashboard)/landowner/properties/[id]/page.tsx` (add calendar subscription UI)
- `src/lib/ical.ts` (iCalendar format helper — generates VCALENDAR/VEVENT strings)

**Dependencies:** Phase 5 (bookings must exist to populate the feed)

**Risks/Complexity:**
- Google Calendar can't send auth headers, so the feed URL must include a secret token as a query parameter. Use a cryptographically random token (e.g., `crypto.randomUUID()`). Store hashed or treat as a secret.
- Google Calendar polls iCal feeds every 12–24 hours, so bookings won't appear instantly. This is a known limitation — document it for landowners.
- The iCal format is simple but strict. Test with Google Calendar, Apple Calendar, and Outlook to ensure compatibility. Use `VTIMEZONE` components for correct timezone handling.
- Keep the feed lightweight — only include future bookings (not historical) to avoid large payloads.

---

## Phase 6: Notifications

**Goal:** Users receive email notifications for key events and can manage notification preferences.

**Key Features:**
- Email notifications via Resend (or similar):
  - Landowner: new booking request, booking confirmed/cancelled
  - Angler: booking approved/declined, upcoming trip reminder
  - Club admin: new member request, member joined
  - Admin: new property submitted for review
- Notification preferences page (per-user opt-in/out)
- In-app notification indicator (unread count badge)

**Major Files/Systems:**
- `supabase/migrations/00009_notifications.sql` (notifications table, preferences table)
- `src/app/api/notifications/route.ts` (mark as read, list)
- `src/app/api/notifications/send/route.ts` (internal — triggered by other actions)
- `src/lib/email.ts` (Resend client setup)
- `src/lib/email-templates/` (booking-confirmed.tsx, etc.)
- `src/app/(dashboard)/dashboard/settings/page.tsx` (add notification preferences)
- `src/components/shared/DashboardTopbar.tsx` (add notification bell)

**Dependencies:** Phase 5 (bookings generate notifications), Resend account + API key

**Risks/Complexity:**
- Email deliverability is its own world. Start with Resend — it's simple and has good Next.js integration. Don't build SMS yet.
- Notification templates should be plain and functional. Don't spend time on fancy HTML email templates initially.
- In-app notifications can be a simple polling approach (fetch on page load). Don't build WebSockets yet.

---

## Phase 7: Payments & Payouts

**Goal:** Anglers can pay for bookings; landowners receive payouts. Platform takes a fee.

**Key Features:**
- Stripe Checkout for booking payments (base rate + 15% platform fee)
- Stripe Connect for landowner payouts (Express accounts)
- Stripe Subscriptions for club billing (Starter/Standard/Pro tiers)
- Platform fee calculation (percentage per booking)
- Payment status tracking (pending, paid, refunded)
- Landowner payout dashboard (earnings, pending payouts, payout history)
- Club billing management (plan upgrades/downgrades, invoices)
- Cancellation and refund policy enforcement
- Stripe webhook handler for payment events

**Major Files/Systems:**
- `supabase/migrations/00010_payments.sql` (payments table, payout_accounts table)
- `src/lib/stripe.ts` (Stripe client setup)
- `src/app/api/payments/checkout/route.ts` (create Checkout session)
- `src/app/api/payments/webhook/route.ts` (Stripe webhook handler)
- `src/app/api/payments/connect/route.ts` (Stripe Connect onboarding)
- `src/app/(dashboard)/landowner/earnings/page.tsx`
- `src/app/(dashboard)/angler/bookings/page.tsx` (add payment status)
- `src/lib/validations/payments.ts`

**Dependencies:** Phase 5 (bookings to pay for), Stripe account + API keys

**Risks/Complexity:**
- **This is the most complex phase.** Stripe Connect (for payouts to landowners) has significant onboarding requirements — identity verification, bank account linking, tax forms. Use Stripe Express accounts to minimize your platform's compliance burden.
- Webhook reliability is critical. Stripe webhooks must be idempotent — the same event can arrive multiple times. Use the payment_intent ID as an idempotency key.
- Start with a simple flow: angler pays full amount at booking confirmation → platform takes fee → remainder is available for landowner payout. Don't build escrow, partial payments, or installment plans.
- Test extensively with Stripe test mode before going live. Use Stripe CLI for local webhook testing.

---

## Phase 8: Map & Search

**Goal:** Anglers can discover properties on an interactive map and search with filters.

**Key Features:**
- Interactive map view (Mapbox GL JS) showing published properties
- Search with filters: location, water type, species, date availability, price range
- Map/list toggle view
- Property cards with thumbnail, key details, price
- Geolocation-based "near me" search
- URL-based filter state (shareable search URLs)

**Major Files/Systems:**
- `supabase/migrations/00011_geolocation.sql` (add PostGIS extension, lat/lng columns, spatial index)
- `src/app/(marketing)/properties/page.tsx` (upgrade with map + filters)
- `src/components/map/PropertyMap.tsx` (Mapbox component)
- `src/components/map/PropertyCard.tsx` (map popup / list item)
- `src/components/map/SearchFilters.tsx`
- `src/app/api/properties/search/route.ts` (filtered search endpoint with geo queries)

**Dependencies:** Phase 5 (properties with published status), Mapbox account + API key

**Risks/Complexity:**
- Mapbox GL JS is a large client-side library. Lazy-load it — don't include it in the main bundle.
- PostGIS spatial queries (`ST_DWithin`, `ST_Distance`) are powerful but require the PostGIS extension enabled in Supabase. Check that your Supabase plan supports it.
- Mobile map performance can be poor. Test on real devices, not just desktop simulators.
- Consider starting with a simple list + filters (no map) and adding the map as an enhancement. The list is more important than the map for initial traction.

---

## Phase 9: Documents & E-Signatures

**Goal:** Landowners can require agreements (liability waivers, access rules) that anglers must sign before their trip.

**Key Features:**
- Document template system (landowner creates templates with standard fields)
- Pre-trip agreement flow (angler reviews and signs before booking is finalized)
- Digital signature capture (typed name + timestamp — not a full e-sign platform)
- Signed document storage in Supabase Storage
- Document history and audit trail
- Template library (common waiver templates landowners can customize)

**Major Files/Systems:**
- `supabase/migrations/00012_documents.sql` (document_templates, signed_documents tables)
- `src/app/(dashboard)/landowner/documents/page.tsx` (manage templates)
- `src/app/(dashboard)/landowner/documents/[id]/page.tsx` (edit template)
- `src/app/(dashboard)/angler/sign/[id]/page.tsx` (signing flow)
- `src/app/api/documents/route.ts`
- `src/app/api/documents/[id]/sign/route.ts`
- `src/lib/validations/documents.ts`

**Dependencies:** Phase 5 (bookings to attach documents to)

**Risks/Complexity:**
- **Do not build a real e-signature platform.** That's a regulated space (ESIGN Act, UETA). For v1, use a "click to accept" model: angler types their name, checks a box, timestamp is recorded. This is legally sufficient for liability waivers in most jurisdictions.
- Document templates should be markdown or plain text with variable substitution (`{{angler_name}}`, `{{property_name}}`, `{{trip_date}}`). Don't build a WYSIWYG editor.
- Store signed documents as immutable records — never allow editing after signing.

---

## Phase 10: Analytics & Reporting

**Goal:** All user roles get dashboards with meaningful metrics. Admin gets platform-wide analytics.

**Key Features:**
- Landowner analytics: booking conversion rate, revenue by property, seasonal trends, occupancy rate
- Club analytics: member activity, most-booked properties, retention
- Angler analytics: trip history, spending summary, favorite properties
- Admin analytics: platform growth (users, properties, bookings, revenue), moderation metrics, funnel conversion
- Date range filtering on all dashboards
- CSV export for key reports

**Major Files/Systems:**
- `src/app/(dashboard)/landowner/page.tsx` (replace placeholder stats with real data)
- `src/app/(dashboard)/club/page.tsx` (replace placeholder stats)
- `src/app/(dashboard)/angler/page.tsx` (replace placeholder stats)
- `src/app/(admin)/admin/page.tsx` (replace placeholder stats)
- `src/app/api/analytics/route.ts` (aggregation queries)
- `src/lib/analytics.ts` (query builders for common metrics)
- Consider: Supabase database functions for complex aggregations

**Dependencies:** Phases 2, 4, 5, 7 (need real data to report on)

**Risks/Complexity:**
- Don't build analytics until there's real data flowing through the system. Placeholder dashboards are fine until then.
- Complex SQL aggregations should be Supabase database functions (stored procedures), not application-level loops. This keeps queries fast as data grows.
- Date range queries across large datasets need proper indexes. Add indexes on `created_at` for all tables used in analytics.
- CSV export is simple — generate server-side and return as a download. Don't use a library for this.

---

## Phase 11: Admin Permissions & User Management

**Goal:** Granular admin capabilities, user management tools, and platform configuration.

**Key Features:**
- Admin user management: view all users, edit roles, suspend/unsuspend accounts
- Admin property management: view all properties, force-publish/archive, transfer ownership
- Admin lead management: view all leads from waitlist/investor forms, export, tag
- Admin settings: platform fee percentage, moderation rules, feature flags
- Super-admin vs. moderator distinction (optional — can start with single admin role)
- Impersonation mode (admin can view the platform as a specific user for debugging)

**Major Files/Systems:**
- `src/app/(admin)/admin/users/page.tsx` (upgrade from placeholder)
- `src/app/(admin)/admin/users/[id]/page.tsx` (user detail/edit)
- `src/app/(admin)/admin/properties/page.tsx` (new — all properties view)
- `src/app/(admin)/admin/leads/page.tsx` (new — lead management)
- `src/app/(admin)/admin/settings/page.tsx` (new — platform config)
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `supabase/migrations/00013_admin.sql` (platform_settings table, admin permissions)

**Dependencies:** Phase 1 (admin role gate), Phase 3 (moderation patterns established)

**Risks/Complexity:**
- Impersonation is powerful but dangerous. Implement as read-only first — admin sees what the user sees but can't take actions on their behalf.
- All admin actions must write to the audit log. No exceptions.
- Platform settings (fee percentage, etc.) should be stored in the database, not environment variables, so they can be changed without a deploy.

---

## Review System — Phase 2 Features

The following review enhancements are planned for a future phase. None are scheduled for immediate build.

**Planned:**

- **Review photos**
  > ⚠️ Photo reviews require a separate design and policy review before building. Issues to resolve before building: image metadata stripping, landowner approval flow, prohibition on photos revealing access routes or gate codes, privacy policy update. Do not build until these are explicitly addressed in a Phase 2 planning session.

- **AI-generated review summaries per property listing**

- **Helpful votes on individual reviews**

- **Search and filter by rating category**

- **Reputation badges** (examples: "Consistently Accurate Access," "Top-Rated Water," "Highly Responsive Host")

- **Two-way review evaluation**
  > ⚠️ Deferred from MVP. Landowners typically have no direct interaction with anglers, making meaningful two-way reviews impractical at launch. Revisit only if operational data suggests otherwise.

---

## Phase Dependency Graph

```
Phase 1: Auth & Roles
  ├── Phase 2: Property Management
  │     ├── Phase 3: Moderation
  │     ├── Phase 5: Discovery & Booking
  │     │     ├── Phase 5b: Calendar Feeds (iCal)
  │     │     ├── Phase 6: Notifications
  │     │     ├── Phase 7: Payments
  │     │     ├── Phase 8: Map & Search
  │     │     └── Phase 9: Documents
  │     └── Phase 10: Analytics (needs real data)
  ├── Phase 4: Clubs (needs Phase 2; unlocks property publishing via club association)
  └── Phase 11: Admin Permissions (can start after Phase 1, grows with each phase)
```

---

## Guiding Principles

1. **Ship each phase before starting the next.** Resist the urge to "just add one more thing." Each phase should be deployed, tested with real clicks, and stable before moving on.

2. **Database migrations are one-way.** Write them carefully. Use `IF NOT EXISTS` for safety. Test migrations on a branch database before running on production.

3. **RLS is your security layer.** Every new table needs Row Level Security policies. If a table has no RLS policies, it's invisible to the client — which is correct for tables accessed only via service-role (like audit_log).

4. **The homepage is frozen.** Don't touch homepage.css or homepage components. New public pages (property discovery, etc.) go in the `(marketing)` route group and use inline styles with CSS variables.

5. **Supabase client discipline:**
   - Browser components → `src/lib/supabase/client.ts`
   - Server components → `src/lib/supabase/server.ts`
   - API routes → `src/lib/supabase/admin.ts`
   - Never expose the service-role key to the client.

6. **Start ugly, then polish.** Get the data flowing correctly before spending time on UI polish. A working form with default shadcn styling is better than a beautiful form that doesn't save.

7. **Test on Vercel after every phase.** Local dev hides Edge Runtime issues, environment variable problems, and cold start latency. Deploy early and often.
