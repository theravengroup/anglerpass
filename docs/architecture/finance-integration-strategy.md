# AnglerPass Financial Systems Integration Strategy

## A. Executive Summary

AnglerPass operates a multi-sided marketplace with five revenue streams: booking platform fees (15%), cross-club network fees ($25/rod/day), guide service fees (10%), membership processing fees (3.5%), and Compass AI credit packs. Payments flow through Stripe (direct charges + Connect transfers to landowners, clubs, and guides), banking lives in Mercury, and bookkeeping is handled by Puzzle.io.

**Current state:** The codebase has a well-built Stripe integration with webhook handlers, Connect onboarding, fee calculation, manual capture/release, payout distribution, and per-role financial dashboards. What's missing is the operational finance layer — there is no automated reconciliation between Stripe payouts and Mercury deposits, no exception detection, no daily cash snapshots, and no payout-to-bank matching. Puzzle connects natively to both Stripe and Mercury, but its API is partner-restricted, so we cannot programmatically push data into it.

**Recommendation:** Option D — Hybrid approach. Let Puzzle handle accounting via its native Stripe + Mercury integrations. Build a lightweight internal finance operations layer that pulls from Stripe and Mercury APIs to provide reconciliation, exception detection, cash visibility, and operational dashboards. Do not duplicate Puzzle's accounting work. Instead, own the operational intelligence that Puzzle doesn't provide.

**Estimated Phase 1 effort:** 2-3 weeks engineering. Returns immediate value via automated payout-to-deposit matching and daily cash summaries.

---

## B. Key Integration Opportunities

### Native Integrations (Already Available)

| From | To | Method | What Syncs |
|------|----|--------|------------|
| Stripe | Puzzle | Direct API | Invoices, payment status, revenue recognition |
| Mercury | Puzzle | Direct API | Transactions, balances, auto-categorization (~90%) |
| Stripe | AnglerPass | Webhooks + API | Already built — charges, payouts, disputes, Connect |
| Mercury | AnglerPass | API + Webhooks | Available but not yet integrated |

### API-Based Opportunities (Build)

| Integration | Value | Effort |
|-------------|-------|--------|
| Mercury Transactions API -> AnglerPass | Match Stripe payouts to bank deposits | Medium |
| Mercury Webhooks -> AnglerPass | Real-time deposit detection | Low |
| Stripe Balance Transactions API -> AnglerPass | Itemize what's in each payout | Medium |
| Stripe Payouts API -> AnglerPass | Track payout lifecycle + arrival dates | Low |
| Mercury Accounts API -> AnglerPass | Daily cash balance snapshots | Low |

### What Can't Be Done

| Gap | Reason | Workaround |
|-----|--------|------------|
| Push custom data into Puzzle | API is partner-restricted | Let Puzzle's native integrations handle it; manage operational data internally |
| Read data from Puzzle | Same restriction | Pull from Stripe/Mercury directly; treat Puzzle as accounting endpoint only |
| Real-time Mercury webhooks in sandbox | Mercury limitation | Test with polling in dev, webhooks in production |
| Match manual Stripe payouts to balance transactions | Stripe limitation for manual payouts | Use automatic payouts (already the default) |

---

## C. Constraints and Blind Spots

1. **Puzzle API is off-limits** unless we join their Partner Program. All Puzzle interaction must flow through their native Stripe/Mercury integrations and their UI. We cannot programmatically create journal entries, read chart of accounts, or trigger reconciliation.

2. **Puzzle syncs daily overnight**, not real-time. Any "real-time" financial visibility must come from our own layer pulling directly from Stripe and Mercury.

3. **Mercury webhooks are not available in sandbox.** Development must use polling against the transactions API, switching to webhooks in production.

4. **Stripe payout reconciliation** only works for automatic payouts. The `payout` filter on balance_transactions requires automatic payout mode (which is the default and what we should use).

5. **Timing gap between Stripe payout creation and Mercury deposit.** Standard US payouts take ~2 business days. Our reconciliation logic must account for this lag window.

