# Payment & Payout Architecture

## Overview

AnglerPass processes payments from anglers and distributes payouts to landowners and clubs. The platform takes a percentage fee on each transaction. Stripe and Stripe Connect handle all payment processing, connected account management, and regulatory compliance.

---

## Payment Flow

```
Angler pays
  |
  v
Stripe Payment Intent (hold or capture)
  |
  v
AnglerPass platform account receives funds
  |
  v
Platform fee deducted
  |
  v
Stripe Transfer to landowner/club Connected Account
  |
  v
Landowner/club receives payout to their bank
```

### Detailed Steps

1. **Angler initiates booking.** The frontend creates a Stripe Payment Intent via an API route. For request-to-book, the intent is authorized (hold) but not captured. For instant book, it is captured immediately.

2. **Hold period (request-to-book only).** The payment hold lasts up to 7 days. If the landowner confirms within 48h, the hold is captured. If declined or expired, the hold is released (no charge to angler).

3. **Platform fee calculation.** The 15% platform fee is charged on top of the rod fee (paid by the angler). Rod fees pass through in full to the landowner/club split. Fee is calculated as: `platform_fee = base_rod_fee_cents * 0.15`.

4. **Transfer to Connected Account.** Stripe Transfer moves funds from the AnglerPass platform account to the landowner's Connected Account. Transfers are batched daily or triggered on confirmation, depending on configuration.

5. **Payout to bank.** Stripe automatically pays out the Connected Account balance to the landowner's bank account on their configured schedule (daily, weekly, or monthly).

---

## Fee Structure

| Transaction Type      | Platform Fee        | Notes                                                        |
|-----------------------|---------------------|--------------------------------------------------------------|
| Booking platform fee  | 15%                 | On top of rod fee, paid by angler                            |
| Cross-club access fee | $25/rod/day         | $15 AnglerPass + $10 referring club                          |
| Guide service fee     | 10%                 | On guide rate, paid by angler. Guide keeps 100% of their rate. |
| Club membership       | 5%                  | On initiation fees + annual dues, paid by member              |
| Upfront lease         | 5%                  | On club → landowner ACH payment                              |

The 15% booking platform fee is a markup on the rod fee — it does not reduce the rod-fee split below. Rod fees flow through to the landowner/club via one of two models (see below). Fee math is in `src/lib/constants/fees.ts` and is the single source of truth.

### Rod Fee Split (default property pricing mode)

Each property has a classification that determines how the base rod fee is split between the managing club and the landowner:

| Classification | Club share | Landowner share |
|---|---|---|
| Select    | 50% | 50% |
| Premier   | 35% | 65% |
| Signature | 25% | 75% |

The split is snapshotted onto each booking at creation time (`club_split_pct`, `landowner_split_pct`) so reclassifying a property later never rewrites history.

### Upfront Lease (alternative property pricing mode)

Instead of a per-booking split, the club pays the landowner an agreed annual amount via ACH. AnglerPass takes 5%; 95% flows to the landowner. On bookings at a leased property, the club keeps 100% of the rod fee (the landowner has already been paid). The lease lifecycle is:

```
proposed  →  under_negotiation  →  agreed  →  active  →  expired
(landowner)  (counter/reply)     (ACH init) (webhook)  (past due / cron)
```

Endpoints:

| Endpoint | Actor | Effect |
|---|---|---|
| `POST /api/properties/:id/lease/propose` | Landowner | Sets `lease_status = 'proposed'`, records proposed amount |
| `POST /api/properties/:id/lease/respond` | Club admin | accept / counter / decline |
| `POST /api/properties/:id/lease/pay`     | Club admin | Creates ACH PaymentIntent (us_bank_account only) |

`payment_intent.succeeded` with `metadata.type = 'property_lease_payment'` flips `lease_status → active`, records the succeeded ledger row in `property_lease_payments`, and creates a Stripe Transfer to the landowner's Connected Account for the 95% net. A nightly cron (`/api/cron/lease-renewal`) sends reminders at T-30 and T-7 and flips past-due leases to `expired` + `status = draft`.

### Staff Discount

Staff of the managing club booking at their own club get the club's share of the rod fee as their discount (Select 50%, Premier 35%, Signature 25%; in lease mode 100%). The discount is absorbed entirely by the club — the landowner still receives their full classification share of the gross rod fee. Staff of *other* clubs (cross-club bookings) do not get the discount.

---

## Stripe Connect Setup

### Connected Accounts

Each landowner and club admin creates a Stripe Connected Account during onboarding. AnglerPass uses **Standard Connect** accounts:

- Landowner goes through Stripe's hosted onboarding (identity verification, bank account linking)
- AnglerPass stores the `stripe_account_id` on the `profiles` table
- Landowners can access their Stripe dashboard directly for detailed transaction history

