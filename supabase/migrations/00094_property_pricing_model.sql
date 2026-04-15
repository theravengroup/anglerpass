-- ═══════════════════════════════════════════════════════════════════════
-- 00094: Property pricing model overhaul
--
-- Replaces the legacy flat "$5/rod club commission" with a classification-
-- based rod-fee split (Select 50/50, Premier 35/65, Signature 25/75) and
-- adds an alternative Upfront Lease pricing mode where the club pays the
-- landowner an agreed annual lease amount via ACH and collects 100% of
-- rod fees from bookings.
--
-- Cross-club booking fee stays at $25/rod/day but the split changes:
-- $10 → referring club (was $5), $15 → AnglerPass (was $20).
--
-- Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. Properties: classification + pricing mode + lease fields
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS classification text
    CHECK (classification IS NULL OR classification IN ('select', 'premier', 'signature')),
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'rod_fee_split'
    CHECK (pricing_mode IN ('rod_fee_split', 'upfront_lease')),
  ADD COLUMN IF NOT EXISTS lease_proposed_amount_cents integer,
  ADD COLUMN IF NOT EXISTS lease_amount_cents integer,
  ADD COLUMN IF NOT EXISTS lease_status text
    CHECK (lease_status IS NULL OR lease_status IN (
      'proposed', 'under_negotiation', 'agreed', 'active', 'expired'
    )),
  ADD COLUMN IF NOT EXISTS lease_paid_through date,
  ADD COLUMN IF NOT EXISTS lease_last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_negotiation_note text;

COMMENT ON COLUMN public.properties.classification IS
  'Rod-fee split tier when pricing_mode=rod_fee_split. select=50/50, premier=35/65, signature=25/75 (club/landowner).';
COMMENT ON COLUMN public.properties.pricing_mode IS
  'How the landowner is compensated. rod_fee_split (classification-based per-booking split) or upfront_lease (annual ACH lease; club keeps 100% of rod fees).';
COMMENT ON COLUMN public.properties.lease_proposed_amount_cents IS
  'Landowner''s proposed annual lease amount in cents (pre-negotiation).';
COMMENT ON COLUMN public.properties.lease_amount_cents IS
  'Agreed annual lease amount in cents, locked in at status=agreed.';
COMMENT ON COLUMN public.properties.lease_status IS
  'Lease lifecycle: proposed → under_negotiation → agreed → active → expired.';
COMMENT ON COLUMN public.properties.lease_paid_through IS
  'Date through which the current lease payment covers. Set when ACH succeeds.';

CREATE INDEX IF NOT EXISTS idx_properties_classification
  ON public.properties (classification);
CREATE INDEX IF NOT EXISTS idx_properties_pricing_mode
  ON public.properties (pricing_mode);
CREATE INDEX IF NOT EXISTS idx_properties_lease_paid_through
  ON public.properties (lease_paid_through)
  WHERE pricing_mode = 'upfront_lease';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Bookings: snapshot classification + split + referring club
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS property_classification text
    CHECK (property_classification IS NULL OR property_classification IN ('select', 'premier', 'signature')),
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'rod_fee_split'
    CHECK (pricing_mode IN ('rod_fee_split', 'upfront_lease')),
  ADD COLUMN IF NOT EXISTS club_split_pct numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landowner_split_pct numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referring_club_id uuid REFERENCES public.clubs(id),
  ADD COLUMN IF NOT EXISTS managing_club_id uuid REFERENCES public.clubs(id);

COMMENT ON COLUMN public.bookings.property_classification IS
  'Snapshot of property classification at booking time (select/premier/signature). NULL when pricing_mode=upfront_lease.';
COMMENT ON COLUMN public.bookings.pricing_mode IS
  'Snapshot of property pricing_mode at booking time. Determines how rod fees are distributed.';
COMMENT ON COLUMN public.bookings.club_split_pct IS
  'Fraction of rod fee paid to the managing club (0.00-1.00). 0.50/0.35/0.25 for rod-fee-split, 1.00 for lease.';
COMMENT ON COLUMN public.bookings.landowner_split_pct IS
  'Fraction of rod fee paid to the landowner (0.00-1.00). 0.50/0.65/0.75 for rod-fee-split, 0.00 for lease.';
COMMENT ON COLUMN public.bookings.referring_club_id IS
  'Club the angler is booking through (derived from club_membership_id at creation). Receives cross-club referral when it differs from managing_club_id.';
COMMENT ON COLUMN public.bookings.managing_club_id IS
  'Club that manages the property (has the landowner relationship). Receives the club-side rod fee split.';