6. **Stripe Connect complicates reconciliation.** Platform charges, transfers to connected accounts, and application fees each create separate balance transactions. Our payout itemization must handle all types.

7. **Puzzle does not generate a cash flow statement.** If we need one, we build it ourselves from Stripe + Mercury data.

8. **Mercury rate limit is 2,000 requests per 5 minutes.** Sufficient for our scale, but batch operations should respect this.

---

## D. Recommended Architecture

### Option Comparison

| Criteria | A: Native Only | B: Light Middleware | C: Rich Ops Layer | D: Hybrid |
|----------|---------------|--------------------|--------------------|-----------|
| Complexity | Very Low | Low | High | Medium |
| Reliability | High (fewer moving parts) | High | Medium (more code = more bugs) | High |
| Maintenance | Minimal | Low | Significant | Low-Medium |
| Data completeness | Low (Puzzle-only) | Good | Excellent | Good-Excellent |
| Finance team usability | Poor (no dashboards) | Good | Excellent | Good |
| Cost efficiency | Best | Good | Expensive | Good |
| Sync drift risk | Low | Low | Medium | Low |
| Suitability for growing co | Poor (outgrow fast) | Good | Premature | Best |

### Recommendation: Option D — Hybrid

**Let Puzzle own accounting. Let our platform own operations.**

```
                    ┌──────────────┐
                    │   Puzzle.io  │ <-- Accounting endpoint
                    │  (Hands-off) │     Native Stripe + Mercury sync
                    └──────┬───────┘     Auto-categorization
                           │             Month-end close
                           │
    ┌──────────┐     ┌─────┴──────┐     ┌──────────┐
    │  Stripe  │────>│  AnglerPass│<────│  Mercury  │
    │          │     │  Finance   │     │           │
    │ Webhooks │     │  Ops Layer │     │ API/Hooks │
    │ + API    │     └────────────┘     └───────────┘
    └──────────┘           │
                           ▼
                    ┌──────────────┐
                    │   Internal   │
                    │  Dashboard   │
                    │  + Alerts    │
                    └──────────────┘
```

**What Puzzle handles:**
- Chart of accounts
- Transaction categorization (90%+ auto)
- Bank reconciliation
- P&L, Balance Sheet
- Month-end close workflow
- Tax package generation

**What our Finance Ops Layer handles:**
- Stripe payout tracking and lifecycle
- Mercury deposit matching
- Automated reconciliation (payout <-> deposit)
- Exception detection (unmatched, timing anomalies, amount mismatches)
- Daily cash snapshots
- Revenue decomposition (gross -> fees -> net -> settled)
- Operational dashboards for admin
- Alerting (large refunds, disputes, payout failures, unmatched deposits)
- Data that Puzzle can't surface (per-booking fee breakdowns, Connect transfer tracking)

---

## E. Detailed Use Cases

### E1. Stripe Payout -> Mercury Deposit Matching

**Flow:** Stripe creates payout (po_xxx) -> payout.paid webhook fires -> we record expected arrival_date + amount -> Mercury transaction.created webhook fires when deposit lands -> we match by amount + date window + counterparty "STRIPE" -> mark reconciled.

**Why it matters:** This is the single most valuable automation. Without it, someone manually checks the bank every day to confirm Stripe deposits arrived.

**Source:** Stripe Payouts API + Webhooks, Mercury Transactions API + Webhooks.
**Frequency:** Real-time (webhook-driven).

### E2. Payout Itemization

**Flow:** When a payout is created, query `GET /v1/balance_transactions?payout={po_xxx}` to get every charge, refund, fee, and adjustment included in that payout. Store the breakdown.

**Why it matters:** Answers "what's in this deposit?" without logging into Stripe Dashboard.

**Source:** Stripe Balance Transactions API.
**Frequency:** On each payout.created webhook.

### E3. Exception Detection

**Scenarios:**
- Stripe payout marked `paid` but no Mercury deposit within 3 business days
- Mercury deposit amount doesn't match any pending Stripe payout
- Stripe payout failed (payout.failed webhook)
- Large refund (>$500) processed
- New dispute created
- Connected account payout failure

