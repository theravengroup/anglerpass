-- ============================================================
-- 00080: Complete pre-built campaign library
-- Adds welcome series for clubs/guides/corporate, seasonal
-- campaigns, deeper re-engagement, review follow-up, and
-- membership renewal reminders.
-- ============================================================

-- ─── Additional Segments ────────────────────────────────────────────

-- All club admins
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'All Club Admins',
  'Every user with the club_admin role.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"club_admin"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- All guides
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'All Guides',
  'Every user with the guide role.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"guide"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- All corporate sponsors
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'All Corporate Sponsors',
  'Every user with the corporate role.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"corporate"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Inactive anglers (60 days)
INSERT INTO segments (name, description, is_dynamic, rules, cached_count, cached_at)
VALUES (
  'Inactive Anglers (60d)',
  'Anglers who have not booked in the last 60 days.',
  true,
  '[{"match":"all","conditions":[{"field":"role","op":"eq","value":"angler"},{"field":"has_booking","op":"eq","value":"true"},{"field":"last_booking_at","op":"lt","value":"NOW() - INTERVAL ''60 days''"}]}]'::jsonb,
  0,
  NOW()
) ON CONFLICT DO NOTHING;


-- ─── 5. Welcome Series — Club Admins ────────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Welcome Series — Club Admins',
  'Automated 3-email welcome for new club administrators. Covers club setup, member invitations, and property management.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'welcome_clubs',
  'user_signup'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'welcome_clubs' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Welcome to AnglerPass — let''s get your club set up',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Thank you for bringing your club to AnglerPass. You''re joining a growing network of clubs that are modernizing how they manage access, members, and revenue.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Your first step: complete your club profile. Add a logo, description, and set your membership tiers so prospective members know what you offer.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Need a hand? Reply to this email and Dan will personally walk you through setup.</p>',
       0,
       'Set Up Your Club',
       '/club'),
      (cid, 2,
       'Time to invite your members',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Your club is looking good. The next step is bringing your members on board.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You can invite members individually by email, or bulk-import your entire roster via CSV. Either way, each member gets a personal invitation to join.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Members who join through your club get instant access to all your associated properties.</p>',
       4320,
       'Invite Members',
       '/club/members'),
      (cid, 3,
       'Connect your club to properties',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">The real magic happens when you connect properties to your club. Your members will be able to browse, book, and fish private water through your club network.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You can add properties on behalf of landowners, or invite landowners to list their own. Cross-club network agreements let you share water with partner clubs too.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Questions about anything? We''re here to help you succeed.</p>',
       8640,
       'Manage Properties',
       '/club/properties')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 6. Welcome Series — Guides ─────────────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Welcome Series — Guides',
  'Automated 3-email welcome for new guides. Covers verification, availability setup, and getting first clients.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'welcome_guides',
  'user_signup'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'welcome_guides' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Welcome to AnglerPass — get verified and start guiding',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We''re glad to have you join AnglerPass as a guide. Our platform connects you with serious anglers looking for guided experiences on private water.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">To start receiving bookings, you''ll need to complete verification. This includes uploading your credentials (guide license, insurance, first aid) and passing a background check.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">The process is quick and straightforward. Most guides are verified within 48 hours.</p>',
       0,
       'Start Verification',
       '/guide'),
      (cid, 2,
       'Set your availability and rates',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Once you''re verified, the next step is letting anglers know when and where you''re available.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Set your availability calendar, define your daily rate, and request water approvals from the clubs whose properties you want to guide on.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">A complete profile with a strong bio and clear rates helps anglers choose you with confidence.</p>',
       4320,
       'Set Availability',
       '/guide/availability'),
      (cid, 3,
       'Get your first clients with trip proposals',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Don''t just wait for bookings. You can proactively send trip proposals to anglers who are visiting water you know well.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">When an angler books a property where you''re approved, they''ll see you as an available guide. But proposals let you pitch specific dates, itineraries, and experiences directly.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">It''s the fastest way to fill your calendar.</p>',
       8640,
       'Create a Proposal',
       '/guide/proposals')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 7. Welcome Series — Corporate Sponsors ─────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Welcome Series — Corporate',
  'Automated 2-email welcome for new corporate sponsors. Covers team setup and benefit activation.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'welcome_corporate',
  'user_signup'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'welcome_corporate' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Welcome to AnglerPass Corporate — your team''s benefit starts now',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Thank you for choosing AnglerPass as a corporate benefit. You''re giving your team access to extraordinary private fly fishing water across the West.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Here''s what to do first:</p><ul style="font-size: 16px; line-height: 1.7; color: #5a5a52;"><li>Complete your company profile</li><li>Choose a club partnership to activate access</li><li>Invite your team members via email</li></ul><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Your employees will each get their own account with full booking access. You manage everything from a single corporate dashboard.</p>',
       0,
       'Set Up Your Account',
       '/corporate'),
      (cid, 2,
       'Invite your team and start booking',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Your corporate account is active. Now it''s time to invite your team.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Each team member you invite gets their own AnglerPass account with access to your club''s full property network. They can browse, book, and fish on their own schedule.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Track utilization, spending, and engagement from your corporate dashboard. It''s all one view.</p>',
       4320,
       'Invite Your Team',
       '/corporate/staff')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 8. Guide Verified — Congratulations ─────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Guide Verified — Congratulations',
  'Triggered when a guide completes verification. Encourages them to set up availability and start guiding.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'guide_verified',
  'guide_verified'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'guide_verified' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'You''re verified — time to start guiding',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Congratulations! Your credentials and background check have been approved. You''re now a verified AnglerPass guide.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Next steps:</p><ul style="font-size: 16px; line-height: 1.7; color: #5a5a52;"><li>Set your daily rate and availability calendar</li><li>Request water approvals from clubs</li><li>Complete your profile bio so anglers know your expertise</li></ul><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Anglers booking on your approved waters will see you as an available guide immediately.</p>',
       0,
       'Set Up Availability',
       '/guide/availability')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 9. Membership Joined — Welcome to the Club ─────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Membership Joined — Welcome',
  'Triggered when an angler joins a club. Introduces them to their new club benefits and available water.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'membership_joined',
  'membership_joined'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'membership_joined' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Welcome to your new club — here''s what you can access',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You''re officially a club member. Your membership unlocks access to private water that''s not available to the general public.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You can now browse and book any property in your club''s network. Bookings are instant — no waiting for approvals.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">If your club has cross-club agreements, you may also have access to partner club waters at a small additional fee.</p>',
       0,
       'Browse Available Water',
       '/angler/discover'),
      (cid, 2,
       'Tip: add a guide to your first trip',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Planning your first trip? Consider adding a local guide.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Our verified guides know the water intimately. They''ll help you read the conditions, match the hatch, and find fish faster than you would on your own.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">You can browse available guides when booking, or check out the full guide directory anytime.</p>',
       2880,
       'Find a Guide',
       '/angler/guides')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 10. Win-Back — 60 Day Inactivity ───────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Win-Back — 60 Day Re-Engagement',
  'Deeper re-engagement for anglers inactive 60+ days. More personal tone, highlights new inventory.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'winback_60d',
  'inactivity_60d'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'winback_60d' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'New water has been added since your last visit',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">It''s been a while. We wanted you to know that our property network has grown since your last trip.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">New clubs, new stretches of private water, and new guides have joined the platform. Some of the best dates this season are still open.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">If something wasn''t right about your last experience, we''d love to hear about it. Reply to this email and Dan will follow up personally.</p>',
       0,
       'See New Properties',
       '/angler/discover'),
      (cid, 2,
       'Your membership is still active',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Just a friendly reminder that your club membership is still active and your access is waiting.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Private water access is a rare thing. The properties on AnglerPass aren''t listed anywhere else. When dates fill up, they''re gone for the season.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We hope to see you back on the water soon.</p>',
       4320,
       'Book a Trip',
       '/angler/bookings')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 11. Seasonal Campaign — Spring Opener ──────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Seasonal — Spring Opener',
  'Annual spring campaign for all anglers. Highlights early-season opportunities and encourages first booking of the year.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'seasonal_spring',
  'season_start'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'seasonal_spring' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'The season is here — private water is open',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Spring runoff is receding and the rivers are coming into shape. It''s time to plan your first trip of the season.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Early season is some of the best fishing of the year. Hatches are starting, pressure is low, and the best dates go fast on our most popular properties.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Don''t wait until peak season. Lock in your dates now while availability is wide open.</p>',
       0,
       'View Available Dates',
       '/angler/discover'),
      (cid, 2,
       'Pro tip: book a guide for early season',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Early-season fishing can be tricky. Water conditions change daily and the bugs are just getting started.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">A local guide who knows the water will put you on fish faster. Our verified guides are booking up for spring right now.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Add a guide when you book, or browse the full directory to find someone who specializes in the water you''re fishing.</p>',
       2880,
       'Browse Guides',
       '/angler/guides')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 12. Seasonal Campaign — Fall Run ────────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Seasonal — Fall Run',
  'Annual fall campaign for all anglers. Highlights fall fishing, spawning runs, and end-of-season availability.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'seasonal_fall',
  'season_start'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'seasonal_fall' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Fall fishing is here — don''t miss the best water of the year',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Fall is when the serious anglers fish. Crowds thin out, temperatures drop, and the fish are feeding aggressively before winter.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Our private water is at its best right now. Fewer anglers, bigger fish, and the kind of solitude you can''t find on public access.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Many properties close for the season in November. The window is short.</p>',
       0,
       'Book Fall Dates',
       '/angler/discover'),
      (cid, 2,
       'Last call — season closing soon on select properties',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Several properties in our network are closing for the winter in the coming weeks. This is your last chance to fish them this year.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Check your club''s property calendar for remaining open dates. Once they''re gone, you''ll be waiting until spring.</p>',
       7200,
       'Check Remaining Dates',
       '/angler/bookings')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 13. Post-Trip Review Reminder ──────────────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Review Reminder — Nudge',
  'Follow-up nudge 5 days after trip if no review has been submitted. Supplements the review prompt cron.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'support@anglerpass.com',
  true,
  'review_reminder',
  'booking_completed'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'review_reminder' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'Quick favor — share your experience',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">A few days ago you fished private water through AnglerPass. We hope it was a great experience.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">If you have a moment, we''d appreciate a quick review. It takes about 60 seconds and helps other anglers find the best water.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">It also helps our landowner partners know that opening their property is making a difference.</p>',
       7200,
       'Write a Review',
       '/dashboard')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ─── 14. Lead Nurture — Waitlist to Signup ──────────────────────────

