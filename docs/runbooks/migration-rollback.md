# Migration Rollback Runbook

When a Supabase migration causes a production incident, you have three tiers of response. Pick the **lowest** tier that solves the problem.

---

## Tier 1 — Feature flag the caller (preferred, 60 seconds)

If the migration itself is fine but a **new code path that depends on it** is broken, disable that code path via the feature flags system.

1. Open `/admin/feature-flags`.
2. Find the flag covering the affected surface (e.g. `bookings.create`, `stripe.payout`, `guide.verification_submit`).
3. Toggle off. Confirm the dialog.
4. Within ~20 seconds, every Lambda instance clears its cache and starts returning 503 for that surface.
5. Post an incident on `/admin/incidents` so `/status` reflects reality.

**Do not skip this step.** Killing the code path is always safer and faster than touching the database. A migration can almost always "sit" disabled while you investigate.

---

## Tier 2 — Forward-only fix migration (recommended when schema is at fault)

Postgres migrations should be **forward-only**. Rolling back a migration that already ran in production risks data loss and leaves the migration history inconsistent with reality.

Instead, **write a new migration that undoes the damage**.

1. Reproduce the problem locally against a clone of production: `supabase db dump --local > /tmp/dump.sql` from a staging clone if possible.
2. Write a new migration file: `supabase/migrations/NNNNN_revert_<description>.sql`.
3. Guard every statement with `IF EXISTS` / `IF NOT EXISTS` — rollbacks must be idempotent.
4. Test locally: `supabase db reset` then run the new migration.
5. Apply to production: `supabase db push`.
6. Regenerate types: `supabase gen types typescript --linked > src/types/supabase.ts`.
7. Commit, deploy, verify on `/status`.

### Common reversal patterns

| What the bad migration did | Forward-only reversal |
|---|---|
| `ADD COLUMN foo text NOT NULL DEFAULT 'x'` | `ALTER TABLE t ALTER COLUMN foo DROP NOT NULL;` (don't drop unless no reads) |
| `CREATE INDEX CONCURRENTLY` that's slow | `DROP INDEX CONCURRENTLY` |
| `ADD CONSTRAINT ... CHECK(...)` rejecting rows | `ALTER TABLE t DROP CONSTRAINT ...` |
| New RLS policy that locks users out | `DROP POLICY ...` |
| New trigger firing on every insert | `DROP TRIGGER ...` |
| `DROP COLUMN` (disaster) | See Tier 3 — you need the backup |

---

## Tier 3 — Point-in-time recovery (last resort, hours of downtime)

Only use this when:
- Data has been **destroyed** (not just schema) — e.g. a bad `DELETE` or `DROP COLUMN` that removed values.
- Tier 2 can't rebuild the lost data from transaction logs or application records.

Supabase offers point-in-time recovery on Pro plans. This restores the entire project to a timestamp — **any writes since that timestamp are lost**.

### Process

1. Declare a full outage on `/status` immediately. Users will lose the last ~N minutes of bookings, payments, messages.
2. Supabase Dashboard → Database → Backups → Point-in-time recovery.
3. Pick a timestamp **before** the destructive migration ran.
4. Confirm. The project is unavailable during restore (typically 10–60 minutes).
5. After restore completes, the migration history table may be out of sync with the `supabase/migrations/` directory — reconcile by:
   - Check `select * from supabase_migrations.schema_migrations` — this is the source of truth.
   - Remove any migration files that ran after the restore point so `supabase db push` doesn't try to re-run them.
   - Write a forward-only migration to add back only the **schema** changes (not the destructive data change).
6. Validate payments reconciliation: Stripe events from the lost window may need manual replay. See `docs/runbooks/stripe-reconciliation.md` (TODO).

---

## Pre-flight checklist before applying any migration to production

Run these before every `supabase db push` to production:

- [ ] Migration is idempotent (`IF EXISTS` / `IF NOT EXISTS` guards on every statement).
- [ ] No `DROP COLUMN` or `DROP TABLE` — if you must drop, do it in a separate migration **after** verifying the column/table is unreferenced for ≥24h in production.
- [ ] No `NOT NULL` added without a `DEFAULT` that makes sense for existing rows.
- [ ] New RLS policies tested against both authenticated and service-role paths.
- [ ] Indexes on large tables use `CREATE INDEX CONCURRENTLY`.
- [ ] Ran locally against a fresh `supabase db reset` — migration fully succeeds from zero.
- [ ] Regenerated types and typecheck passes.
- [ ] The **calling code** is either already deployed or gated behind a feature flag that is currently OFF — never ship code + migration in the same deploy. Run the migration first, verify, then enable the flag.
- [ ] Deploy window: avoid peak traffic (Saturday 7–10 AM ET for fishing use cases).

---

## Contacts

- **Supabase support** (paid tier): dashboard → Support — 24h response on Pro, near-realtime on Team.
- **Stripe support** (for reconciliation after data loss): https://support.stripe.com.
- **On-call rotation**: see `docs/runbooks/on-call.md`.