**Why it matters:** Catches problems before they become month-end surprises.

**Source:** Reconciliation engine comparing stripe_payouts vs mercury_transactions.
**Frequency:** Daily automated scan + real-time for webhook-triggered exceptions.

### E4. Daily Cash Summary

**Snapshot:**
- Mercury account balances (all accounts)
- Stripe pending balance + available balance
- Today's gross processed (sum of succeeded payment intents)
- Today's net settled (payouts arriving today)
- Pending payouts (created but not yet arrived)
- Unmatched items count

**Source:** Mercury Accounts API, Stripe Balance API.
**Frequency:** Daily (cron at 7 AM ET).

### E5. Revenue Decomposition

**Track daily/weekly/monthly:**
- Gross booking revenue
- Platform fees (15%)
- Cross-club fees
- Guide service fees
- Membership processing fees
- Compass credit revenue
- Stripe processing fees
- Net revenue (what stays in our Stripe account)
- Net settled (what actually hit Mercury)

**Source:** Existing booking/payment data in our database + Stripe balance transactions.
**Frequency:** Daily rollup.

### E6. Month-End Close Support

**Automated pre-close checklist:**
- All Stripe payouts for the month have corresponding Mercury deposits
- No unresolved exceptions
- Refund totals match between Stripe and our records
- Dispute status summary
- Connected account transfer totals match booking payout records
- Compass credit revenue reconciled

**Source:** Reconciliation engine.
**Frequency:** On-demand + automated on last day of month.

---

## F. Data Model Proposal

### F1. `finance_stripe_payouts`

Tracks Stripe payout lifecycle and reconciliation state.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| stripe_payout_id | text UNIQUE | Stripe payout ID (po_xxx) |
| amount | numeric(12,2) | Payout amount |
| currency | text | Currency code |
| status | text | pending/in_transit/paid/failed/canceled |
| arrival_date | date | Expected bank arrival |
| created_at | timestamptz | Stripe creation time |
| paid_at | timestamptz | When Stripe marked paid |
| failed_at | timestamptz | When failed (if applicable) |
| failure_code | text | Stripe failure code |
| failure_message | text | Stripe failure message |
| method | text | standard/instant |
| description | text | Statement descriptor |
| trace_id | text | Bank trace ID (when available) |
| balance_transaction_id | text | Stripe balance txn for the payout itself |
| item_count | int | Number of balance transactions in payout |
| gross_amount | numeric(12,2) | Sum of charges in payout |
| fee_amount | numeric(12,2) | Sum of Stripe fees in payout |
| refund_amount | numeric(12,2) | Sum of refunds in payout |
| reconciliation_status | text | pending/matched/unmatched/exception |
| matched_mercury_txn_id | uuid FK | Link to matched Mercury transaction |
| matched_at | timestamptz | When matched |
| metadata | jsonb | Additional Stripe metadata |
| synced_at | timestamptz | Last sync from Stripe |

### F2. `finance_stripe_balance_txns`

Itemized record of every balance transaction (for payout drill-down).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| stripe_balance_txn_id | text UNIQUE | Stripe balance transaction ID (txn_xxx) |
| stripe_payout_id | text FK | Which payout this belongs to |
| type | text | charge/refund/payout/transfer/adjustment/dispute |
| amount | numeric(12,2) | Gross amount |
| fee | numeric(12,2) | Stripe fee |
| net | numeric(12,2) | Net amount |
| currency | text | Currency |
| source_id | text | Source object ID (ch_xxx, re_xxx, etc.) |
| source_type | text | charge/refund/transfer/etc. |
| description | text | Transaction description |
| available_on | timestamptz | When funds become available |
| created_at | timestamptz | Stripe creation time |
| reporting_category | text | Stripe reporting category |
| booking_id | uuid | Linked AnglerPass booking (if applicable) |
| metadata | jsonb | Source object metadata |
| synced_at | timestamptz | Last sync |

### F3. `finance_mercury_transactions`

