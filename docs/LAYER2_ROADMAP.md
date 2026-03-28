# AnglerPass Layer 2 Implementation Roadmap

> Optimized for a founder working iteratively with Claude Code.
> Each phase is designed to be completable in 1-3 focused sessions.
> Phases are sequenced so that each one builds on the last and delivers a testable increment.

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

## Phase 2: Landowner Property Management

**Goal:** Landowners can create, edit, and manage property listings through a full CRUD interface.

**Key Features:**
- Property creation form (name, description, location, water type, species, photos, regulations, pricing tiers)
- Property list view with status badges (draft, pending_review, published, archived)
- Property detail/edit page
- Photo upload to Supabase Storage
- Property status transitions (draft → pending_review → published)
- Basic availability calendar (which dates are open)

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

## Phase 4: Club Management

**Goal:** Club admins can set up their club, manage members, and coordinate access to properties.

**Key Features:**
- Club profile creation (name, description, location, rules, membership tiers)
- Member roster with invite system (invite by email)
- Member status management (active, inactive, pending)
- Club-property association (which properties the club has access to)
- Basic scheduling: assign members to properties on specific dates

**Major Files/Systems:**
- `supabase/migrations/00007_clubs.sql` (clubs, club_memberships, club_property_access tables)
- `src/app/(dashboard)/club/page.tsx` (club dashboard — replace placeholder)
- `src/app/(dashboard)/club/members/page.tsx` (roster — replace placeholder)
- `src/app/(dashboard)/club/settings/page.tsx` (club profile edit)
- `src/app/api/clubs/route.ts`
- `src/app/api/clubs/[id]/members/route.ts`
- `src/lib/validations/clubs.ts`

**Dependencies:** Phase 1 (auth), Phase 2 (properties exist to associate with)

**Risks/Complexity:**
- The invite system needs careful thought. Options: (a) invite by email → creates a pending membership → user signs up and is auto-linked, or (b) user signs up first, then requests to join. Start with (a) — it's what club admins expect.
- Club-property access is a many-to-many relationship. Keep it simple: a club either has access to a property or it doesn't. Don't build per-member permissions on properties yet.

---

## Phase 5: Angler Discovery & Booking

**Goal:** Anglers can browse published properties, view details, and request bookings.

**Key Features:**
- Property discovery page (grid of published properties with filters)
- Property detail page (public-facing — photos, description, species, regulations, availability)
- Booking request form (select date, party size, message to landowner)
- Booking status tracking for anglers (pending, confirmed, declined)
- Booking management for landowners (approve/decline requests, view calendar)
- Angler's "My Bookings" page

**Major Files/Systems:**
- `supabase/migrations/00008_bookings.sql` (bookings table with status enum)
- `src/app/(marketing)/properties/page.tsx` (public discovery — new route in marketing group)
- `src/app/(marketing)/properties/[id]/page.tsx` (public property detail)
- `src/app/(dashboard)/angler/page.tsx` (replace placeholder)
- `src/app/(dashboard)/angler/bookings/page.tsx` (replace placeholder)
- `src/app/(dashboard)/landowner/bookings/page.tsx` (new — manage incoming requests)
- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/[id]/route.ts`
- `src/lib/validations/bookings.ts`

**Dependencies:** Phase 2 (published properties must exist), Phase 1 (auth for booking)

**Risks/Complexity:**
- Availability conflicts: two anglers booking the same date. Use a database constraint or check-then-insert pattern. Start simple — first-come-first-served with landowner approval.
- The public property pages live in the `(marketing)` route group so they get the marketing nav/footer. They'll need to import homepage.css styles or use inline styles consistent with the marketing pages.
- Don't build real-time availability updates yet. A simple "request and wait" flow is fine.

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
- Stripe Checkout for booking payments
- Stripe Connect for landowner payouts (Express accounts)
- Platform fee calculation (percentage per booking)
- Payment status tracking (pending, paid, refunded)
- Landowner payout dashboard (earnings, pending payouts, payout history)
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

## Phase Dependency Graph

```
Phase 1: Auth & Roles
  ├── Phase 2: Property Management
  │     ├── Phase 3: Moderation
  │     ├── Phase 5: Discovery & Booking
  │     │     ├── Phase 6: Notifications
  │     │     ├── Phase 7: Payments
  │     │     ├── Phase 8: Map & Search
  │     │     └── Phase 9: Documents
  │     └── Phase 10: Analytics (needs real data)
  ├── Phase 4: Clubs (needs Phase 2 for property association)
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
