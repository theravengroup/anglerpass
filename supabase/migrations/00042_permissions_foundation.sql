-- ============================================================================
-- Migration 00042: Permissions Foundation
--
-- Adds scoped role-based permissions, platform staff roles, angler delegation,
-- on-behalf-of booking support, and enhanced audit logging.
--
-- Strategy: Fully additive. No existing columns dropped. No destructive changes.
-- ============================================================================

-- ─── 1. Permissions Reference Table ─────────────────────────────────────────

CREATE TABLE permissions (
  id          text PRIMARY KEY,
  category    text NOT NULL,
  description text,
  scope_type  text NOT NULL CHECK (scope_type IN ('platform', 'organization', 'consumer'))
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions (they're reference data)
CREATE POLICY "Authenticated users can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- ─── 2. Role-Permission Mapping ──────────────────────────────────────────────

CREATE TABLE role_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type  text NOT NULL CHECK (scope_type IN ('platform', 'organization', 'consumer')),
  role        text NOT NULL,
  permission  text NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(scope_type, role, permission)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(scope_type, role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read role_permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- ─── 3. Platform Staff Table ─────────────────────────────────────────────────

CREATE TABLE platform_staff (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN (
    'super_admin', 'ops_admin', 'support_agent',
    'finance_admin', 'compliance_admin', 'readonly_internal'
  )),
  granted_by  uuid REFERENCES profiles(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,
  UNIQUE(user_id) -- one active platform role per user
);

CREATE INDEX idx_platform_staff_user ON platform_staff(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_platform_staff_role ON platform_staff(role) WHERE revoked_at IS NULL;

ALTER TABLE platform_staff ENABLE ROW LEVEL SECURITY;

-- Admins can manage platform staff
CREATE POLICY "Admins can read platform_staff"
  ON platform_staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert platform_staff"
  ON platform_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update platform_staff"
  ON platform_staff FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- Users can read their own staff record
CREATE POLICY "Users can read own platform_staff"
  ON platform_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ─── 4. Angler Delegates Table ───────────────────────────────────────────────

CREATE TABLE angler_delegates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  angler_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delegate_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  delegate_email  text,
  access_level    text NOT NULL CHECK (access_level IN ('viewer', 'booking_manager')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  granted_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  UNIQUE(angler_id, delegate_id)
);

CREATE INDEX idx_angler_delegates_angler ON angler_delegates(angler_id) WHERE status = 'active';
CREATE INDEX idx_angler_delegates_delegate ON angler_delegates(delegate_id) WHERE status = 'active';
CREATE INDEX idx_angler_delegates_email ON angler_delegates(delegate_email) WHERE status = 'pending';

ALTER TABLE angler_delegates ENABLE ROW LEVEL SECURITY;

-- Anglers can manage their own delegates
CREATE POLICY "Anglers can read own delegates"
  ON angler_delegates FOR SELECT
  TO authenticated
  USING (angler_id = auth.uid() OR delegate_id = auth.uid());

CREATE POLICY "Anglers can create delegates"
  ON angler_delegates FOR INSERT
  TO authenticated
  WITH CHECK (angler_id = auth.uid());

CREATE POLICY "Anglers can update own delegates"
  ON angler_delegates FOR UPDATE
  TO authenticated
  USING (angler_id = auth.uid() OR delegate_id = auth.uid())
  WITH CHECK (true);

-- Admins can see all delegates
CREATE POLICY "Admins can read all delegates"
  ON angler_delegates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 5. Extend Bookings for On-Behalf-Of ────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS on_behalf_of boolean NOT NULL DEFAULT false;

-- Backfill: all existing bookings were self-created
UPDATE bookings SET created_by_user_id = angler_id WHERE created_by_user_id IS NULL;

CREATE INDEX idx_bookings_created_by ON bookings(created_by_user_id);

-- ─── 6. Enhance Audit Log ───────────────────────────────────────────────────

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS represented_user_id uuid,
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS reason text;

CREATE INDEX idx_audit_log_represented ON audit_log(represented_user_id) WHERE represented_user_id IS NOT NULL;
CREATE INDEX idx_audit_log_org ON audit_log(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);

-- ─── 7. Extend Club Membership Roles ────────────────────────────────────────

-- Drop and recreate the check constraint to include new roles.
-- The existing roles (admin, staff, member) remain valid.
-- New roles: owner, booking_staff, ops_staff, finance_staff, readonly_staff
-- Note: 'admin' maps to club_admin, 'staff' maps to ops_staff in the new model.
-- We keep both old and new values valid during migration period.
ALTER TABLE club_memberships
  DROP CONSTRAINT IF EXISTS club_memberships_role_check;

ALTER TABLE club_memberships
  ADD CONSTRAINT club_memberships_role_check
  CHECK (role IN (
    'admin', 'staff', 'member',
    'owner', 'club_admin', 'booking_staff', 'ops_staff', 'finance_staff', 'readonly_staff'
  ));

-- ─── 8. RLS for Bookings On-Behalf-Of ───────────────────────────────────────

-- Club staff with booking role can view bookings for their club
CREATE POLICY "Club booking staff can view club bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = (
        SELECT cm2.club_id FROM club_memberships cm2
        WHERE cm2.id = bookings.club_membership_id
      )
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND cm.role IN ('admin', 'staff', 'owner', 'club_admin', 'booking_staff')
    )
  );

-- Allow staff-created bookings (on_behalf_of = true, created_by_user_id = auth.uid())
CREATE POLICY "Club staff can create bookings on behalf"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    on_behalf_of = true
    AND created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = (
        SELECT cm2.club_id FROM club_memberships cm2
        WHERE cm2.id = club_membership_id
      )
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND cm.role IN ('admin', 'staff', 'owner', 'club_admin', 'booking_staff')
    )
  );