Mirror of Mercury transactions for reconciliation.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| mercury_txn_id | text UNIQUE | Mercury transaction ID |
| mercury_account_id | text | Mercury account |
| amount | numeric(12,2) | Transaction amount |
| status | text | pending/sent/cancelled/failed/reversed |
| counterparty_name | text | Counterparty (e.g. "STRIPE") |
| bank_description | text | Bank description field |
| external_memo | text | External memo |
| note | text | Internal note |
| created_at | timestamptz | Mercury creation time |
| posted_at | timestamptz | When posted to bank |
| mercury_category | text | Mercury's merchant category |
| is_stripe_deposit | boolean | Flagged as Stripe-originated |
| reconciliation_status | text | pending/matched/unmatched/ignored |
| matched_payout_id | uuid FK | Link to matched Stripe payout |
| matched_at | timestamptz | When matched |
| synced_at | timestamptz | Last sync |

### F4. `finance_mercury_accounts`

Mercury account snapshots.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| mercury_account_id | text UNIQUE | Mercury account ID |
| name | text | Account name |
| account_number_last4 | text | Last 4 digits |
| kind | text | checking/savings/treasury |
| available_balance | numeric(12,2) | Available balance |
| current_balance | numeric(12,2) | Current balance |
| last_snapshot_at | timestamptz | Last balance update |

### F5. `finance_reconciliation_exceptions`

Items that need human review.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| type | text | unmatched_payout/unmatched_deposit/amount_mismatch/payout_failed/timing_anomaly/large_refund/dispute |
| severity | text | info/warning/critical |
| stripe_payout_id | text | Related payout (nullable) |
| mercury_txn_id | text | Related Mercury txn (nullable) |
| expected_amount | numeric(12,2) | Expected amount |
| actual_amount | numeric(12,2) | Actual amount |
| description | text | Human-readable description |
| status | text | open/investigating/resolved/dismissed |
| resolved_by | uuid | Admin who resolved |
| resolved_at | timestamptz | Resolution time |
| resolution_note | text | How it was resolved |
| created_at | timestamptz | When detected |

### F6. `finance_daily_snapshots`

Daily financial summary for trending and reporting.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| snapshot_date | date UNIQUE | The date |
| gross_processed | numeric(12,2) | Total payment intents succeeded |
| stripe_fees | numeric(12,2) | Total Stripe processing fees |
| refunds_issued | numeric(12,2) | Total refunds |
| net_revenue | numeric(12,2) | Platform revenue (our fees) |
| payouts_created | numeric(12,2) | Payouts initiated to Mercury |
| payouts_arrived | numeric(12,2) | Payouts confirmed landed |
| mercury_balance | numeric(12,2) | Mercury end-of-day balance |
| stripe_available_balance | numeric(12,2) | Stripe available balance |
| stripe_pending_balance | numeric(12,2) | Stripe pending balance |
| open_exceptions | int | Unresolved exception count |
| booking_count | int | Bookings confirmed today |
| dispute_count | int | Disputes opened today |
| compass_credit_revenue | numeric(12,2) | Compass credit pack revenue |
| membership_revenue | numeric(12,2) | Membership fee revenue |
| created_at | timestamptz | Snapshot time |

### F7. `finance_sync_status`

Tracks sync health for each external system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| system | text UNIQUE | stripe_payouts/stripe_balance_txns/mercury_transactions/mercury_accounts |
| last_sync_at | timestamptz | Last successful sync |
| last_sync_status | text | success/failed/partial |
| last_error | text | Error message if failed |
| records_synced | int | Count in last sync |
| next_sync_at | timestamptz | Scheduled next sync |

---

## G. Reconciliation Logic

### G1. Matching a Stripe Payout to a Mercury Deposit