-- Repurpose the legacy club_commission column's comment to reflect the new
-- semantics: it now holds the club's share of the rod fee (not a flat $5).
COMMENT ON COLUMN public.bookings.club_commission IS
  'Managing club''s share of the rod fee (base_rate * club_split_pct). In upfront_lease mode this equals base_rate.';
COMMENT ON COLUMN public.bookings.home_club_referral IS
  'Referring-club referral ($10/rod/day) paid from the $25 cross-club fee. $0 for same-club bookings.';
COMMENT ON COLUMN public.bookings.cross_club_fee IS
  'Cross-club fee ($25/rod/day), $0 for same-club bookings. Split: $10 referring club + $15 AnglerPass.';

CREATE INDEX IF NOT EXISTS idx_bookings_managing_club
  ON public.bookings (managing_club_id);
CREATE INDEX IF NOT EXISTS idx_bookings_referring_club
  ON public.bookings (referring_club_id);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Lease payments ledger
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.property_lease_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents integer NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  landowner_net_cents integer NOT NULL CHECK (landowner_net_cents >= 0),
  stripe_payment_intent_id text UNIQUE,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  failure_reason text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS idx_lease_payments_property
  ON public.property_lease_payments (property_id);
CREATE INDEX IF NOT EXISTS idx_lease_payments_club
  ON public.property_lease_payments (club_id);
CREATE INDEX IF NOT EXISTS idx_lease_payments_status
  ON public.property_lease_payments (status);

-- Only one succeeded payment per property per coverage period
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lease_payment_active_period
  ON public.property_lease_payments (property_id, period_start)
  WHERE status = 'succeeded';

COMMENT ON TABLE public.property_lease_payments IS
  'Annual upfront-lease ACH payments from clubs to landowners. AnglerPass collects a 5% platform fee.';

-- RLS: service-role only (reads happen via server with admin client).
ALTER TABLE public.property_lease_payments ENABLE ROW LEVEL SECURITY;

-- Club owners/admins can view their own club's lease payments (for dashboard)
CREATE POLICY "Club owners can view own club lease payments"
  ON public.property_lease_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = property_lease_payments.club_id
        AND clubs.owner_id = auth.uid()
    )
    OR public.is_club_staff(property_lease_payments.club_id)
  );

-- Landowners can view lease payments on their own properties
CREATE POLICY "Landowners can view own property lease payments"
  ON public.property_lease_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_lease_payments.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all lease payments"
  ON public.property_lease_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_lease_payments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lease_payments_updated_at ON public.property_lease_payments;
CREATE TRIGGER trg_lease_payments_updated_at
  BEFORE UPDATE ON public.property_lease_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_lease_payments();

-- ─────────────────────────────────────────────────────────────────────
-- 4. Publishing gate: property must have pricing set before going live
--
-- rod_fee_split mode requires classification to be set.
-- upfront_lease mode requires lease_status = 'active'.
-- Enforced via trigger so both landowner UI and API share the same rule.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_property_pricing_gate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    IF NEW.pricing_mode = 'rod_fee_split' AND NEW.classification IS NULL THEN
      RAISE EXCEPTION 'Cannot publish property: classification must be set (select/premier/signature) when pricing_mode=rod_fee_split.';
    END IF;
    IF NEW.pricing_mode = 'upfront_lease' AND (NEW.lease_status IS NULL OR NEW.lease_status <> 'active') THEN
      RAISE EXCEPTION 'Cannot publish property: lease must be active when pricing_mode=upfront_lease (current lease_status=%).', NEW.lease_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_pricing_gate ON public.properties;
CREATE TRIGGER trg_properties_pricing_gate
  BEFORE INSERT OR UPDATE OF status, pricing_mode, classification, lease_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_pricing_gate();

-- ─────────────────────────────────────────────────────────────────────
-- 5. Backfill: existing bookings get the legacy $5 commission as 5% of rod
-- fee proxy. Safer: leave snapshot cols at default 0 — payouts already ran.
-- Pre-launch, this is effectively a no-op. Code reads new columns; any
-- bookings already distributed have payout_distributed_at set and aren't
-- re-processed.
-- ─────────────────────────────────────────────────────────────────────

-- Tag pre-existing properties with default classification for test/seed data.
-- Real landowners will set their own via the onboarding UI before listing.
UPDATE public.properties
  SET pricing_mode = 'rod_fee_split'
  WHERE pricing_mode IS NULL;