-- Delegates can view their principal's bookings
CREATE POLICY "Delegates can view principal bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM angler_delegates ad
      WHERE ad.delegate_id = auth.uid()
      AND ad.angler_id = bookings.angler_id
      AND ad.status = 'active'
    )
  );

-- ─── 9. Seed Permission Definitions ─────────────────────────────────────────

INSERT INTO permissions (id, category, description, scope_type) VALUES
  -- Booking permissions
  ('booking.view_own', 'booking', 'View own bookings', 'consumer'),
  ('booking.view_club', 'booking', 'View all bookings through a club', 'organization'),
  ('booking.view_all', 'booking', 'View all bookings platform-wide', 'platform'),
  ('booking.create', 'booking', 'Create a booking for self', 'consumer'),
  ('booking.create_on_behalf', 'booking', 'Create a booking for another member', 'organization'),
  ('booking.modify', 'booking', 'Modify a booking', 'organization'),
  ('booking.cancel', 'booking', 'Cancel a booking', 'organization'),
  ('booking.override_limits', 'booking', 'Override rod/guest limits', 'platform'),
  ('booking.override_blackouts', 'booking', 'Override blackout dates', 'platform'),
  ('booking.waive_fees', 'booking', 'Waive platform fees', 'platform'),
  ('booking.resend_confirmation', 'booking', 'Resend booking confirmation', 'organization'),

  -- Profile permissions
  ('profile.view_own', 'profile', 'View own profile', 'consumer'),
  ('profile.edit_own', 'profile', 'Edit own profile', 'consumer'),
  ('profile.view_members', 'profile', 'View club member profiles', 'organization'),
  ('profile.edit_members', 'profile', 'Edit club member details', 'organization'),
  ('profile.view_all', 'profile', 'View any profile platform-wide', 'platform'),
  ('profile.edit_all', 'profile', 'Edit any profile', 'platform'),
  ('profile.suspend', 'profile', 'Suspend a user account', 'platform'),
  ('profile.change_role', 'profile', 'Change platform role', 'platform'),

  -- Delegate permissions
  ('delegate.view', 'delegate', 'View own delegates', 'consumer'),
  ('delegate.manage', 'delegate', 'Add/remove delegates', 'consumer'),
  ('delegate.view_principal_bookings', 'delegate', 'View principal''s bookings as delegate', 'consumer'),
  ('delegate.create_booking_for_principal', 'delegate', 'Create booking for principal as delegate', 'consumer'),

  -- Club permissions
  ('club.edit_settings', 'club', 'Edit club settings', 'organization'),
  ('club.manage_staff', 'club', 'Manage club staff', 'organization'),
  ('club.manage_members', 'club', 'Manage club members', 'organization'),
  ('club.manage_plans', 'club', 'Manage membership plans and fees', 'organization'),
  ('club.manage_properties', 'club', 'Manage property access', 'organization'),
  ('club.manage_access_instructions', 'club', 'Manage property access instructions', 'organization'),
  ('club.view_roster', 'club', 'View full member roster', 'organization'),

  -- Financial permissions
  ('financial.view_club_charges', 'financial', 'View club financial data', 'organization'),
  ('financial.view_all_charges', 'financial', 'View platform-wide financials', 'platform'),
  ('financial.issue_refund', 'financial', 'Issue a refund', 'platform'),
  ('financial.adjust_fees', 'financial', 'Adjust booking fees', 'platform'),
  ('financial.export_reports', 'financial', 'Export financial reports', 'platform'),
  ('financial.manage_payouts', 'financial', 'Manage payout schedules', 'platform'),

  -- Messaging permissions
  ('messaging.view_trip', 'messaging', 'View trip messages', 'consumer'),
  ('messaging.send_trip', 'messaging', 'Send trip messages', 'consumer'),
  ('messaging.send_bulk', 'messaging', 'Send bulk notifications', 'organization'),
  ('messaging.include_delegates', 'messaging', 'Include delegates in message threads', 'organization'),

  -- Compliance permissions
  ('compliance.view_docs', 'compliance', 'View verification documents', 'platform'),
  ('compliance.approve_docs', 'compliance', 'Approve/reject verification', 'platform'),
  ('compliance.suspend_user', 'compliance', 'Suspend user accounts', 'platform'),
  ('compliance.suspend_listing', 'compliance', 'Suspend property listings', 'platform'),

  -- System permissions
  ('system.impersonate', 'system', 'Impersonate another user', 'platform'),
  ('system.unlock_account', 'system', 'Unlock locked accounts', 'platform'),
  ('system.view_audit_logs', 'system', 'View audit trail', 'platform'),
  ('system.modify_config', 'system', 'Modify platform configuration', 'platform');