```
ON payout.paid webhook:
  1. Record payout in finance_stripe_payouts (status = paid, arrival_date known)
  2. Query Mercury transactions API:
     - counterpartyName contains "STRIPE"
     - amount = payout.amount (exact match)
     - postedAt within arrival_date ± 2 business days
  3. IF exactly one match found:
     - Link payout -> mercury transaction (set matched IDs on both)
     - Set reconciliation_status = "matched" on both
  4. IF zero matches found:
     - Set payout reconciliation_status = "pending"
     - Schedule re-check in 1 business day
  5. IF multiple matches found:
     - Create exception (type = "amount_mismatch", severity = "warning")
     - Requires human review

ON mercury transaction.created webhook:
  1. Record transaction in finance_mercury_transactions
  2. IF counterparty contains "STRIPE":
     - Flag is_stripe_deposit = true
     - Search finance_stripe_payouts for unmatched payout with:
       - amount = transaction.amount
       - arrival_date within ± 2 business days of transaction.posted_at
     - IF match found: link and mark both reconciled
     - IF no match: set reconciliation_status = "unmatched"

DAILY SWEEP (cron):
  1. Find all payouts with reconciliation_status = "pending"
     where paid_at < now() - 3 business days
  2. Re-attempt match against Mercury
  3. If still unmatched after 5 business days:
     - Create exception (type = "unmatched_payout", severity = "critical")
  4. Find all Mercury Stripe deposits with reconciliation_status = "unmatched"
     where posted_at < now() - 3 business days
  5. Create exception (type = "unmatched_deposit", severity = "warning")
```

### G2. Itemizing Balance Transactions in a Payout

```
ON payout.created webhook:
  1. Query GET /v1/balance_transactions?payout={payout_id}&limit=100
  2. Page through all results (cursor-based)
  3. For each balance transaction:
     - Insert into finance_stripe_balance_txns
     - If source_type = "charge", attempt to link booking_id via:
       a. Expand source to get charge.metadata.booking_id
       b. Or match charge.payment_intent to bookings.stripe_payment_intent_id
  4. Calculate and store on payout record:
     - item_count = total transactions
     - gross_amount = SUM(amount) WHERE type = 'charge'
     - fee_amount = SUM(fee) WHERE type = 'charge'
     - refund_amount = SUM(amount) WHERE type = 'refund'
```

### G3. Detecting Partial Failures and Timing Differences

```
TIMING TOLERANCE:
  - Standard payout: arrival_date ± 2 business days
  - Instant payout: arrival_date ± 1 day
  - Holiday/weekend adjustment: skip non-business days

AMOUNT TOLERANCE:
  - Exact match required (to the cent)
  - If Mercury deposit is within $0.01 of payout (rounding):
    match but flag with info-level note

PARTIAL FAILURE DETECTION:
  - Payout status changes to "failed" -> create critical exception
  - Payout amount changes (rare, but possible with disputes) -> create warning
  - Multiple small Mercury deposits summing to payout amount -> flag for review
```

### G4. Revenue Decomposition

```
FOR each reporting period:
  Gross Processed = SUM(balance_txns.amount WHERE type = 'charge')
  Stripe Fees = SUM(balance_txns.fee WHERE type = 'charge')
  Refunds = SUM(ABS(balance_txns.amount) WHERE type = 'refund')
  Dispute Debits = SUM(ABS(balance_txns.amount) WHERE type = 'dispute')
  Dispute Reversals = SUM(balance_txns.amount WHERE type = 'dispute_reversal')
  
  Net Stripe Activity = Gross - Stripe Fees - Refunds - Dispute Debits + Dispute Reversals
  
  Platform Revenue = SUM(bookings.platform_fee) in period
  Cross-Club Revenue = SUM(bookings.cross_club_fee * AP_share_pct) in period  
  Guide Service Revenue = SUM(bookings.guide_service_fee) in period
  Membership Revenue = SUM(membership_payments.processing_fee) in period
  Compass Revenue = SUM(compass_purchases.amount_cents / 100) in period
  
  Total AnglerPass Revenue = Platform + CrossClub + GuideService + Membership + Compass
  
  Connected Account Transfers = SUM(balance_txns.amount WHERE type = 'transfer')
  Net Cash to Mercury = Net Stripe Activity - Connected Account Transfers
```

---

## H. Dashboard / Reporting Plan

### H1. Finance Operations Dashboard (Admin)

