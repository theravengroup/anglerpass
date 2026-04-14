# On-Call Rotation

**Before launch.** Whoever is reading this is probably going to be on-call solo for the first weeks. That's fine — this doc is what to do when something breaks.

---

## Escalation sources (where alerts come from)

| Source | What it catches | Where it goes |
|---|---|---|
| Sentry | User-hit errors (500s, JS crashes, stack traces) | Sentry email / Slack `#alerts` |
| GitHub Actions `prod-smoke` | Public surface regressions (every 5 min) | GitHub email + Slack `#alerts` if `SLACK_WEBHOOK_URL` is set |
| `/api/health` returning 503 | DB unreachable or Stripe circuit open | Synthetic monitor catches it |
| Customer email → support@anglerpass.com | Everything else | Forwarded to on-call |
| Stripe dashboard alerts | Payout failures, unusual activity | Stripe email |
| Supabase project alerts | DB CPU / storage / connection limits | Supabase email |

**Configure these before launch.** An alert nobody sees is worse than no alert — it creates false confidence.

---

## On-call responsibilities

1. **Acknowledge within 10 minutes** (business hours) or **within 30 minutes** (after-hours).
2. **Post to `/admin/incidents`** if the issue affects users. The `/status` page updates instantly.
3. **Triage to severity**:
   - **Critical** (Sev 1): payments broken, data loss, site fully down. Engage all hands.
   - **Major** (Sev 2): a user role can't use the product (e.g. guides can't submit availability). Work immediately.
   - **Minor** (Sev 3): cosmetic, non-blocking, or affects <1% of traffic. Fix next business day.
4. **Containment first, diagnosis second.** Every minute spent debugging is a minute users are broken. Use feature flags to stop the bleed, THEN root-cause.
5. **Write a postmortem** within 48h of any Sev 1 or Sev 2 (template in `docs/runbooks/postmortem-template.md`).

---

## First 5 minutes of an incident

This is the sequence regardless of what's wrong:

1. **Check `/api/health`** in a browser. If it's 503, the report tells you which dependency is down.
2. **Check Sentry issues** filtered to the last 15 minutes. Look for a new issue with high event count.
3. **Check the deploy log** — was a deploy made in the last hour? If yes, the release is the #1 suspect. Revert in Vercel dashboard (instant).
4. **Check upstream status pages**:
   - Supabase: https://status.supabase.com
   - Stripe: https://status.stripe.com
   - Vercel: https://www.vercel-status.com
5. **If you can't diagnose in 5 minutes, engage containment**:
   - For a broken surface → kill-switch flag at `/admin/feature-flags`.
   - For a broken recent deploy → Vercel revert (takes ~30s).
   - For a payment issue → the Stripe circuit breaker may already be protecting you; post `/admin/incidents` to communicate.

---

## Common scenarios

### Stripe is slow or down

- Circuit breaker should trip automatically after 5 failures in 60s → 30s of clean 503s.
- If it's sustained, disable `stripe.payout`, `stripe.membership_checkout`, `stripe.guide_verification`, `stripe.compass_credits` via feature flags.
- Post incident: "Payments temporarily unavailable. Bookings can still be saved; we'll complete payment once Stripe recovers."

### Supabase DB is degraded

- Check Supabase dashboard → Database → Performance. Look for `CPU %` or `connection count` spike.
- Most common cause: runaway query from a new release. Revert the deploy.
- If it's sustained: email Supabase support. Cannot be feature-flagged away — the app depends on DB.

### A specific user reports a bug that nobody else hits

- Pull their user ID from Supabase auth and search Sentry — we tag every client error with user ID.
- Check `/admin/audit-log` for anything unusual on their account.
- If reproducible: capture it locally first, then fix forward.

### We got mass signup abuse / scraping

- Rate limiter is per-Lambda-instance, so a wide attack can still leak through.
- Check Vercel logs for high-frequency IPs. Add them to Vercel's firewall rules (Project → Settings → Firewall).
- If abuse is authenticated (e.g. compromised account): disable the account via Supabase auth admin.

### A migration caused problems

- See `docs/runbooks/migration-rollback.md`.

---

## Weekly hygiene (20 minutes, every Monday)

- Review Sentry issues from the past week. Ignore / resolve stale ones. Assign owners for new ones.
- Review prod-smoke failures (GitHub Actions tab → Actions → Production smoke). Any false-positive flakes? Tune the test.
- Spot-check `/api/health`. Spot-check `/status`.
- Review Supabase DB size and connection count.
- Review Stripe dashboard for unusual payout patterns.

---

## What NOT to do

- **Don't deploy a fix at 3am without a second pair of eyes** unless it's a one-line revert.
- **Don't hot-patch the DB** — always go through a migration file.
- **Don't bypass the circuit breaker** by adding retries or try/catch-swallows to make it "work". The breaker is protecting you.
- **Don't delete Sentry issues** you don't understand. Resolve them as "wontfix" with a comment, so when the same exception shows up in 3 months you have context.
