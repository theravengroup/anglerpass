-- Member Referral / Affiliate System
--
-- Allows existing club members to refer new members. The referrer earns
-- a flat fee (set per club) when the referred member's membership is activated.
-- The referral reward is funded by the club from its initiation fee revenue.

-- ─── Club referral program settings ────────────────────────────────────

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS referral_program_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_reward numeric(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN clubs.referral_program_enabled IS
  'Whether the club has opted into the member referral program.';

COMMENT ON COLUMN clubs.referral_reward IS
  'Flat dollar amount paid to the referring member per successful referral. Deducted from the club initiation fee revenue.';

-- ─── Referral tracking on memberships ──────────────────────────────────

ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES club_memberships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_club_memberships_referral_code
  ON club_memberships(referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN club_memberships.referral_code IS
  'Unique 8-character code used by this member to refer others. Generated on membership activation.';

COMMENT ON COLUMN club_memberships.referred_by IS
  'The club_memberships.id of the member who referred this member. NULL if not referred.';

-- ─── Referral credits ledger ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  referrer_membership_id uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  referred_membership_id uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'earned', 'paid_out', 'voided')),
  earned_at timestamptz,
  paid_out_at timestamptz,
  voided_at timestamptz,
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_referrer
  ON referral_credits(referrer_membership_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referred
  ON referral_credits(referred_membership_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_club
  ON referral_credits(club_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_status
  ON referral_credits(status);

COMMENT ON TABLE referral_credits IS
  'Immutable ledger of member referral rewards. A credit is created when a referred member joins (pending), earned when activated, and paid out via Stripe.';

-- ─── RLS Policies ──────────────────────────────────────────────────────

ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

-- Members can view their own referral credits
CREATE POLICY referral_credits_own_select ON referral_credits
  FOR SELECT USING (
    referrer_membership_id IN (
      SELECT id FROM club_memberships WHERE user_id = auth.uid()
    )
  );

-- Club owners can view all credits for their club
CREATE POLICY referral_credits_club_owner_select ON referral_credits
  FOR SELECT USING (
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- Only service role can insert/update (via API routes with admin client)
CREATE POLICY referral_credits_service_insert ON referral_credits
  FOR INSERT WITH CHECK (false);
CREATE POLICY referral_credits_service_update ON referral_credits
  FOR UPDATE USING (false);