-- ─── 10. Seed Role-Permission Mappings ──────────────────────────────────────

-- Platform: super_admin (all platform + org permissions)
INSERT INTO role_permissions (scope_type, role, permission)
SELECT 'platform', 'super_admin', id FROM permissions
WHERE scope_type = 'platform';

-- Platform: ops_admin
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('platform', 'ops_admin', 'booking.view_all'),
  ('platform', 'ops_admin', 'booking.override_limits'),
  ('platform', 'ops_admin', 'booking.override_blackouts'),
  ('platform', 'ops_admin', 'profile.view_all'),
  ('platform', 'ops_admin', 'profile.edit_all'),
  ('platform', 'ops_admin', 'profile.suspend'),
  ('platform', 'ops_admin', 'financial.view_all_charges'),
  ('platform', 'ops_admin', 'financial.export_reports'),
  ('platform', 'ops_admin', 'compliance.view_docs'),
  ('platform', 'ops_admin', 'compliance.suspend_user'),
  ('platform', 'ops_admin', 'compliance.suspend_listing'),
  ('platform', 'ops_admin', 'system.unlock_account'),
  ('platform', 'ops_admin', 'system.view_audit_logs');

-- Platform: support_agent
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('platform', 'support_agent', 'booking.view_all'),
  ('platform', 'support_agent', 'booking.create_on_behalf'),
  ('platform', 'support_agent', 'booking.modify'),
  ('platform', 'support_agent', 'booking.cancel'),
  ('platform', 'support_agent', 'profile.view_all'),
  ('platform', 'support_agent', 'profile.edit_all'),
  ('platform', 'support_agent', 'compliance.view_docs'),
  ('platform', 'support_agent', 'system.unlock_account');

-- Platform: finance_admin
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('platform', 'finance_admin', 'booking.view_all'),
  ('platform', 'finance_admin', 'booking.waive_fees'),
  ('platform', 'finance_admin', 'profile.view_all'),
  ('platform', 'finance_admin', 'financial.view_all_charges'),
  ('platform', 'finance_admin', 'financial.issue_refund'),
  ('platform', 'finance_admin', 'financial.adjust_fees'),
  ('platform', 'finance_admin', 'financial.export_reports'),
  ('platform', 'finance_admin', 'financial.manage_payouts'),
  ('platform', 'finance_admin', 'system.view_audit_logs');

-- Platform: compliance_admin
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('platform', 'compliance_admin', 'profile.view_all'),
  ('platform', 'compliance_admin', 'profile.suspend'),
  ('platform', 'compliance_admin', 'compliance.view_docs'),
  ('platform', 'compliance_admin', 'compliance.approve_docs'),
  ('platform', 'compliance_admin', 'compliance.suspend_user'),
  ('platform', 'compliance_admin', 'compliance.suspend_listing'),
  ('platform', 'compliance_admin', 'system.view_audit_logs');

