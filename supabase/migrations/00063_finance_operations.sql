-- Finance Operations Layer
-- Tracks Stripe payouts, Mercury deposits, reconciliation, and daily snapshots.
-- Part of the hybrid finance architecture (Puzzle = accounting, this = operations).

-- ─── F1. Stripe Payouts ──────────────────────────────────────────────

CREATE TABLE finance_stripe_payouts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payout_id       text UNIQUE NOT NULL,
  amount                 numeric(12,2) NOT NULL,
  currency               text NOT NULL DEFAULT 'usd',
  status                 text NOT NULL DEFAULT 'pending',
  arrival_date           date,
  created_at             timestamptz NOT NULL DEFAULT now(),
  paid_at                timestamptz,
  failed_at              timestamptz,
  failure_code           text,
  failure_message        text,
  method                 text NOT NULL DEFAULT 'standard',
  description            text,
  trace_id               text,
  balance_transaction_id text,
  item_count             int DEFAULT 0,
  gross_amount           numeric(12,2) DEFAULT 0,
  fee_amount             numeric(12,2) DEFAULT 0,
  refund_amount          numeric(12,2) DEFAULT 0,
  reconciliation_status  text NOT NULL DEFAULT 'pending',
  matched_mercury_txn_id uuid,
  matched_at             timestamptz,
  metadata               jsonb DEFAULT '{}',
  synced_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_stripe_payouts_status
  ON finance_stripe_payouts (reconciliation_status)
  WHERE reconciliation_status IN ('pending', 'unmatched');

CREATE INDEX idx_finance_stripe_payouts_arrival
  ON finance_stripe_payouts (arrival_date);

-- ─── F2. Stripe Balance Transactions ─────────────────────────────────

CREATE TABLE finance_stripe_balance_txns (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_balance_txn_id   text UNIQUE NOT NULL,
  stripe_payout_id        text REFERENCES finance_stripe_payouts(stripe_payout_id),
  type                    text NOT NULL,
  amount                  numeric(12,2) NOT NULL,
  fee                     numeric(12,2) NOT NULL DEFAULT 0,
  net                     numeric(12,2) NOT NULL,
  currency                text NOT NULL DEFAULT 'usd',
  source_id               text,
  source_type             text,
  description             text,
  available_on            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  reporting_category      text,
  booking_id              uuid,
  metadata                jsonb DEFAULT '{}',
  synced_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_balance_txns_payout
  ON finance_stripe_balance_txns (stripe_payout_id);

CREATE INDEX idx_finance_balance_txns_source
  ON finance_stripe_balance_txns (source_id)
  WHERE source_id IS NOT NULL;

-- ─── F3. Mercury Transactions ────────────────────────────────────────

CREATE TABLE finance_mercury_transactions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mercury_txn_id          text UNIQUE NOT NULL,
  mercury_account_id      text NOT NULL,
  amount                  numeric(12,2) NOT NULL,
  status                  text NOT NULL DEFAULT 'pending',
  counterparty_name       text,
  bank_description        text,
  external_memo           text,
  note                    text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  posted_at               timestamptz,
  mercury_category        text,
  is_stripe_deposit       boolean NOT NULL DEFAULT false,
  reconciliation_status   text NOT NULL DEFAULT 'pending',
  matched_payout_id       uuid REFERENCES finance_stripe_payouts(id),
  matched_at              timestamptz,
  synced_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_mercury_txns_recon
  ON finance_mercury_transactions (reconciliation_status)
  WHERE reconciliation_status IN ('pending', 'unmatched');

CREATE INDEX idx_finance_mercury_txns_stripe
  ON finance_mercury_transactions (is_stripe_deposit, posted_at)
  WHERE is_stripe_deposit = true;

-- ─── F4. Mercury Accounts ────────────────────────────────────────────

CREATE TABLE finance_mercury_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mercury_account_id    text UNIQUE NOT NULL,
  name                  text NOT NULL,
  account_number_last4  text,
  kind                  text NOT NULL DEFAULT 'checking',
  available_balance     numeric(12,2) NOT NULL DEFAULT 0,
  current_balance       numeric(12,2) NOT NULL DEFAULT 0,
  last_snapshot_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── F5. Reconciliation Exceptions ───────────────────────────────────

CREATE TABLE finance_reconciliation_exceptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL,
  severity          text NOT NULL DEFAULT 'warning',
  stripe_payout_id  text,
  mercury_txn_id    text,
  expected_amount   numeric(12,2),
  actual_amount     numeric(12,2),
  description       text NOT NULL,
  status            text NOT NULL DEFAULT 'open',
  resolved_by       uuid REFERENCES auth.users(id),
  resolved_at       timestamptz,
  resolution_note   text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_exceptions_open
  ON finance_reconciliation_exceptions (status)
  WHERE status IN ('open', 'investigating');

-- ─── F6. Daily Snapshots ─────────────────────────────────────────────

CREATE TABLE finance_daily_snapshots (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date            date UNIQUE NOT NULL,
  gross_processed          numeric(12,2) NOT NULL DEFAULT 0,
  stripe_fees              numeric(12,2) NOT NULL DEFAULT 0,
  refunds_issued           numeric(12,2) NOT NULL DEFAULT 0,
  net_revenue              numeric(12,2) NOT NULL DEFAULT 0,
  payouts_created          numeric(12,2) NOT NULL DEFAULT 0,
  payouts_arrived          numeric(12,2) NOT NULL DEFAULT 0,
  mercury_balance          numeric(12,2) NOT NULL DEFAULT 0,
  stripe_available_balance numeric(12,2) NOT NULL DEFAULT 0,
  stripe_pending_balance   numeric(12,2) NOT NULL DEFAULT 0,
  open_exceptions          int NOT NULL DEFAULT 0,
  booking_count            int NOT NULL DEFAULT 0,
  dispute_count            int NOT NULL DEFAULT 0,
  compass_credit_revenue   numeric(12,2) NOT NULL DEFAULT 0,
  membership_revenue       numeric(12,2) NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- ─── F7. Sync Status ────────────────────────────────────────────────

CREATE TABLE finance_sync_status (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system            text UNIQUE NOT NULL,
  last_sync_at      timestamptz,
  last_sync_status  text NOT NULL DEFAULT 'pending',
  last_error        text,
  records_synced    int DEFAULT 0,
  next_sync_at      timestamptz
);

-- Seed sync status rows
INSERT INTO finance_sync_status (system, last_sync_status) VALUES
  ('stripe_payouts', 'pending'),
  ('stripe_balance_txns', 'pending'),
  ('mercury_transactions', 'pending'),
  ('mercury_accounts', 'pending');

-- ─── FK: Stripe payouts -> Mercury transactions ─────────────────────

ALTER TABLE finance_stripe_payouts
  ADD CONSTRAINT fk_matched_mercury_txn
  FOREIGN KEY (matched_mercury_txn_id)
  REFERENCES finance_mercury_transactions(id);

-- ─── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE finance_stripe_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_stripe_balance_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_mercury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_mercury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_reconciliation_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sync_status ENABLE ROW LEVEL SECURITY;

-- Service role only (all access via API routes with admin client)
-- No user-facing RLS policies needed — these tables are admin-only.
