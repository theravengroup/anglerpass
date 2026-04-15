# ADR 006: Property Pricing Model

## Status

Accepted

## Context

AnglerPass originally used a single, flat payment model for fishing access bookings: a fixed $5/rod "club commission" on top of whatever rod fee the landowner listed, with the rest flowing 100% to the landowner. This worked as a placeholder but didn't reflect how private water is actually valued or how clubs and landowners share risk.

Two problems emerged:

1. **Different properties deserve different splits.** A marginal shared-use creek is not the same product as a fully private spring creek. A single fixed split undervalued premium water and made the platform hostile to landowners who wanted parity with what clubs charge members.

2. **Some landowners don't want variable income.** They want a guaranteed annual payment and don't want to watch a calendar. Clubs are willing to pay for that certainty when the water is good enough to book out reliably.

We also needed to rebalance cross-club fees. The old split ($20 AP / $5 referring club) gave almost nothing back to the club whose member was generating the revenue, which suppressed cross-club referrals.

## Decision

We replaced the flat $5 commission with a **two-mode property pricing system**:

### Mode A — Rod fee split (default)

Each property is assigned one of three classifications:

| Classification | Club share | Landowner share |
|---|---|---|
| Select | 50% | 50% |
| Premier | 35% | 65% |
| Signature | 25% | 75% |

The split applies to the base rod fee set by the landowner. AnglerPass charges a separate 15% platform fee on top (paid by the angler). Per-booking payouts run on the landowner payout schedule.

### Mode B — Upfront lease

The club pays the landowner an agreed annual amount via ACH. The landowner receives 100% of the agreed amount; AnglerPass's 5% facilitation fee is charged on top to the club (landowner asks $5,000 → landowner gets $5,000, club is charged $5,250). After the lease is active:

- Rod fees on bookings at this property flow 100% to the managing club.
- AnglerPass still charges the 15% angler platform fee.
- Lease expires on `lease_paid_through`; the lease-renewal cron nudges at T-30 and T-7 and flips expired leases to `draft`.

Lease negotiation is a three-step flow:

1. Landowner proposes an amount → `lease_status = 'proposed'`
2. Club accepts, counters, or declines → `agreed` / `under_negotiation` / cleared
3. Club funds via ACH PaymentIntent (landowner amount + 5% fee) → webhook flips to `active`, transfers the full agreed amount via Connect to the landowner, opens the booking pipeline

### Cross-club rebalance

Cross-club booking fee stays at $25/rod/day but the split changed from $20/$5 to **$15 AnglerPass / $10 referring club** — doubling what the angler's home club receives for sending a booking outside.

### Snapshotting

`bookings` stores `property_classification`, `pricing_mode`, `club_split_pct`, `landowner_split_pct`, `referring_club_id`, `managing_club_id` at creation. Payout logic reads these snapshot columns rather than recomputing from current property state, so reclassifying a property later never rewrites history.

### Publishing gate

A trigger on `properties.status = 'published'` enforces:
- `rod_fee_split` mode must have a classification
- `upfront_lease` mode must have `lease_status = 'active'`

This keeps the onboarding UI and the API in lockstep.

## Consequences

**Positive**
- Landowners can pick a pricing model that matches their preference for certainty vs upside.
- Premium water is rewarded proportionally (75% to landowner for Signature).
- Snapshotted bookings make pricing changes safe and auditable.
- Cross-club splits incentivize referrals between partner clubs.
- Staff discount math is now explicit (absorbed entirely by the club) — landowner payout is unaffected.

**Negative**
- More pricing concepts for landowners to learn during onboarding.
- ACH settlement is asynchronous (3–5 business days); the club UI needs to communicate "pending lease" state clearly.
- Lease renewals are an ongoing operational surface (cron, notifications, expiration handling).

**Migration path**
- Pre-launch. Migration 00094 defaults all existing (stub) properties to `rod_fee_split`. No real bookings to backfill.
- Booking snapshot columns default to 0/0 on legacy rows; they are only read for bookings created after the migration.

## References

- `supabase/migrations/00094_property_pricing_model.sql`
- `src/lib/constants/fees.ts` — single source of truth for split math
- `src/app/api/properties/[id]/lease/*` — negotiation + payment endpoints
- `src/app/api/webhooks/stripe/route.ts` — `handleLeasePaymentSucceeded`
- `src/app/api/cron/lease-renewal/route.ts` — reminders and expiration
- `docs/architecture/payments.md`