-- Platform: readonly_internal
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('platform', 'readonly_internal', 'booking.view_all'),
  ('platform', 'readonly_internal', 'profile.view_all'),
  ('platform', 'readonly_internal', 'financial.view_all_charges'),
  ('platform', 'readonly_internal', 'compliance.view_docs'),
  ('platform', 'readonly_internal', 'system.view_audit_logs');

-- Organization: club_owner (aliased from existing 'admin' role in club_memberships)
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'owner', 'booking.view_club'),
  ('organization', 'owner', 'booking.create_on_behalf'),
  ('organization', 'owner', 'booking.modify'),
  ('organization', 'owner', 'booking.cancel'),
  ('organization', 'owner', 'booking.resend_confirmation'),
  ('organization', 'owner', 'profile.view_members'),
  ('organization', 'owner', 'profile.edit_members'),
  ('organization', 'owner', 'club.edit_settings'),
  ('organization', 'owner', 'club.manage_staff'),
  ('organization', 'owner', 'club.manage_members'),
  ('organization', 'owner', 'club.manage_plans'),
  ('organization', 'owner', 'club.manage_properties'),
  ('organization', 'owner', 'club.manage_access_instructions'),
  ('organization', 'owner', 'club.view_roster'),
  ('organization', 'owner', 'financial.view_club_charges'),
  ('organization', 'owner', 'messaging.send_bulk'),
  ('organization', 'owner', 'messaging.include_delegates');

-- Copy owner permissions to the legacy 'admin' role (for backward compat)
INSERT INTO role_permissions (scope_type, role, permission)
SELECT 'organization', 'admin', permission
FROM role_permissions
WHERE scope_type = 'organization' AND role = 'owner';

-- Organization: club_admin
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'club_admin', 'booking.view_club'),
  ('organization', 'club_admin', 'booking.create_on_behalf'),
  ('organization', 'club_admin', 'booking.modify'),
  ('organization', 'club_admin', 'booking.cancel'),
  ('organization', 'club_admin', 'booking.resend_confirmation'),
  ('organization', 'club_admin', 'profile.view_members'),
  ('organization', 'club_admin', 'profile.edit_members'),
  ('organization', 'club_admin', 'club.edit_settings'),
  ('organization', 'club_admin', 'club.manage_members'),
  ('organization', 'club_admin', 'club.manage_plans'),
  ('organization', 'club_admin', 'club.manage_properties'),
  ('organization', 'club_admin', 'club.view_roster'),
  ('organization', 'club_admin', 'financial.view_club_charges'),
  ('organization', 'club_admin', 'messaging.send_bulk');

-- Organization: booking_staff
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'booking_staff', 'booking.view_club'),
  ('organization', 'booking_staff', 'booking.create_on_behalf'),
  ('organization', 'booking_staff', 'booking.modify'),
  ('organization', 'booking_staff', 'booking.cancel'),
  ('organization', 'booking_staff', 'booking.resend_confirmation'),
  ('organization', 'booking_staff', 'profile.view_members'),
  ('organization', 'booking_staff', 'club.view_roster');

-- Organization: ops_staff (legacy 'staff' equivalent)
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'ops_staff', 'booking.view_club'),
  ('organization', 'ops_staff', 'profile.view_members'),
  ('organization', 'ops_staff', 'profile.edit_members'),
  ('organization', 'ops_staff', 'club.manage_members'),
  ('organization', 'ops_staff', 'club.view_roster'),
  ('organization', 'ops_staff', 'messaging.send_bulk');

-- Copy ops_staff permissions to the legacy 'staff' role
INSERT INTO role_permissions (scope_type, role, permission)
SELECT 'organization', 'staff', permission
FROM role_permissions
WHERE scope_type = 'organization' AND role = 'ops_staff';

-- Organization: finance_staff
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'finance_staff', 'booking.view_club'),
  ('organization', 'finance_staff', 'profile.view_members'),
  ('organization', 'finance_staff', 'club.view_roster'),
  ('organization', 'finance_staff', 'financial.view_club_charges');

-- Organization: readonly_staff
INSERT INTO role_permissions (scope_type, role, permission) VALUES
  ('organization', 'readonly_staff', 'booking.view_club'),
  ('organization', 'readonly_staff', 'profile.view_members'),
  ('organization', 'readonly_staff', 'club.view_roster');

-- ─── 11. Backfill Platform Staff from Existing Admins ────────────────────────

INSERT INTO platform_staff (user_id, role, granted_at)
SELECT id, 'super_admin', now()
FROM profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;
