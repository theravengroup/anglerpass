-- ============================================================
-- Migration 00035: Allow null flagged_by_user_id for auto-flags
-- Auto-flag system creates flags without a human user reference
-- ============================================================

-- Make flagged_by_user_id nullable for system-generated flags
alter table review_flags
  alter column flagged_by_user_id drop not null;
