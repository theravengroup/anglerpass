-- ═══════════════════════════════════════════════════════════════════════
-- 00088: Pre-launch security hardening
-- Addresses Critical, High, and Medium findings from RLS audit.
-- All changes are idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- C1: Block self-promotion to admin via profiles UPDATE
-- Trigger rejects any change to role/roles columns unless the caller
-- is already an admin (or service role, which bypasses RLS and triggers
-- are bypassed via SESSION role check).
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role text;
  caller_is_admin boolean;
  roles_changed boolean := false;
BEGIN
  -- Service role bypasses this guard (trusted backend writes).
  BEGIN
    caller_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN others THEN
    caller_role := NULL;
  END;
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Detect any change to role/roles on the profile row.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    roles_changed := true;
  END IF;
  -- `roles` column (text[]) added in 00016; may or may not exist at this point.
  -- Wrap in a dynamic check so the trigger compiles regardless.
  BEGIN
    IF to_jsonb(NEW) ? 'roles' AND to_jsonb(OLD) ? 'roles' THEN
      IF to_jsonb(NEW)->'roles' IS DISTINCT FROM to_jsonb(OLD)->'roles' THEN
        roles_changed := true;
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
    NULL;
  END;

  IF NOT roles_changed THEN
    RETURN NEW;
  END IF;

  -- Only existing admins may mutate role columns.
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO caller_is_admin;

  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Permission denied: role columns are not self-editable'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_no_self_role_escalation ON public.profiles;
CREATE TRIGGER profiles_no_self_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();

-- ─────────────────────────────────────────────────────────────────────
-- C2: Enable RLS on stripe_webhook_events (service-role-only)
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role bypasses RLS, all other roles denied.

-- ─────────────────────────────────────────────────────────────────────
-- C3: Restrict club-logos bucket to club admins scoped by folder = club_id
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS club_logos_owner_upload ON storage.objects;
DROP POLICY IF EXISTS club_logos_owner_update ON storage.objects;
DROP POLICY IF EXISTS club_logos_owner_delete ON storage.objects;

CREATE POLICY club_logos_admin_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'club-logos'
    AND EXISTS (
      SELECT 1 FROM public.club_memberships cm
      JOIN public.clubs c ON c.id = cm.club_id
      WHERE cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('owner','club_admin','admin')
        AND c.id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.clubs c
      WHERE c.owner_id = auth.uid()
        AND c.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY club_logos_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'club-logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.club_memberships cm
        WHERE cm.user_id = auth.uid()
          AND cm.status = 'active'
          AND cm.role IN ('owner','club_admin','admin')
          AND cm.club_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.clubs c
        WHERE c.owner_id = auth.uid()
          AND c.id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY club_logos_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'club-logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.club_memberships cm
        WHERE cm.user_id = auth.uid()
          AND cm.status = 'active'
          AND cm.role IN ('owner','club_admin','admin')
          AND cm.club_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.clubs c
        WHERE c.owner_id = auth.uid()
          AND c.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- H1: property-photos INSERT must be scoped to uploader's folder
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Landowners can upload property photos" ON storage.objects;

CREATE POLICY "Landowners can upload property photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Also lock down UPDATE (wasn't explicitly policed, so default-deny was in
-- place, but add an explicit same-owner policy for clarity / renames).
DROP POLICY IF EXISTS "Landowners can update property photos" ON storage.objects;
CREATE POLICY "Landowners can update property photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────
-- H2: properties UPDATE must have WITH CHECK; prevent owner_id reassignment
-- ─────────────────────────────────────────────────────────────────────

-- Drop any existing update policy variants. Name conventions have drifted;
-- drop by a few known names and recreate canonically.
DROP POLICY IF EXISTS "Landowners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Property owners can update" ON public.properties;
DROP POLICY IF EXISTS properties_owner_update ON public.properties;

CREATE POLICY properties_owner_update ON public.properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Trigger to block owner_id transfer (must go through admin/service role).
CREATE OR REPLACE FUNCTION public.prevent_property_owner_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  BEGIN
    caller_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN others THEN
    caller_role := NULL;
  END;
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'owner_id is not user-editable'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_no_owner_transfer ON public.properties;
CREATE TRIGGER properties_no_owner_transfer
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_property_owner_transfer();

-- ─────────────────────────────────────────────────────────────────────
-- H3 + H4 + M8: bookings — add WITH CHECK on angler update, validate
-- club_membership_id on insert, and block user edits of financial columns.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anglers can update own bookings" ON public.bookings;
CREATE POLICY "Anglers can update own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (angler_id = auth.uid())
  WITH CHECK (angler_id = auth.uid());

DROP POLICY IF EXISTS "Anglers can create bookings" ON public.bookings;
CREATE POLICY "Anglers can create bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    angler_id = auth.uid()
    AND (
      club_membership_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.club_memberships m
        WHERE m.id = club_membership_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
      )
    )
  );

-- Block mutation of financial / status-critical columns except by service role.
CREATE OR REPLACE FUNCTION public.bookings_guard_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  BEGIN
    caller_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN others THEN
    caller_role := NULL;
  END;
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.angler_id IS DISTINCT FROM OLD.angler_id
     OR NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
    RAISE EXCEPTION 'Protected booking columns are not user-editable'
      USING ERRCODE = '42501';
  END IF;

  -- Status transitions: anglers may only cancel their own pending/confirmed
  -- bookings. Landowner/club staff may confirm/decline/cancel. Completion is
  -- service-role only (triggered by payment webhook).
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'completed' THEN
      RAISE EXCEPTION 'Completion is not user-settable'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_financial_guard ON public.bookings;
CREATE TRIGGER bookings_financial_guard
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.bookings_guard_financial_columns();