| Widget | Why It Matters | Source | Refresh |
|--------|---------------|--------|---------|
| Today's Gross Processed | Real-time revenue pulse | Stripe API (or DB bookings) | Real-time |
| Today's Net Settled | Cash that actually landed today | Mercury API | Hourly |
| Pending Stripe Payouts | Cash in transit to Mercury | finance_stripe_payouts | Real-time |
| Mercury Cash Balance | Available operating cash | finance_mercury_accounts | Hourly |
| Unmatched Items | Reconciliation health | finance_reconciliation_exceptions | Real-time |
| Refunds (7d / 30d) | Refund rate monitoring | Stripe API / DB | Daily |
| Open Disputes | Chargeback risk | Stripe API / DB | Real-time |
| Stripe Fee Total (MTD) | Cost of payment processing | finance_stripe_balance_txns | Daily |
| Net Revenue by Day (chart) | Revenue trend | finance_daily_snapshots | Daily |
| Exception Queue | Items needing review | finance_reconciliation_exceptions | Real-time |
| Month-End Readiness Score | Close preparedness | Reconciliation engine | Daily |

### H2. Month-End Readiness Score

Calculated as percentage of checklist items passing:
- [ ] All payouts for the month are matched (weight: 30%)
- [ ] No critical exceptions open (weight: 25%)
- [ ] Refund totals reconciled (weight: 15%)
- [ ] Dispute statuses up to date (weight: 10%)
- [ ] Connect transfers match booking records (weight: 10%)
- [ ] Mercury balance matches expected (weight: 10%)

Display as a percentage with color coding: green (>90%), yellow (70-90%), red (<70%).

### H3. Reports

| Report | Contents | Frequency |
|--------|----------|-----------|
| Daily Cash Summary | All metrics from finance_daily_snapshots | Daily email/Slack |
| Weekly Cash Flow | 7-day trend, WoW comparison | Weekly |
| Payout Reconciliation | All payouts for period with match status | On demand |
| Exception Report | Open exceptions with aging | On demand |
| Revenue Breakdown | Gross -> fees -> net -> settled by stream | Monthly |
| Connect Transfer Audit | All transfers to connected accounts by party | Monthly |

---

## I. Puzzle Operating Model

### What flows directly into Puzzle (native integrations)

1. **Stripe -> Puzzle:** Invoices, payment statuses, subscription events. Puzzle auto-categorizes these against its chart of accounts. Revenue recognition is handled by Puzzle's rules engine.

2. **Mercury -> Puzzle:** All bank transactions sync automatically. Puzzle categorizes ~90% of them without human input. Stripe deposits appear as Mercury transactions and get matched to Stripe data.

### What stays in our internal operations layer

- Per-booking fee decomposition (platform fee, cross-club fee, guide fee, club commission, landowner payout)
- Payout-to-deposit reconciliation with exact matching
- Exception detection and resolution workflow
- Cash flow forecasting inputs
- Operational dashboards
- Alert automation

### Should we push custom data into Puzzle?

**No.** Puzzle's API is partner-restricted. Even if we had access, pushing custom entries risks creating duplicates with data Puzzle already ingests natively from Stripe and Mercury. The cleanest model:

- Puzzle = source of truth for **accounting** (P&L, balance sheet, tax)
- Our finance ops layer = source of truth for **operational finance** (reconciliation, exceptions, cash flow)
- Stripe = source of truth for **payment data**
- Mercury = source of truth for **bank data**

### Avoiding duplicates

Puzzle's native integrations already ingest Stripe invoices and Mercury transactions. We must NOT also push the same data through CSV imports or manual entries. Our system reads from Stripe and Mercury directly — it never writes to Puzzle.

If Puzzle's auto-categorization misses something (the remaining ~10%), the finance team corrects it in Puzzle's UI. Over time, Puzzle's ML learns from corrections and the manual rate drops.

---

## J. Alerting + Automation Plan

### Real-Time Alerts (Webhook-Driven)