### Why Standard Connect (not Express or Custom)

- Lower platform liability for KYC/AML compliance
- Landowners get a full Stripe dashboard
- Simpler to implement
- No need to build custom payout UIs

---

## Subscription Plans

### Club Subscriptions (Stripe Billing)

Clubs can offer membership tiers with recurring billing:

| Plan Element       | Implementation                              |
|--------------------|---------------------------------------------|
| Monthly/annual     | Stripe Price objects linked to `memberships` |
| Free trial         | Stripe trial periods                        |
| Cancellation       | Immediate or end-of-period                  |
| Upgrades/downgrades| Stripe proration                            |

The `memberships.stripe_price_id` column links each tier to a Stripe Price. When an angler subscribes, a Stripe Subscription is created and the `club_memberships.stripe_sub_id` is stored.

### Angler Premium Tiers (Future)

AnglerPass may offer premium angler subscriptions with benefits like:
- Early access to new listings
- Reduced booking fees (passed to angler as discount)
- Priority in request-to-book queues
- Access to exclusive properties

These would be direct Stripe Subscriptions to AnglerPass (not through Connect).

---

## Refund Policies

### Angler-Initiated Cancellation

Refund amount depends on the property's cancellation window (stored in `property_rules`):

| Timing                            | Refund              |
|-----------------------------------|----------------------|
| Before cancellation window        | Full refund          |
| Within cancellation window        | 50% refund           |
| Day of fishing or no-show         | No refund            |

### Landowner-Initiated Cancellation

If a landowner cancels a confirmed booking:
- Angler receives a **full refund**
- Landowner's cancellation count is tracked
- Repeated cancellations trigger a warning and potential account restriction

### Disputes

Stripe handles chargebacks. AnglerPass provides evidence (booking confirmation, waiver signatures, GPS access logs) to contest disputes. The `audit_log` is the primary source of evidence.

---

## Tax Considerations

### 1099-K Reporting

Stripe handles 1099-K generation for Connected Accounts that exceed IRS thresholds. AnglerPass collects TIN/SSN during Stripe onboarding.

### State Sales Tax

Fishing access may be subject to state sales tax or excise tax depending on jurisdiction. AnglerPass will integrate **Stripe Tax** to automatically calculate and collect applicable taxes based on the property's location.

Tax is added on top of the booking price (angler pays), not deducted from the landowner's share.

### Tax-Exempt Organizations

Some fishing clubs are 501(c)(3) or 501(c)(7) organizations. The platform will support marking club accounts as tax-exempt, with verification via EIN lookup.

---

## Webhook Handling

Stripe webhooks drive payment state updates:

| Webhook Event                    | Action                                      |
|----------------------------------|---------------------------------------------|
| `payment_intent.succeeded`       | Mark payment as `succeeded`, confirm booking|
| `payment_intent.payment_failed`  | Mark payment as `failed`, notify angler     |
| `charge.refunded`                | Mark payment as `refunded`, update booking  |
| `invoice.paid`                   | Renew club membership                       |
| `invoice.payment_failed`         | Warn member, grace period starts            |
| `customer.subscription.deleted`  | Cancel club membership                      |
| `account.updated`               | Update Connected Account status             |
| `payment_intent.succeeded` (lease) | Activate lease, insert succeeded ledger row, transfer 95% to landowner |
| `payment_intent.payment_failed` (lease) | Mark ledger row failed, revert property to `agreed` for retry |

Webhook handler: `src/app/api/webhooks/stripe/route.ts` (to be created in Layer 2).

All webhook events are logged to `audit_log` with `actor_id = null` and `action = 'stripe.{event_type}'`.

---

## Security

- **No card data touches AnglerPass servers.** All payment information is collected via Stripe Elements (client-side). The API only handles Payment Intent IDs and tokens.
- **Webhook signature verification.** All incoming Stripe webhooks are verified using `stripe.webhooks.constructEvent()` before processing.
- **Idempotency.** Webhook handlers use Stripe event IDs as idempotency keys to prevent double-processing.
- **PCI compliance.** By using Stripe Elements and never handling raw card data, AnglerPass qualifies for SAQ-A (simplest PCI compliance level).

---

## Implementation Notes

- **All monetary values in cents.** `amount_cents`, `platform_fee_cents`, `price_cents` -- never use floats for money.
- **Currency is always USD for launch.** The `currency` column exists for future internationalization but is hardcoded to `usd` initially.
- **Payment Intent metadata.** Every Payment Intent includes `booking_id` or `club_membership_id` in its metadata for reconciliation.
- **Payout schedule.** Landowners default to weekly payouts. They can change this in their Stripe dashboard.