INSERT INTO campaigns (name, description, type, status, from_name, from_email, reply_to, is_prebuilt, prebuilt_key, trigger_event)
VALUES (
  'Lead Nurture — Waitlist to Signup',
  'Drip sequence for waitlist leads. Builds interest and drives conversion to full signup.',
  'triggered',
  'draft',
  'AnglerPass',
  'hello@anglerpass.com',
  'dan@anglerpass.com',
  true,
  'lead_nurture',
  'lead_created'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM campaigns WHERE prebuilt_key = 'lead_nurture' LIMIT 1;
  IF cid IS NOT NULL THEN
    INSERT INTO campaign_steps (campaign_id, step_order, subject, html_body, delay_minutes, cta_label, cta_url)
    VALUES
      (cid, 1,
       'You''re on the list — here''s what''s coming',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Thanks for joining the AnglerPass waitlist. You''re now in line for access to private fly fishing water that isn''t available anywhere else.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We''re building something different: a platform where clubs manage access, landowners earn revenue, and anglers get exclusive water without the politics of traditional club membership.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We''ll keep you posted as we open up access.</p>',
       0,
       'Learn More',
       '/anglers'),
      (cid, 2,
       'How AnglerPass works — a quick overview',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Curious how it all works? Here''s the short version:</p><ul style="font-size: 16px; line-height: 1.7; color: #5a5a52;"><li><strong>Clubs</strong> vet members and manage property access</li><li><strong>Landowners</strong> earn revenue without the hassle</li><li><strong>Anglers</strong> book instantly through their club membership</li><li><strong>Guides</strong> connect with clients on water they know</li></ul><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">It''s a trust-based system where everyone benefits. The club sits in the middle, ensuring quality on both sides.</p>',
       4320,
       'See How It Works',
       '/pricing'),
      (cid, 3,
       'Ready to get started?',
       '<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">We''re opening up access and would love to have you on the platform.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Sign up takes under two minutes. Once you''re in, you can browse available water, find a club, and book your first trip.</p><p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">Questions? Reply to this email. Dan reads every one.</p>',
       10080,
       'Create Your Account',
       '/signup')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