| Event | Trigger | Severity | Channel |
|-------|---------|----------|---------|
| Payout failed | payout.failed webhook | Critical | Email + Slack + Dashboard |
| Dispute opened | charge.dispute.created webhook | Warning | Email + Dashboard |
| Large refund (>$500) | refund.created webhook, amount check | Warning | Dashboard |
| Connected account issue | account.updated, charges_enabled=false | Critical | Email + Dashboard |

### Scheduled Alerts (Cron-Driven)

| Alert | Schedule | Content |
|-------|----------|---------|
| Daily cash summary | 7:00 AM ET | Balances, payouts, exceptions |
| Unmatched payout (>3 days) | Daily | List of payouts without Mercury match |
| Weekly cash flow summary | Monday 8:00 AM ET | 7-day trend, WoW changes |
| Month-end exceptions | Last 3 days of month | All open exceptions with aging |
| Reconciliation health check | Daily | System sync status, error counts |

### Automation

| Automation | Trigger | Action |
|-----------|---------|--------|
| Payout ingestion | payout.created/paid/failed webhooks | Record payout + fetch balance txns |
| Mercury deposit matching | transaction.created webhook | Attempt auto-match to pending payout |
| Daily reconciliation sweep | Cron 6:00 AM ET | Re-attempt unmatched items, create exceptions |
| Daily snapshot | Cron 11:59 PM ET | Capture all daily metrics |
| Mercury balance refresh | Cron every 4 hours | Update account balances |
| Sync health monitoring | Cron every hour | Check last_sync_at freshness |

---

## K. Phased Implementation Roadmap

### Phase 1: Foundation + High-Value Wins (Weeks 1-3)

**Deliverables:**
- Database migration: finance tables (payouts, mercury transactions, accounts, exceptions, snapshots, sync_status)
- Mercury API integration: accounts listing, transaction fetching
- Mercury webhook receiver: transaction.created, balance.updated
- Stripe payout webhook handlers: payout.created, payout.paid, payout.failed
- Balance transaction fetching (itemize each payout)
- Basic auto-matching: payout <-> Mercury deposit
- Daily cash snapshot cron
- Mercury balance refresh cron
- Admin finance operations page (basic: payouts list, Mercury balance, exception count)

**Required APIs/Webhooks:**
- Stripe: Payouts API, Balance Transactions API, payout.* webhooks
- Mercury: Accounts API, Transactions API, transaction.created webhook

**Engineering Effort:** 2-3 weeks (one engineer)

**Operational Impact:** Eliminates daily manual bank checking. Surfaces unmatched items automatically. Provides cash visibility without logging into Mercury.

**Risks:** Mercury webhook sandbox limitation (test with polling). Stripe API rate limits during initial backfill.

**Priority:** Highest. This is the foundation everything else builds on.

### Phase 2: Reconciliation Engine + Exception Handling (Weeks 4-5)

**Deliverables:**
- Full reconciliation sweep cron (daily)
- Exception creation and lifecycle (open -> investigating -> resolved/dismissed)
- Exception resolution UI in admin dashboard
- Unmatched item re-attempt logic with escalation
- Timing tolerance and business day calculation
- Monthly reconciliation report generation
- Connect transfer verification (match transfers to booking payouts)
- Alert system: payout failures, unmatched items, disputes

**Required APIs/Webhooks:**
- Same as Phase 1 (deeper use)
- Stripe: Disputes API for status tracking

**Engineering Effort:** 1-2 weeks

**Operational Impact:** Catches reconciliation problems within days instead of at month-end. Reduces manual reconciliation to exception-only review.

**Risks:** Edge cases in matching logic (holidays, weekends, partial amounts). Need to handle Stripe's 2-day payout delay correctly.

**Priority:** High. This is where the time savings really compound.

### Phase 3: Dashboard + Finance Ops Intelligence (Weeks 6-8)

**Deliverables:**
- Full finance operations dashboard (all widgets from Section H)
- Revenue decomposition view (gross -> fees -> net -> settled)
- Month-end readiness score
- Daily/weekly email summaries
- Payout drill-down (click payout -> see all balance transactions -> see linked bookings)
- Revenue by stream chart (platform fees, cross-club, guide, membership, compass)
- Cash flow trend chart (daily net settled over 30/60/90 days)
- Exception aging report
- Export: CSV download for all finance data