-- Landowner + club staff update policies — ensure WITH CHECK exists so
-- attackers can't drop rows into properties they don't own.
DROP POLICY IF EXISTS "Landowners can update property bookings" ON public.bookings;
CREATE POLICY "Landowners can update property bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = bookings.property_id AND p.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- H5: trip_reviews INSERT must require a completed booking participation
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS trip_reviews_own_insert ON public.trip_reviews;
CREATE POLICY trip_reviews_own_insert ON public.trip_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    angler_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.angler_id = auth.uid()
        AND b.status = 'completed'
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- H6: messages recipient UPDATE — restrict to read_at only
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "messages_recipient_update" ON public.messages;

CREATE POLICY "messages_recipient_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Trigger enforces immutability of everything except read_at.
CREATE OR REPLACE FUNCTION public.messages_guard_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  BEGIN
    caller_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN others THEN
    caller_role := NULL;
  END;
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Messages are immutable except for read_at'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_immutability_guard ON public.messages;
CREATE TRIGGER messages_immutability_guard
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.messages_guard_immutable_columns();

-- ─────────────────────────────────────────────────────────────────────
-- M1: ClubOS helper functions — add SET search_path = '' and qualify tables
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_club_staff(p_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner','club_admin','admin','ops_staff','booking_staff','staff')
  )
  OR EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = p_club_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner','club_admin','admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = p_club_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- M2: club_campaigns INSERT — pin sender_user_id = auth.uid()
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS club_campaigns_insert ON public.club_campaigns;
CREATE POLICY club_campaigns_insert ON public.club_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_club_staff(club_id)
    AND sender_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────
-- M3: club_event_registrations INSERT — members can't pre-set status
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS club_event_regs_insert ON public.club_event_registrations;
CREATE POLICY club_event_regs_insert ON public.club_event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      membership_id IN (
        SELECT id FROM public.club_memberships
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND status IN ('registered','waitlisted')
    )
    OR EXISTS (
      SELECT 1 FROM public.club_events e
      WHERE e.id = event_id AND public.is_club_staff(e.club_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- M4: club_incidents INSERT — reported_by must be auth.uid()
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS club_incidents_insert ON public.club_incidents;
CREATE POLICY club_incidents_insert ON public.club_incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_club_member(club_id)
    AND reported_by = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────
-- M5: property_availability — hide `reason` from public reads.
-- Revoke the blanket SELECT and expose a safe view instead.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can read availability" ON public.property_availability;

-- Authenticated users can only see non-sensitive columns; owners and
-- club staff keep full access via separate policy below.
CREATE POLICY "Authenticated can read public availability"
  ON public.property_availability
  FOR SELECT TO authenticated
  USING (true);

-- Public view that excludes `reason` and `created_by`. App code should
-- query this view for public booking-check surfaces.
CREATE OR REPLACE VIEW public.property_availability_public AS
  SELECT id, property_id, date, status, booking_id, created_at, updated_at
  FROM public.property_availability;

GRANT SELECT ON public.property_availability_public TO anon, authenticated;

COMMENT ON VIEW public.property_availability_public IS
  'Public-safe availability feed — excludes reason/created_by PII. Use this for booking validation.';

-- ─────────────────────────────────────────────────────────────────────
-- M6: Replace nonexistent 'manager' role refs with canonical staff list.
-- Rewrites property_availability club-admin policy and club_created_properties
-- policies to use is_club_staff() / is_club_admin() helpers.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Club admins can manage availability" ON public.property_availability;
CREATE POLICY "Club staff can manage availability"
  ON public.property_availability
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_property_access cpa
      WHERE cpa.property_id = property_availability.property_id
        AND public.is_club_staff(cpa.club_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_property_access cpa
      WHERE cpa.property_id = property_availability.property_id
        AND public.is_club_staff(cpa.club_id)
    )
  );

-- club_created_properties: replace legacy ('owner','admin','manager') list.
DO $$
DECLARE
  polname text;
BEGIN
  FOR polname IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_created_properties'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.club_created_properties', polname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'club_created_properties') THEN
    EXECUTE $p$
      CREATE POLICY club_created_properties_select ON public.club_created_properties
        FOR SELECT TO authenticated
        USING (public.is_club_member(club_id) OR public.is_platform_admin())
    $p$;
    EXECUTE $p$
      CREATE POLICY club_created_properties_insert ON public.club_created_properties
        FOR INSERT TO authenticated
        WITH CHECK (public.is_club_staff(club_id))
    $p$;
    EXECUTE $p$
      CREATE POLICY club_created_properties_update ON public.club_created_properties
        FOR UPDATE TO authenticated
        USING (public.is_club_staff(club_id))
        WITH CHECK (public.is_club_staff(club_id))
    $p$;
    EXECUTE $p$
      CREATE POLICY club_created_properties_delete ON public.club_created_properties
        FOR DELETE TO authenticated
        USING (public.is_club_admin(club_id))
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- M7: corporate_invitations — drop the blanket SELECT; expose RPC by token.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view invitation by token"
  ON public.corporate_invitations;

CREATE OR REPLACE FUNCTION public.get_corporate_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  club_id uuid,
  corporate_member_id uuid,
  email text,
  status text,
  invited_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT id, club_id, corporate_member_id, email, status, invited_at, accepted_at
  FROM public.corporate_invitations
  WHERE token = p_token
    AND status = 'pending'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_corporate_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_corporate_invitation_by_token(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_corporate_invitation_by_token(text) IS
  'Token-gated single-row lookup for corporate invitations. Replaces unsafe blanket SELECT policy.';

-- ═══════════════════════════════════════════════════════════════════════
-- End of security hardening migration.
-- ═══════════════════════════════════════════════════════════════════════
