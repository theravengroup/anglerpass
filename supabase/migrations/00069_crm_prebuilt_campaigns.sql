-- ============================================================
-- 00069: Pre-built CRM campaigns + segments
-- Seeds the CRM with ready-to-activate campaigns for common
-- marketing automation workflows.
-- ============================================================

-- ─── Segments ───────────────────────────────────────────────────────

-- All anglers
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'All Anglers',
  'Every user with the angler role.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"angler"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- All landowners
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'All Landowners',
  'Every user with the landowner role.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"landowner"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Active anglers (has at least 1 booking)
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'Active Anglers',
  'Anglers who have made at least one booking.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"angler"},{"field":"has_booking","op":"eq","value":"true"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- New signups (last 7 days)
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'New Signups (7d)',
  'Users who signed up in the last 7 days.',
  true,
  '[{"match":"all","conditions":[{"field":"created_at","op":"gte","value":"NOW() - INTERVAL ''7 days''"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Waitlist leads
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'Waitlist Leads',
  'Leads who signed up via the waitlist.',
  true,
  '[{"match":"all","conditions":[{"field":"lead.source","op":"eq","value":"homepage"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Inactive anglers (no booking in 30 days)
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'Inactive Anglers (30d)',
  'Anglers who have not booked in the last 30 days.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"angler"},{"field":"has_booking","op":"eq","value":"true"},{"field":"last_booking_at","op":"lt","value":"NOW() - INTERVAL ''30 days''"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- ─── Pre-built Campaigns ────────────────────────────────────────────

-- 1. Welcome Drip for New Anglers
INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Welcome Series — Anglers',
  'Automated 3-email welcome sequence for new angler signups. Introduces the platform, guides them to their first booking, and highlights the community.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'welcome_anglers',
  'user_signup'
) ON CONFLICT DO NOTHING;

-- Steps for Welcome Series
DO $$
DECLARE
  campaign_uuid uuid;
BEGIN
  SELECT id INTO campaign_uuid FROM campaigns WHERE prebuilt_key = 'welcome_anglers' LIMIT 1;
  IF campaign_uuid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (campaign_uuid, 1,
       'Welcome to AnglerPass — Your access starts here',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We''re thrilled to have you join our community of anglers accessing extraordinary private water across the West.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">AnglerPass connects you to club-managed private fly fishing properties — curated stretches of water you won''t find anywhere else.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Start by exploring available properties and finding your perfect stretch of water.</p>',
       0,
       'Explore Properties',
       '/dashboard'),
      (campaign_uuid, 2,
       'Ready to book your first trip?',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You''ve been a member for a couple of days — have you had a chance to browse the properties?</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Booking is simple: pick a property, choose your date, and you''re confirmed instantly. No waiting for approvals.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Many of our properties also offer experienced local guides who can show you the best spots.</p>',
       2880,
       'Browse Available Water',
       '/angler/book'),
      (campaign_uuid, 3,
       'Tips from our community',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">AnglerPass is more than bookings — it''s a community of passionate anglers who share a deep respect for the water.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">After your trip, you''ll have the chance to share your experience and help other anglers find their next great adventure.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Have questions? Reply to this email — a real person is reading it.</p>',
       7200,
       'View Your Dashboard',
       '/dashboard')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 2. Post-Booking Thank You
INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Post-Booking Follow-Up',
  'Sent after a booking is completed. Thanks the angler and encourages a review.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'post_booking',
  'booking_completed'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  campaign_uuid uuid;
BEGIN
  SELECT id INTO campaign_uuid FROM campaigns WHERE prebuilt_key = 'post_booking' LIMIT 1;
  IF campaign_uuid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (campaign_uuid, 1,
       'How was your trip?',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We hope you had an incredible time on the water.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Your experiences help other anglers discover great water — and they help our landowner and club partners know they''re making a difference.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Would you take a moment to share how it went?</p>',
       1440,
       'Leave a Review',
       '/dashboard')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. Landowner Onboarding
INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Landowner Onboarding',
  'Welcome sequence for new landowners. Guides them through property setup and what to expect.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'welcome_landowners',
  'property_claimed'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  campaign_uuid uuid;
BEGIN
  SELECT id INTO campaign_uuid FROM campaigns WHERE prebuilt_key = 'welcome_landowners' LIMIT 1;
  IF campaign_uuid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (campaign_uuid, 1,
       'Your property is listed — here''s what happens next',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Thank you for listing your property with AnglerPass. You''re now part of a curated network connecting your land with responsible, vetted anglers.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Here''s what to expect:</p><ul style="font-size: 16px; line-height: 1.7; color: #5a5a52;"><li>Clubs manage all angler access and vetting</li><li>Bookings are confirmed instantly — no action needed from you</li><li>You receive payments automatically after each trip</li></ul>',
       0,
       'View Your Dashboard',
       '/landowner'),
      (campaign_uuid, 2,
       'Getting the most from your listing',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Properties with great photos and detailed descriptions book up to 3x more often.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Take a moment to add high-quality photos of your water, describe the fishing experience, and set your availability calendar.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Questions? Reply here — Dan reads every message.</p>',
       4320,
       'Update Your Property',
       '/landowner/properties')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 4. Win-Back — Inactive Anglers
INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Win-Back — Inactive Anglers',
  'Re-engagement campaign triggered after 30 days of inactivity.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'winback_30d',
  'inactivity_30d'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  campaign_uuid uuid;
BEGIN
  SELECT id INTO campaign_uuid FROM campaigns WHERE prebuilt_key = 'winback_30d' LIMIT 1;
  IF campaign_uuid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (campaign_uuid, 1,
       'We''ve missed you on the water',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">It''s been a while since your last trip. We wanted to let you know that new properties and dates have been added since you last visited.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Some of the best water is available right now — and it won''t last long.</p>',
       0,
       'See What''s New',
       '/angler/book')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