**Required APIs/Webhooks:**
- Same as Phase 1-2
- Mercury: Statement PDF download (nice-to-have)

**Engineering Effort:** 2-3 weeks

**Operational Impact:** Finance team has a single dashboard for operational health. Month-end prep drops from days to hours. Board reporting inputs are pre-calculated.

**Risks:** Dashboard scope creep. Keep it focused on the widgets defined in Section H.

**Priority:** Medium-High. High value but depends on Phase 1-2 data being clean.

### Phase 4: Advanced Intelligence (Weeks 9+, as justified)

**Deliverables:**
- Cash flow forecasting (based on booking pipeline + historical settlement patterns)
- Anomaly detection (unusual refund rates, fee spikes, payout timing drift)
- Revenue cohort analysis (by property, club, region)
- Automated Slack/email digest with AI-generated narrative summary
- Connected account health monitoring (are all landowners/clubs/guides payable?)

**Required APIs/Webhooks:**
- Same as Phase 1-3
- Potentially Stripe Sigma for complex queries

**Engineering Effort:** 3-4 weeks (can be spread over time)

**Operational Impact:** Moves from reactive to predictive. Identifies trends before they become problems.

**Risks:** Diminishing returns if volume is still low. Only justified once booking volume creates enough data for patterns.

**Priority:** Low for now. Revisit when monthly GMV exceeds $50K.

---

## L. Specific Next Steps for Engineering

### Immediate (This Sprint)

1. **Create Mercury API integration library** (`src/lib/mercury/client.ts`)
   - Authentication with API key
   - Methods: listAccounts(), listTransactions(), getTransaction()
   - Rate limit handling (2000/5min)
   - Pagination helpers

2. **Create database migration** for all finance tables (Section F)
   - `finance_stripe_payouts`
   - `finance_stripe_balance_txns`
   - `finance_mercury_transactions`
   - `finance_mercury_accounts`
   - `finance_reconciliation_exceptions`
   - `finance_daily_snapshots`
   - `finance_sync_status`

3. **Add Stripe payout webhooks** to existing webhook handler
   - `payout.created` -> record payout, fetch balance transactions
   - `payout.paid` -> update status, attempt Mercury match
   - `payout.failed` -> update status, create critical exception

4. **Create Mercury webhook endpoint** (`/api/webhooks/mercury/route.ts`)
   - HMAC-SHA256 signature verification
   - `transaction.created` -> record transaction, attempt payout match
   - `*.balance.updated` -> update account balance snapshot

5. **Create reconciliation cron** (`/api/cron/finance-reconciliation/route.ts`)
   - Daily sweep of unmatched payouts and deposits
   - Exception creation for items past tolerance window
   - Daily snapshot generation

### What to Keep from Existing Code

- **All Stripe webhook handlers** — well-built, idempotent (stripe_webhook_events table)
- **Fee calculation** (`src/lib/constants/fees.ts`) — comprehensive and correct
- **Payout distribution** (`/api/stripe/payout/route.ts`) — proper Connect transfers
- **Admin financials dashboard** (`/admin/financials/page.tsx`) — keep as the accounting-focused view
- **Analytics API** (`/api/analytics/financials/route.ts`) — excellent per-role views

### What to Add (Not Replace)

- New `/admin/finance-ops` page alongside existing `/admin/financials`
  - Existing page = revenue/accounting view (keep as-is)
  - New page = operations/reconciliation view
- New webhook handlers appended to existing Stripe webhook route
- New Mercury integration as a parallel integration (doesn't touch Stripe code)
- New cron jobs registered in vercel.json alongside existing ones

### What NOT to Do

- Do not push data into Puzzle (restricted API, would duplicate native syncs)
- Do not replace the existing admin financials page (it serves a different purpose)
- Do not build a general ledger (that's Puzzle's job)
- Do not attempt real-time Mercury polling in production (use webhooks)
- Do not store Mercury API keys in client-accessible environment variables
