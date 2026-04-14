# Soft-Launch Checklist

Launching wide without first shaking things out with a small group is how products die in their first week. The soft launch exists to surface bugs that only appear at scale, with people you can apologize to in person.

**Target audience**: 50–100 users you personally know, across all five roles (landowner, club admin, angler, guide, corporate). Friends, beta testers, fishing community contacts. People who will reply to your text when something breaks.

**Duration**: 2 weeks minimum. 4 weeks ideal. Do not extend indefinitely — the goal is to find and fix the critical issues, not reach perfection.

---

## Pre-launch blockers (must be done)

### Infrastructure
- [ ] Sentry `SENTRY_AUTH_TOKEN` set in Vercel → source maps upload on deploy.
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set.
- [ ] GitHub Actions `prod-smoke` workflow is green.
- [ ] `SLACK_WEBHOOK_URL` configured (optional but recommended).
- [ ] Stripe is in **live mode** with real keys in Vercel env.
- [ ] Resend domain verified and DKIM/SPF passing.
- [ ] Checkr account is in live (not sandbox) mode.
- [ ] Supabase project on Pro tier (backup + PITR access).
- [ ] Vercel project on Pro tier (team support + higher limits).

### Verification
- [ ] Run `/api/health` in production browser — returns 200.
- [ ] Visit `/status` as unauthenticated user — shows "All systems operational".
- [ ] `/admin/feature-flags` loads and one flag toggle works (flip it, flip it back).
- [ ] `/admin/incidents` loads. Post a test incident titled "test, ignore". Verify it appears on `/status`. Mark resolved. Delete (or leave as historical test).
- [ ] Make one real booking with a real card — verify Stripe PaymentIntent created, webhook received, email delivered.
- [ ] Trigger one guide verification flow — verify Checkr webhook lands.
- [ ] Click an email campaign unsubscribe link — verify it lands on the public page and records in `email_suppression_list`.

### Documentation
- [ ] `docs/runbooks/on-call.md` skimmed by whoever is on call.
- [ ] `docs/runbooks/migration-rollback.md` skimmed.
- [ ] `docs/runbooks/comms-playbook.md` bookmarked.
- [ ] Support inbox (support@anglerpass.com) is forwarding to a real human.

---

## Launch day

1. Post a small, not-too-formal heads-up to the first cohort. Invite-only link. No social, no press, no homepage change.
2. Set a timer for 2 hours. Spot-check `/status`, Sentry, and Vercel analytics every 30 minutes.
3. End-of-day: review Sentry. Triage anything with >3 events as P0 for tomorrow.

---

## Week 1 daily rituals

Every morning:
- [ ] Check `/status` is operational.
- [ ] Sentry: any new issues? Any spike on existing ones?
- [ ] GitHub Actions: prod-smoke failures overnight?
- [ ] Stripe dashboard: any failed payments, disputes, payouts?
- [ ] Supabase dashboard: DB CPU, connection count, storage.
- [ ] Support inbox: any unanswered threads?

Every evening:
- [ ] Scan the top 3 active user stories — did they break today?
- [ ] Text/call 2 soft-launch users for unfiltered feedback.

---

## Week 1 success criteria (to graduate to week 2)

- [ ] Zero Sev 1 incidents lasting > 15 min.
- [ ] Zero data-loss events.
- [ ] < 5 Sentry issues with > 10 events.
- [ ] All five roles have completed their primary workflow at least once.
- [ ] At least one real booking completed end-to-end with payment + guide assignment + reminder emails.

If any of these fail, **do not open more invites**. Fix first.

---

## Week 2–4 milestones

### Week 2
- Double the user count (to ~100–200).
- Add the first 3 paying clubs.
- Run the first club-sponsored event end-to-end.

### Week 3
- Invite the broader waitlist (all 500+ leads).
- Turn on marketing traffic (paid ads or organic launch).

### Week 4
- Evaluate: are we stable at 2x week 1 load? If yes, graduate to public launch.
- If no, stay in soft launch. Better a longer beta than a crashed launch.

---

## Wide-launch gates (before removing the soft-launch cap)

All must be true:
- [ ] No Sev 1 in the last 14 days.
- [ ] < 1% of requests returning 5xx (check Vercel analytics).
- [ ] p95 page load < 3s for homepage + dashboard.
- [ ] Feature flags have been used to mitigate at least one incident (proves they work under pressure).
- [ ] Observability has been used to diagnose at least one real issue (proves Sentry wiring works).
- [ ] Stripe circuit breaker has either tripped in anger or been exercised in a game-day drill.
- [ ] At least one migration has been applied to production without incident.
- [ ] Support inbox volume is manageable by the current team (< 10 tickets/day/person).
- [ ] On-call rotation is set up with at least two people.

---

## What to defer until after soft launch

These things are real, but they'll drown you if you try to do them before you have users:

- Native mobile apps
- Advanced search/discovery features
- Marketplace-style guide ratings
- Multi-language support
- Public API for partners
- White-label club branding
- Advanced analytics dashboards

---

## What to build DURING soft launch (informed by real feedback)

- Fix the top 5 friction points users complain about.
- Add whichever missing feature you're hearing about from more than 3 users.
- Improve the onboarding flow based on where users actually drop off (Vercel analytics + session replays in Sentry).
- Harden the 2–3 most-used surfaces (faster, more forgiving error messages, better empty states).
