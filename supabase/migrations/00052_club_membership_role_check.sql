-- Migration 00052: Ensure club_memberships.role CHECK constraint covers all roles
--
-- Migration 00042 already added a CHECK covering the expanded role set.
-- This migration is a safety net: drop-and-recreate to guarantee the
-- constraint matches the canonical CLUB_ROLES list in the codebase.
-- Idempotent — safe to run multiple times.

ALTER TABLE club_memberships
  DROP CONSTRAINT IF EXISTS club_memberships_role_check;

ALTER TABLE club_memberships
  ADD CONSTRAINT club_memberships_role_check
  CHECK (role IN (
    'owner',
    'admin',
    'club_admin',
    'booking_staff',
    'ops_staff',
    'staff',
    'finance_staff',
    'readonly_staff',
    'member'
  ));

COMMENT ON CONSTRAINT club_memberships_role_check ON club_memberships IS
  'Enforces valid club membership roles. Must stay in sync with CLUB_ROLES in src/lib/permissions/constants.ts';
