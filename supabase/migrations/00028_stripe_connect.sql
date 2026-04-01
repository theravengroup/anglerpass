-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  00028 — Stripe Connect payout onboarding                         ║
-- ║  Adds stripe_connect_account_id and stripe_connect_onboarded to:  ║
-- ║    - profiles (landowners)                                        ║
-- ║    - clubs                                                        ║
-- ║    - guide_profiles                                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ─── Landowner payouts (profiles table) ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean NOT NULL DEFAULT false;

-- ─── Club commission payouts (clubs table) ──────────────────────────
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean NOT NULL DEFAULT false;

-- ─── Guide payouts (guide_profiles table) ───────────────────────────
ALTER TABLE public.guide_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean NOT NULL DEFAULT false;
