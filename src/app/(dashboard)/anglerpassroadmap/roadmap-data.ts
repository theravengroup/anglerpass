export interface RoadmapItem {
  id: string;
  label: string;
  detail?: string;
  done: boolean; // default/initial state
}

export interface RoadmapSection {
  id: string;
  title: string;
  description?: string;
  items: RoadmapItem[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  subtitle: string;
  accent: string; // Tailwind color class
  sections: RoadmapSection[];
}

export const PHASES: RoadmapPhase[] = [
  // ═══════════════════════════════════════════════════════════════
  // COMPLETE — already shipped
  // ═══════════════════════════════════════════════════════════════
  {
    id: "complete",
    title: "Completed",
    subtitle: "Shipped and live in production",
    accent: "bg-emerald-600",
    sections: [
      {
        id: "complete-core",
        title: "Core Platform",
        items: [
          { id: "c-auth", label: "Auth system (email/password, multi-role, middleware)", done: true },
          { id: "c-profiles", label: "User profile management (bio, avatar, species, experience)", done: true },
          { id: "c-suspension", label: "Account suspension system (admin + middleware enforcement)", done: true },
          { id: "c-multi-role", label: "Multi-role support with RoleSwitcher", done: true },
          { id: "c-notifications", label: "Notification system (18 types, in-app + email, preferences)", done: true },
          { id: "c-messaging", label: "1:1 messaging system (threads, read receipts, booking-linked)", done: true },
          { id: "c-messages-page", label: "Dashboard messages page connected to messaging API", done: true },
          { id: "c-analytics", label: "Role-specific analytics dashboards with CSV export", done: true },
          { id: "c-financials", label: "Financial reporting dashboards (all roles + admin)", done: true },
          { id: "c-audit-log", label: "Admin audit log with actor resolution", done: true },
          { id: "c-platform-settings", label: "Platform settings (12 configurable values)", done: true },
          { id: "c-admin-users", label: "Admin user management (search, suspend, role changes)", done: true },
          { id: "c-admin-team", label: "Admin team management (invite, view)", done: true },
          { id: "c-rate-limit", label: "Rate limiting on all public API endpoints", done: true },
          { id: "c-supabase-security", label: "Supabase function security (SET search_path on all functions)", done: true },
          { id: "c-platform-fee-5", label: "5% platform fee on membership dues (updated from 3.5%)", done: true },
          { id: "c-user-role", label: "Consolidated UserRole type (single source of truth)", done: true },
          { id: "c-deprecated-cols", label: "Dropped deprecated columns (capacity, coordinates)", done: true },
          { id: "c-pre-launch", label: "Resolved pre-launch vs live ambiguity in copy", done: true },
        ],
      },
      {
        id: "complete-properties",
        title: "Property Management",
        items: [
          { id: "c-prop-crud", label: "Property CRUD with multi-field form and photo upload", done: true },
          { id: "c-prop-photos", label: "Photo upload with client-side WebP compression", done: true },
          { id: "c-prop-moderation", label: "Property moderation queue (approve/reject/request changes)", done: true },
          { id: "c-prop-search", label: "Public property search page (unauthenticated)", done: true },
          { id: "c-prop-discover", label: "Property discovery via club membership + cross-club", done: true },
          { id: "c-prop-map", label: "Mapbox GL JS map with markers and search filters", done: true },
          { id: "c-prop-calendar", label: "iCal calendar feeds (landowners + clubs subscribable, angler ICS downloads + email attachments)", done: true },
          { id: "c-prop-weather", label: "NWS/NOAA 7-day weather forecasts on property pages", done: true },
          { id: "c-prop-docs", label: "Document templates and e-signature system", done: true },
          { id: "c-prop-lodging", label: "On-property lodging system (cabins, lodges, amenities, rates, external listing links)", done: true },
          { id: "c-prop-club-create", label: "Club-created properties (clubs add properties on behalf of landowners)", done: true },
          { id: "c-prop-claim", label: "Landowner property claim flow (email invitation, token-based claim)", done: true },
          { id: "c-prop-csv", label: "Bulk property import from CSV with validation and preview", done: true },
          { id: "c-prop-csv-template", label: "Downloadable CSV template for property import", done: true },
        ],
      },
      {
        id: "complete-clubs",
        title: "Club Management",
        items: [
          { id: "c-club-crud", label: "Club creation and profile management", done: true },
          { id: "c-club-members", label: "Member management (invite, approve, decline, remove)", done: true },
          { id: "c-club-apps", label: "Membership application workflow", done: true },
          { id: "c-club-props", label: "Club-property association management", done: true },
          { id: "c-club-corp", label: "Corporate memberships (sponsor, employee invite, token join)", done: true },
          { id: "c-club-invite-lo", label: "Club invitations from landowners (email + token)", done: true },
          { id: "c-club-invite-ang", label: "Club invitations from anglers (viral invite flow)", done: true },
          { id: "c-club-join", label: "Public club join pages (/join/[clubId])", done: true },
          { id: "c-club-network", label: "Cross-club network (propose, accept, revoke agreements)", done: true },
          { id: "c-club-referral", label: "Member referral system (codes, invites, credit tracking)", done: true },
          { id: "c-club-logo", label: "Club logo upload with WebP conversion", done: true },
          { id: "c-club-faq", label: "Club FAQ with migration inquiry form", done: true },
          { id: "c-club-bulk-invite", label: "Bulk member import via CSV upload or email paste (up to 200 at once)", done: true },
          { id: "c-club-bulk-template", label: "Downloadable CSV template for member import", done: true },
          { id: "c-club-permissions", label: "Staff permissions system with granular role-based access", done: true },
          { id: "c-club-consultation", label: "Club consultation request form for onboarding assistance", done: true },
          { id: "c-club-activation", label: "Club active/inactive toggle (owner + admin, inactive-by-default, hides all affiliated properties)", done: true },
          { id: "c-club-deactivation-notify", label: "Bidirectional deactivation notifications (club→landowners, property→clubs)", done: true },
          { id: "c-club-avail", label: "Club-facing property availability management (block dates for private events, maintenance)", done: true },
        ],
      },
      {
        id: "complete-booking",
        title: "Booking System",
        items: [
          { id: "c-book-create", label: "Booking creation (instant-confirm, multi-day, multi-rod)", done: true },
          { id: "c-book-crossclub", label: "Cross-club booking routing with $25/rod fee", done: true },
          { id: "c-book-guide", label: "Independent guide add-on for bookings", done: true },
          { id: "c-book-cancel", label: "Booking cancellation with tiered refund policy", done: true },
          { id: "c-book-fees", label: "Fee calculation engine (platform, cross-club, independent guide, staff discounts)", done: true },
          { id: "c-book-lodging", label: "Multi-day booking with lodging toggle", done: true },
          { id: "c-book-gate-codes", label: "Gate code delivery automation (morning-of email with access notes)", done: true },
        ],
      },
      {
        id: "complete-guides",
        title: "Independent Guide System",
        items: [
          { id: "c-guide-profile", label: "Independent guide profile creation and editing", done: true },
          { id: "c-guide-creds", label: "Credential upload (license, insurance, first aid, USCG)", done: true },
          { id: "c-guide-expiry", label: "Credential expiry tracking with date pickers", done: true },
          { id: "c-guide-cron", label: "Daily expiry cron (warnings at 60/30/7 days, auto-suspend)", done: true },
          { id: "c-guide-reinstate", label: "Auto-reinstatement when expired credentials renewed", done: true },
          { id: "c-guide-vetting", label: "Admin independent guide vetting (approve/reject/suspend)", done: true },
          { id: "c-guide-checkr", label: "Checkr background check integration", done: true },
          { id: "c-guide-verify", label: "Independent guide verification system (Stripe fee + Checkr + credential checks)", done: true },
          { id: "c-guide-water", label: "Per-property water approvals by clubs", done: true },
          { id: "c-guide-avail", label: "Independent guide availability calendar (per-date, bulk set)", done: true },
          { id: "c-guide-match", label: "Independent guide matching for bookings", done: true },
          { id: "c-guide-browse", label: "Independent guide browse/discovery page for anglers", done: true },
          { id: "c-guide-earnings", label: "Independent guide earnings dashboard", done: true },
        ],
      },
      {
        id: "complete-reviews",
        title: "Review System",
        items: [
          { id: "c-rev-trip", label: "Trip reviews (7 categories, 21-day window, extension)", done: true },
          { id: "c-rev-guide", label: "Double-blind independent guide reviews (mutual, reveal on both submit)", done: true },
          { id: "c-rev-autoflag", label: "Review auto-flagging (threats, extortion, contact info, profanity)", done: true },
          { id: "c-rev-prompt", label: "Review prompt cron (email day 0, reminder day 14, SMS day 18)", done: true },
          { id: "c-rev-publish", label: "Review auto-publication cron (48h delay)", done: true },
          { id: "c-rev-respond", label: "Landowner/club admin review responses (24h edit window)", done: true },
          { id: "c-rev-mod", label: "Admin review flag moderation queue", done: true },
          { id: "c-rev-policy", label: "Public review moderation policy page", done: true },
        ],
      },
      {
        id: "complete-payments",
        title: "Payments",
        items: [
          { id: "c-stripe-connect", label: "Stripe Connect onboarding (independent guides, landowners, clubs)", done: true },
          { id: "c-stripe-verify", label: "Stripe Checkout for independent guide verification fee", done: true },
          { id: "c-stripe-webhook-verify", label: "Stripe webhook for verification payments", done: true },
          { id: "c-stripe-webhook", label: "Stripe webhook endpoint (payment_intent, invoice, subscription, dispute events)", done: true },
          { id: "c-stripe-elements", label: "Stripe Elements integration (PaymentElement, SetupIntent, ConnectAccountOnboarding — all inline, branded theme with 30+ rules)", done: true },
          { id: "c-stripe-booking-payment", label: "Booking payment with hold/capture (PaymentIntent manual capture)", done: true },
          { id: "c-stripe-membership", label: "Membership checkout (initiation fee + recurring subscription)", done: true },
          { id: "c-stripe-club-sub", label: "Club platform subscription billing (3 tiers, upgrade/downgrade)", done: true },
          { id: "c-stripe-payouts", label: "Multi-party payouts (Connect transfers to landowners, independent guides, clubs)", done: true },
          { id: "c-stripe-payment-methods", label: "Saved payment methods (list, add, remove, set default)", done: true },
          { id: "c-stripe-cancel-hold", label: "Payment hold cancellation (release authorization on cancel)", done: true },
        ],
      },
      {
        id: "complete-guide-proposals",
        title: "Independent Guide Trip Proposals",
        items: [
          { id: "c-proposal-system", label: "Independent guide trip proposal system (create, send, accept, decline)", done: true },
          { id: "c-proposal-form", label: "5-step proposal form (property, details, fee, invite, review)", done: true },
          { id: "c-proposal-angler", label: "Angler proposal inbox with accept/decline and cost breakdown", done: true },
          { id: "c-proposal-payment", label: "Stripe payment on proposal acceptance (automatic booking creation)", done: true },
          { id: "c-proposal-notifications", label: "Proposal notifications (received, accepted, declined, expired)", done: true },
          { id: "c-proposal-search", label: "Angler search for proposal invitations", done: true },
        ],
      },
      {
        id: "complete-marketing",
        title: "Marketing Site",
        items: [
          { id: "c-mkt-home", label: "Homepage with 12 bespoke sections", done: true },
          { id: "c-mkt-audiences", label: "5 audience pages (anglers, clubs, landowners, independent guides, corporates)", done: true },
          { id: "c-mkt-pricing", label: "Comprehensive pricing page with fee breakdowns", done: true },
          { id: "c-mkt-policies", label: "Platform policies page", done: true },
          { id: "c-mkt-privacy", label: "Standalone privacy policy", done: true },
          { id: "c-mkt-terms", label: "Standalone terms of service", done: true },
          { id: "c-mkt-compass", label: "AnglerPass Compass AI trip matching section", done: true },
          { id: "c-mkt-previews", label: "Dashboard preview sections on all audience pages", done: true },
          { id: "c-mkt-faqs", label: "FAQ accordions on all audience pages", done: true },
          { id: "c-mkt-waitlist", label: "Waitlist + investor lead capture with email confirmation", done: true },
          { id: "c-mkt-contact", label: "Contact form with department routing", done: true },
          { id: "c-mkt-corp-inquiry", label: "Dedicated corporate inquiry form (company size, use case, regions, timeline — routes to partners@ with structured lead data)", done: true },
          { id: "c-sec-hardening", label: "Pre-launch security hardening (migration 00088: role-escalation trigger, stripe webhook RLS, club-logos ACL, bookings financial guard, messages immutability, ClubOS search_path lockdown, corporate invitation token RPC — 17 findings fixed)", done: true },
          { id: "c-mkt-conservation", label: "Conservation page (habitat preservation, catch-and-release values)", done: true },
          { id: "c-mkt-conservation-update", label: "Conservation page update (Stripe Climate raised to 1%, EarthNow partnership + live widget embed)", done: true },
          { id: "c-mkt-landowner-pricing", label: "Landowner pricing education (Select/Premier/Signature tiers, rod-fee-split examples, upfront lease explainer, updated FAQs)", done: true },
          { id: "c-mkt-ai", label: "AnglerPass Compass AI section (trip matching, planning, on-water guidance)", done: true },
          { id: "c-mkt-explore", label: "Public Explore Waters page (search properties without login)", done: true },
          { id: "c-mkt-press-kit", label: "Press kit (logos in 6 formats, dashboard screenshots, founder headshot, brand kit PDF)", done: true },
          { id: "c-mkt-pricing-ea", label: "Early Access club pricing ($79/$199/$499 locked through Sep 30, 2026)", done: true },
          { id: "c-mkt-team", label: "Team page with bios and leadership profiles", done: true },
        ],
      },
      {
        id: "complete-learn",
        title: "Learn / Education",
        items: [
          { id: "c-learn-system", label: "Learn center with 20 educational posts (JSON, categories, SEO)", done: true },
          { id: "c-learn-images", label: "All 20 articles have hero images (cinematic photography)", done: true },
          { id: "c-learn-sitemap", label: "Dynamic sitemap generation for learn posts + all marketing pages", done: true },
        ],
      },
      {
        id: "complete-auth-ux",
        title: "Auth & UX Polish",
        items: [
          { id: "c-nav-avatar", label: "Nav avatar dropdown (profile photo, initials fallback, Dashboard/Settings/Log Out)", done: true },
          { id: "c-role-protection", label: "Role-based route protection (middleware enforces role-to-path mapping)", done: true },
          { id: "c-cache-control", label: "Cache-Control headers on protected routes (prevent stale back-button pages)", done: true },
          { id: "c-auth-aware-ctas", label: "Auth-aware CTAs across marketing site (waitlist, footer, 404, error, final CTA)", done: true },
          { id: "c-login-messaging", label: "Login page query param messaging (error/success banners)", done: true },
          { id: "c-signup-dupe", label: "Signup duplicate email detection with sign-in link", done: true },
          { id: "c-auth-callback", label: "Auth callback error handling (redirect to login with message)", done: true },
          { id: "c-auth-perf", label: "Auth performance (non-blocking callback, singleton middleware client, deduplicated profile fetch)", done: true },
        ],
      },
      {
        id: "complete-testing",
        title: "Testing & Quality",
        items: [
          { id: "c-playwright", label: "Playwright E2E suite (94 tests: marketing, auth, API, forms, unsubscribe, learn, dashboards)", done: true },
          { id: "c-vitest", label: "Vitest unit suite (617 tests: 30 files covering all validation schemas, posts, middleware)", done: true },
          { id: "c-test-auth-helper", label: "Dev login test helper (per-role test users, cookie-based auth for all 7 roles)", done: true },
          { id: "c-test-projects", label: "Two-project Playwright config (smoke → dashboards dependency chain)", done: true },
          { id: "c-test-forms", label: "Form submission E2E tests (waitlist API, contact API, page-level form validation)", done: true },
          { id: "c-test-unsubscribe", label: "Email unsubscribe E2E tests (GET/POST token validation, HMAC verification)", done: true },
          { id: "c-test-dashboards", label: "Dashboard E2E tests (all 7 roles, sub-pages, ClubOS, independent guide pages)", done: true },
          { id: "c-test-validations", label: "Validation schema unit tests (10 files: auth, leads, contact, clubs, stripe, proposals, campaigns, docs, notifications, support)", done: true },
        ],
      },
      {
        id: "complete-crm",
        title: "CRM & Marketing Automation",
        items: [
          { id: "c-crm-campaigns", label: "Campaign engine (broadcast, drip, triggered) with multi-step sequences", done: true },
          { id: "c-crm-segments", label: "Audience segmentation (dynamic rule-based, segment preview, count caching)", done: true },
          { id: "c-crm-workflows", label: "Automation workflows (visual node-based builder, trigger events, branching)", done: true },
          { id: "c-crm-admin", label: "Admin CRM dashboard (campaigns, segments, workflows, test-send)", done: true },
          { id: "c-crm-engagement", label: "Engagement tracking (delivers, opens, clicks per campaign)", done: true },
          { id: "c-crm-templates", label: "Email template engine for campaign sends", done: true },
        ],
      },
      {
        id: "complete-emails",
        title: "Email System",
        items: [
          { id: "c-email-branded", label: "Branded email wrapper (Georgia serif, forest green CTA)", done: true },
          { id: "c-email-notif", label: "18 notification email types via Resend", done: true },
          { id: "c-email-referral", label: "Referral invite emails with personal message", done: true },
          { id: "c-email-prefs", label: "Per-user email notification preferences", done: true },
        ],
      },
      {
        id: "complete-finance-ops",
        title: "Finance Operations",
        items: [
          { id: "c-fin-mercury", label: "Mercury API client (balance, transactions, accounts)", done: true },
          { id: "c-fin-payout-ingest", label: "Payout ingestion pipeline (Stripe → Mercury reconciliation)", done: true },
          { id: "c-fin-reconciliation", label: "Reconciliation engine (Connect transfer verification, discrepancy detection)", done: true },
          { id: "c-fin-webhooks", label: "Finance webhook handlers (real-time payout tracking)", done: true },
          { id: "c-fin-alerts", label: "Finance alerts system (failed payouts, reconciliation mismatches)", done: true },
          { id: "c-fin-monthly", label: "Monthly reconciliation reports (automated generation)", done: true },
          { id: "c-fin-drilldown", label: "Payout drill-down (individual transfer detail view)", done: true },
          { id: "c-fin-dashboard", label: "Admin finance dashboard (revenue streams, cash flow, exception aging, CSV export)", done: true },
          { id: "c-fin-digest", label: "Finance email digests (scheduled summary reports)", done: true },
        ],
      },
      {
        id: "complete-availability",
        title: "Property Availability",
        items: [
          { id: "c-avail-calendar", label: "Availability calendar UI (block/unblock dates, visual management)", done: true },
          { id: "c-avail-api", label: "Availability API routes (CRUD for blocked date ranges)", done: true },
          { id: "c-avail-validation", label: "Booking validation against blocked dates", done: true },
          { id: "c-avail-ical", label: "iCal integration for blocked date sync", done: true },
        ],
      },
      {
        id: "complete-booking-abuse",
        title: "Booking Abuse Prevention",
        items: [
          { id: "c-abuse-caps", label: "Concurrent booking caps (tiered by standing: 6/4/2/0)", done: true },
          { id: "c-abuse-scoring", label: "Cancellation scoring system (90-day rolling window)", done: true },
          { id: "c-abuse-refund", label: "Graduated refund tiers (100%/75%/50%/0% by window)", done: true },
          { id: "c-abuse-late-fee", label: "Late-cancel fee tracking ($15 within 72hrs)", done: true },
          { id: "c-abuse-property", label: "Property-level booking limits (per-member monthly cap, advance window)", done: true },
          { id: "c-abuse-standing", label: "Booking standing system (good/warned/restricted/suspended)", done: true },
          { id: "c-abuse-admin", label: "Admin booking management page (flagged users, standing overrides)", done: true },
          { id: "c-abuse-club-alerts", label: "Club admin booking alerts (flagged member notifications)", done: true },
        ],
      },
      {
        id: "complete-enhanced-financials",
        title: "Enhanced Financial Dashboards",
        items: [
          { id: "c-efin-club", label: "Club financials (dues health tracking, cancellation impact, cross-club activity, membership revenue breakdown)", done: true },
          { id: "c-efin-landowner", label: "Landowner financials (held funds pipeline, tax summary with quarterly breakdown, independent guide splits, refund tracking)", done: true },
          { id: "c-efin-angler", label: "Angler financials (cost-per-trip metrics, late-cancel fees, refund tracking, discount savings, fee breakdown)", done: true },
          { id: "c-efin-rod-split", label: "Rod-fee-split model in all dashboards (classification-based splits, lease payments, cross-club fee attribution fix, pricing mode breakdowns)", done: true },
        ],
      },
      {
        id: "complete-og-images",
        title: "OpenGraph & Social Sharing",
        items: [
          { id: "c-og-redesign", label: "Cinematic OG images (photo backgrounds, prominent logo, bold taglines)", done: true },
          { id: "c-og-audiences", label: "Audience-specific OG images for all 11 marketing pages (themed overlays + accent colors)", done: true },
          { id: "c-og-dynamic", label: "Dynamic OG route with configurable type, title, and subtitle parameters", done: true },
          { id: "c-og-posts", label: "All 20 learn articles have dedicated OG images via post hero images", done: true },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1 — V1 Launch (May 1, 2026)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "phase1",
    title: "Phase 1 — V1 Launch",
    subtitle: "Target: May 1, 2026. Minimum viable marketplace.",
    accent: "bg-amber-600",
    sections: [
      {
        id: "p1-payments",
        title: "1A: Payments (Critical Path)",
        description: "The entire business model depends on this. No revenue without it.",
        items: [
          {
            id: "p1-webhook",
            label: "Stripe webhook endpoint for payment events",
            detail: "Process payment_intent.succeeded/failed, invoice.paid, customer.subscription.*, charge.dispute.*",
            done: true,
          },
          {
            id: "p1-club-billing",
            label: "Club subscription billing (Stripe Subscriptions)",
            detail: "Products/prices for 3 tiers. Trial. Upgrade/downgrade. Billing portal. Cancel.",
            done: true,
          },
          {
            id: "p1-membership-checkout",
            label: "Membership checkout (Stripe Elements)",
            detail: "Stripe Elements on /join/[clubId]. Initiation + first dues. 5% platform fee. Receipt.",
            done: true,
          },
          {
            id: "p1-dues-renewal",
            label: "Dues auto-renewal",
            detail: "Stripe recurring subscription per membership. Pre-renewal email. Grace period. Lapse handling.",
            done: true,
          },
          {
            id: "p1-booking-payment",
            label: "Booking payment (Payment Intents)",
            detail: "Payment intent at booking creation. Hold/capture flow. Fee split calculation.",
            done: true,
          },
          {
            id: "p1-payouts",
            label: "Multi-party payouts (Stripe Connect transfers)",
            detail: "Landowner payout, club commission, independent guide payout after trip completion.",
            done: true,
          },
          {
            id: "p1-refunds",
            label: "Refund processing",
            detail: "Hold cancellation releases authorization. Tiered policy enforced at booking layer.",
            done: true,
          },
        ],
      },
      {
        id: "p1-communication",
        title: "1B: Lifecycle Communication",
        description: "Users who sign up and receive nothing have an 80%+ chance of never returning.",
        items: [
          {
            id: "p1-welcome",
            label: "Welcome email sequence",
            detail: "3-email Resend sequence per role (immediate, day 2, day 5). Customer.io upgrade planned for Phase 2.",
            done: true,
          },
          {
            id: "p1-booking-emails",
            label: "Booking lifecycle emails",
            detail: "Confirmation details, pre-trip reminder (24h), gate code delivery (morning of), post-trip thank-you.",
            done: true,
          },
          {
            id: "p1-onboarding",
            label: "Onboarding nudges",
            detail: "Incomplete profile reminders, 'finish setting up your property' for landowners, 'join a club' for anglers.",
            done: true,
          },
          {
            id: "p1-renewal-reminders",
            label: "Renewal reminder emails",
            detail: "14-day and 3-day pre-renewal emails for membership dues.",
            done: true,
          },
          {
            id: "p1-unsubscribe",
            label: "Unsubscribe links in all emails",
            detail: "CAN-SPAM compliance. One-click unsubscribe in email footer.",
            done: true,
          },
        ],
      },
      {
        id: "p1-trust",
        title: "1C: Trust Signals",
        description: "Landowners will not open their gates without trust. Anglers won't pay without confidence.",
        items: [
          {
            id: "p1-about",
            label: "Team / About page (deferred — solo founder)",
            detail: "Not needed yet as a one-person operation. Will build when team grows.",
            done: true,
          },
          {
            id: "p1-conservation",
            label: "Conservation statement",
            detail: "Platform values on conservation, catch-and-release, habitat preservation.",
            done: true,
          },
          {
            id: "p1-earthnow",
            label: "EarthNow monthly donation",
            detail: "Recurring monthly donation to EarthNow via their donation form (Mercury debit card). Complements Stripe Climate 1% commitment.",
            done: false,
          },
          {
            id: "p1-liability",
            label: "Liability framework section on /landowners",
            detail: "Club insurance, signed waivers, vetted members — added as 'Your Protection' section with 3-card grid.",
            done: true,
          },
          {
            id: "p1-security",
            label: "Security & privacy page",
            detail: "Covered by existing /privacy, /terms, and /policies pages.",
            done: true,
          },
        ],
      },
      {
        id: "p1-quick-wins",
        title: "1D: Quick Wins",
        description: "High impact, low effort. Ship these fast.",
        items: [
          {
            id: "p1-sentry",
            label: "Sentry error tracking",
            detail: "Client/server/edge configs, global error boundary, source map uploads, /monitoring tunnel.",
            done: true,
          },
          {
            id: "p1-cancel-fix",
            label: "Fix cancellation policy mismatch",
            detail: "Policies page says 48h/24h/0h tiers. Code implements 48h/day-of/0h. Reconcile.",
            done: true,
          },
          {
            id: "p1-staff-constraint",
            label: "Add staff role CHECK constraint",
            detail: "club_memberships.role has no constraint for 'staff'. Add to migration.",
            done: true,
          },
          {
            id: "p1-guide-affiliations",
            label: "Independent guide club affiliations API + UI",
            detail: "API endpoints (CRUD) + independent guide dashboard UI + club manager approval UI.",
            done: true,
          },
          {
            id: "p1-copy-audit",
            label: "Marketing copy audit — remove claims that don't match product",
            detail: "Events & Group Bookings, Access Scheduling, Digital Rosters, Inquiry Handling claims.",
            done: true,
          },
        ],
      },
      {
        id: "p1-marketing-automation",
        title: "1E: Marketing Automation (Built-In CRM)",
        description: "Replace third-party marketing tools with a native campaign engine. Zero vendor cost, full data control, purpose-built for AnglerPass.",
        items: [
          {
            id: "p1-ma-campaigns",
            label: "Campaign engine with audience segments and trigger conditions",
            detail: "Define campaigns targeting specific segments (role, activity, geography, club status). Trigger on signup, inactivity, post-trip, pre-renewal, abandoned onboarding.",
            done: true,
          },
          {
            id: "p1-ma-drip",
            label: "Cron-driven drip sequence runner",
            detail: "Daily cron evaluates all active campaigns, sends eligible emails via Resend. Multi-step sequences with delay logic and exit conditions.",
            done: true,
          },
          {
            id: "p1-ma-engagement",
            label: "Engagement tracking (opens, clicks, bounces)",
            detail: "Resend webhooks for delivery events stored in our database. Per-campaign and per-user engagement metrics.",
            done: true,
          },
          {
            id: "p1-ma-segments",
            label: "Audience segmentation (role, activity, geography, membership status)",
            detail: "Reusable segment definitions querying existing Supabase data. No external sync needed — all data already in our database.",
            done: true,
          },
          {
            id: "p1-ma-admin",
            label: "Admin campaign dashboard (create, pause, view performance)",
            detail: "Campaign list with status, send counts, open/click rates. Create new campaigns with segment picker and email template builder.",
            done: true,
          },
          {
            id: "p1-ma-reengagement",
            label: "Pre-built campaigns (welcome series, re-engagement, seasonal, post-trip)",
            detail: "Ship with default campaign templates for common lifecycle touchpoints. Admins can customize or create new ones.",
            done: true,
          },
        ],
      },
      {
        id: "p1-affiliate",
        title: "1F: Affiliate Program",
        description: "Three-tier monetization of Compass AI recommendations: direct brand links, retailer fallbacks, and digital/app referrals — with FTC-compliant affiliate disclosure built in from day one.",
        items: [
          {
            id: "p1-aff-direct",
            label: "Direct brand affiliate links",
            detail: "In-context product links when Compass AI recommends hard goods (boots, waders, rods, reels, packs, sunglasses, flies). Integrate with brand affiliate programs from Orvis, Simms, Patagonia, etc. via Impact, CJ Affiliate, or direct partnerships.",
            done: true,
          },
          {
            id: "p1-aff-retailer-fallback",
            label: "Retailer fallback links",
            detail: "When a recommended brand has no public affiliate program (e.g. Sage), route links to authorized retailers that carry it — Trident, AvidMax, Telluride Angler, Ed's Fly Shop. Ensures monetization regardless of brand program availability.",
            done: true,
          },
          {
            id: "p1-aff-digital",
            label: "Digital product & app referrals",
            detail: "Membership and app affiliate links for digital recommendations — Flylab, FlyFishFinder, and similar tools when Compass AI suggests research, maps, or trip-planning resources instead of hard goods.",
            done: true,
          },
          {
            id: "p1-aff-disclosure",
            label: "Affiliate disclosure & compliance",
            detail: "Clear affiliate disclosure near every AI recommendation block, plus standing disclosures in the site footer and terms of service. Required for FTC compliance and affiliate network rules (Impact, CJ, etc.). Build as a reusable component from day one.",
            done: true,
          },
          {
            id: "p1-aff-tracking",
            label: "Multi-network attribution tracking",
            detail: "Unified tracking across direct brand programs, retailer networks, and digital referrals. Per-click and per-conversion attribution with source tagging by recommendation context.",
            done: true,
          },
          {
            id: "p1-aff-analytics",
            label: "Affiliate revenue dashboard",
            detail: "Admin analytics for click-through rates, conversion rates, and commission revenue — broken down by tier (direct brand, retailer fallback, digital). Identify top-performing recommendations and optimize link routing.",
            done: true,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2 — Expansion (Post-Launch)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "phase2",
    title: "Phase 2 — Expansion",
    subtitle: "Post-launch features that differentiate and drive growth.",
    accent: "bg-river",
    sections: [
      {
        id: "p2-club-os",
        title: "2A: Club Operating System",
        description: "Make clubs dependent on AnglerPass for daily operations.",
        items: [
          { id: "p2-broadcasts", label: "Club broadcast messaging (announcements to all members)", done: false },
          { id: "p2-targeted-msg", label: "Targeted messaging by tier, status, or activity", done: false },
          { id: "p2-event-notices", label: "Event & season notice templates", done: false },
          { id: "p2-scheduled-msg", label: "Scheduled announcements", done: false },
          { id: "p2-newsletter", label: "Newsletter system (auto-generated recurring digest)", done: false },
          { id: "p2-custom-groups", label: "Custom member groups for targeted messaging", done: false },
          { id: "p2-comm-prefs", label: "Member communication preferences (CAN-SPAM)", done: false },
          { id: "p2-comm-analytics", label: "Communication history & analytics (open/bounce tracking)", done: false },
          { id: "p2-events", label: "Event management (tournaments, outings, RSVPs, calendar)", done: false },
          { id: "p2-activity", label: "Member activity dashboard (engagement metrics, trends)", done: false },
          { id: "p2-export", label: "Data export suite (members, financials, bookings — CSV/PDF)", done: false },
          { id: "p2-tier-limits", label: "Club tier limit enforcement (member/property caps + upgrade prompts)", done: false },
          { id: "p2-waitlist", label: "Waitlist management (property + membership waitlists)", done: false },
        ],
      },
      {
        id: "p2-supply",
        title: "2B: Supply-Side Power Tools",
        description: "Tools that make landowners' properties more profitable.",
        items: [
          { id: "p2-seasonal-pricing", label: "Seasonal pricing engine (peak/off-peak, weekend surcharge)", done: false },
          { id: "p2-seasonal-avail", label: "Seasonal availability automation (recurring rules, copy-last-year)", done: false },
          { id: "p2-beats", label: "Property sections / beats (independently bookable)", done: false },
          { id: "p2-pricing-intel", label: "Pricing intelligence (compare rates to similar properties)", done: false },
          { id: "p2-demand-signals", label: "Demand signals (view counts, search appearances, favorites)", done: false },
          { id: "p2-request-book-v2", label: "Request-to-book approval queue with auto-confirm rules", done: false },
          { id: "p2-geo-club-match", label: "Geo-based club matching (auto-suggest nearby clubs when listing a property)", done: false },
          { id: "p2-structured-rules", label: "Structured access rules (barbless, wade-only, check-in times)", done: false },
        ],
      },
      {
        id: "p2-demand",
        title: "2C: Demand-Side Engagement",
        description: "Features that keep anglers coming back.",
        items: [
          { id: "p2-favorites", label: "Favorites / saved properties with availability alerts", done: false },
          { id: "p2-search-ranking", label: "Intelligent search ranking (relevance, ratings, occupancy)", done: false },
          { id: "p2-trip-reports", label: "Trip reports and catch logging (post-trip engagement)", done: false },
          { id: "p2-seasonal-engage", label: "Seasonal re-engagement campaigns (hatch alerts, early-bird)", done: false },
          { id: "p2-fishing-log", label: "Personal fishing log (properties visited, species caught, days)", done: false },
          { id: "p2-group-booking", label: "Group booking coordination (split payment, group invite)", done: false },
          { id: "p2-loyalty", label: "Loyalty / repeat-booking incentives", done: false },
          {
            id: "p2-geo-match",
            label: "Geographic matching — structured location data",
            detail: "Upgrade fuzzy text location matching to structured city/state/region fields with geo coordinates for precise club-to-angler proximity matching.",
            done: false,
          },
        ],
      },
      {
        id: "p2-reviews",
        title: "2D: Review System Enhancements",
        items: [
          { id: "p2-rev-photos", label: "Review photos (with metadata stripping, landowner policy)", done: false },
          { id: "p2-rev-ai", label: "AI-generated review summaries per property listing", done: false },
          { id: "p2-rev-helpful", label: "Helpful votes on individual reviews", done: false },
          { id: "p2-rev-search", label: "Search and filter by rating category", done: false },
          { id: "p2-rev-badges", label: "Reputation badges (Consistently Accurate, Top-Rated Water)", done: false },
          { id: "p2-rev-ranking", label: "Review impact on search ranking and property visibility", done: false },
        ],
      },
      {
        id: "p2-guide-enhance",
        title: "2E: Independent Guide Enhancements",
        items: [
          { id: "p2-guide-packages", label: "Trip packages (multi-day, gear rental, meal add-ons)", done: false },
          { id: "p2-guide-portfolio", label: "Independent guide portfolio / media gallery (photos, videos, highlights)", done: false },
          { id: "p2-guide-variable", label: "Variable pricing by property, season, and group size", done: false },
          { id: "p2-guide-inquiry", label: "Pre-booking inquiry messaging (angler → independent guide before booking)", done: false },
          { id: "p2-guide-bulk-approval", label: "Bulk water approval requests + preferred independent guide status", done: false },
        ],
      },
      {
        id: "p2-infra",
        title: "2F: Testing & Infrastructure",
        description: "Operational maturity for a platform handling financial transactions.",
        items: [
          { id: "p2-tests", label: "Test framework (Vitest unit + Playwright E2E)", done: true },
          { id: "p2-cicd", label: "CI/CD pipeline (GitHub Actions: lint, type-check, test, build)", done: false },
          { id: "p2-monitoring", label: "Monitoring (Sentry deep integration, API latency alerts)", done: false },
          { id: "p2-backups", label: "Database backup verification (automated recovery testing)", done: false },
        ],
      },
      {
        id: "p2-corporate",
        title: "2G: Corporate & Enterprise",
        items: [
          { id: "p2-corp-dashboard", label: "Corporate admin dashboard (utilization, spending, engagement)", done: true },
          { id: "p2-corp-billing", label: "Corporate billing (invoices, PO numbers, net-30 terms)", done: true },
          { id: "p2-corp-events", label: "Enterprise event booking (multi-property, catering, itinerary)", done: false },
          { id: "p2-corp-gifts", label: "Gift certificate programs (branded gift experiences)", done: false },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3 — Category Dominance
  // ═══════════════════════════════════════════════════════════════
  {
    id: "phase3",
    title: "Phase 3 — Category Dominance",
    subtitle: "Make AnglerPass irreplaceable. Defend against future competition.",
    accent: "bg-charcoal",
    sections: [
      {
        id: "p3-intelligence",
        title: "3A: Platform Intelligence",
        items: [
          { id: "p3-health-dash", label: "Marketplace health dashboard (supply/demand balance, funnels)", done: false },
          { id: "p3-dynamic-pricing", label: "Dynamic pricing suggestions (AI-powered rate recommendations)", done: false },
          { id: "p3-quality-score", label: "Quality scoring algorithm (influence search ranking + visibility)", done: false },
          { id: "p3-demand-model", label: "Predictive demand modeling (forecast by region, season, type)", done: false },
          { id: "p3-territory", label: "Automated territory analysis (identify high-potential regions)", done: false },
        ],
      },
      {
        id: "p3-ecosystem",
        title: "3B: Ecosystem Expansion",
        items: [
          { id: "p3-partner-portal", label: "Partner portal (brands, shops, outfitters, conservation orgs)", done: false },
          { id: "p3-conservation-fund", label: "Conservation fund (per-booking habitat contribution, impact reporting)", done: false },
          { id: "p3-content", label: "Content platform (blog, fishing reports, hatch charts, SEO engine)", done: false },
          { id: "p3-mobile", label: "Mobile PWA (offline booking details, GPS navigation, catch logging)", done: false },
          { id: "p3-insurance", label: "Insurance product (per-trip liability coverage via partner)", done: false },
          { id: "p3-guide-cert", label: "Independent guide certification program (continuing education requirements)", done: false },
        ],
      },
      {
        id: "p3-brand-partners",
        title: "3C: Brand & Retail Partnerships",
        items: [
          { id: "p3-sponsored", label: "Sponsored listings (featured properties, promoted independent guides)", done: false },
          { id: "p3-affiliate", label: "Affiliate program expansion (new brand partnerships, premium placements)", detail: "Core three-tier affiliate system built in Phase 1. Phase 3 expands brand roster, adds sponsored/premium product placements, and scales retailer fallback network.", done: false },
          { id: "p3-fly-shops", label: "Fly shop partnerships (regional directories, gear rental)", done: false },
          { id: "p3-lodging", label: "Lodging referral partnerships (structured booking, commission)", detail: "V1 lodging display shipped — V2 Hospitable integration fields ready.", done: false },
          { id: "p3-tourism", label: "Tourism board partnerships (data licensing, co-marketing)", done: false },
        ],
      },
    ],
  },
];
