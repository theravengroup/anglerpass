# ADR 003: Supabase as Backend

## Status

Accepted

## Context

AnglerPass needs a backend stack that provides:

- PostgreSQL database with relational schema support (properties, bookings, memberships have complex relationships)
- Row Level Security for multi-tenant data isolation (anglers should not see other anglers' bookings)
- Authentication with email/password, magic link, and social login
- File storage for property photos, documents, and signatures
- Real-time subscriptions for in-app notifications
- API layer that Next.js server components can call directly

The contenders:

1. **Supabase** (hosted PostgreSQL, Auth, Storage, Realtime, Edge Functions)
2. **Firebase** (Firestore, Auth, Cloud Storage, Cloud Functions)
3. **Custom backend** (Express/Fastify + Prisma + self-managed PostgreSQL)
4. **Prisma + PlanetScale** (ORM + serverless MySQL)

## Decision

We chose **Supabase** as the primary backend.

### Why Supabase

- **PostgreSQL, not a document store.** AnglerPass has deeply relational data: properties have many bookings, bookings belong to anglers and properties, memberships link anglers to clubs which link to properties. PostgreSQL's joins, constraints, and foreign keys enforce data integrity at the database level. Firestore would require denormalization and client-side joins.

- **Row Level Security is built in.** RLS policies on every table mean that even if application code has a bug, the database enforces that users can only access their own data. This is critical for a marketplace where landowners, anglers, and clubs share the same database. Firebase Security Rules provide similar protection for Firestore but are less expressive than SQL-based RLS.

- **Auth integrates with RLS.** Supabase Auth sets `auth.uid()` in the PostgreSQL session, which RLS policies reference directly. No middleware translation layer is needed. The `@supabase/ssr` package handles cookie-based session management in Next.js middleware.

- **Supabase Storage for documents and media.** Property photos, liability waivers, and signature images need authenticated access control. Supabase Storage uses the same RLS-style policies, keeping authorization logic in one place.

- **Realtime for notifications.** Supabase Realtime provides PostgreSQL change subscriptions. The in-app notification system subscribes to inserts on the `notifications` table filtered by `user_id`. No additional WebSocket infrastructure is needed.

- **Migration-based schema management.** Supabase CLI supports SQL migration files (`supabase/migrations/`), which are version-controlled and applied in order. This fits our preference for explicit, reviewable schema changes over auto-generated migrations.

- **Generous free tier and predictable pricing.** For a pre-revenue startup, Supabase's free tier covers development and early users. Scaling pricing is based on database size and API calls, not per-seat.

### Why not Firebase

- Firestore is a document database. Modeling the AnglerPass schema (properties with availability windows, bookings with payment references, club memberships with tier relationships) in a document store would require significant denormalization, redundant writes, and client-side aggregation.
- Firebase Auth is excellent, but Supabase Auth provides the same features with the advantage of tight PostgreSQL integration.
- Cloud Functions cold starts add latency to API calls. Supabase Edge Functions (Deno-based) have faster cold starts, though we primarily use Next.js API routes instead.
- Vendor lock-in: migrating off Firestore requires rewriting all data access code. Migrating off Supabase means exporting a PostgreSQL dump and pointing at any other Postgres host.

### Why not custom backend (Express + Prisma)

- Building auth, file storage, real-time subscriptions, and API middleware from scratch adds months of development time with no product differentiation.
- Prisma is a good ORM but adds a layer of abstraction over PostgreSQL that can hide RLS behavior. Supabase's JS client works directly with RLS policies.
- Self-managed PostgreSQL on AWS/Railway/Render requires DevOps time for backups, connection pooling, and monitoring. Supabase handles this.
- We can always eject: Supabase is PostgreSQL. If we outgrow Supabase's managed offering, we migrate the database to any PostgreSQL host and swap the client for Prisma or raw SQL.

### Why not PlanetScale

- PlanetScale uses MySQL (Vitess), not PostgreSQL. PostgreSQL has better support for `jsonb`, `uuid` types, advisory locks (needed for booking conflict resolution), and row-level security.
- PlanetScale does not support foreign key constraints at the database level (they enforce at the application level via Prisma). For a marketplace handling payments, database-level referential integrity is non-negotiable.
- PlanetScale has since changed its free tier and pricing model, making it less attractive for early-stage projects.

## Consequences

### Positive

- Single platform for database, auth, storage, and realtime. Fewer services to manage and fewer bills to track.
- RLS provides defense-in-depth security without relying solely on application code.
- SQL migrations are version-controlled and reviewable in PRs.
- PostgreSQL is the industry standard. Hiring developers who know PostgreSQL is easy. If we need to bring on a DBA, they will be familiar with the stack.
- Supabase has a strong open-source community and self-hosting option if we ever need it.

### Negative

- Supabase's JS client abstracts some PostgreSQL features. Complex queries sometimes require raw SQL via `rpc()` calls to PostgreSQL functions.
- RLS policies are powerful but can be hard to debug. A missing policy silently returns empty results rather than throwing an error. Testing requires checking both the policy and the query.
- Supabase Edge Functions are Deno-based, not Node.js. We avoid them for now and use Next.js API routes for server-side logic instead.
- Connection pooling (via Supavisor) has occasional timeout issues under load. Mitigated by using the `@supabase/ssr` server client which creates per-request connections.

### Exit Strategy

If we need to leave Supabase:
1. Export the PostgreSQL database via `pg_dump`.
2. Import into any PostgreSQL host (AWS RDS, Neon, self-hosted).
3. Replace `@supabase/supabase-js` calls with Prisma or `pg` client.
4. Migrate auth to a standalone provider (Auth0, Clerk, or self-hosted).
5. Move storage to S3 or Cloudflare R2.

The data model and RLS policies are portable PostgreSQL -- they work on any PostgreSQL instance.
