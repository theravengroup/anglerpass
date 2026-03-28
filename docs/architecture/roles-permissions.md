# Roles & Permissions Model

## Overview

AnglerPass uses a role-based access control system backed by Supabase Row Level Security (RLS). Roles are stored on the `profiles` table and checked in every RLS policy.

---

## Roles

| Role         | Description                                                        |
|--------------|--------------------------------------------------------------------|
| `landowner`  | Owns or manages fishing properties. Creates listings, sets rules, manages bookings. |
| `club_admin` | Runs a fishing club. Manages membership tiers, member access, club properties. |
| `angler`     | Books fishing days, joins clubs, writes reviews. Default role on signup. |
| `admin`      | Platform operator. Full read/write across all entities. Moderation, user management, payouts. |

## Multi-Role Support

A single user can hold multiple roles. The `profiles.role` field currently stores one role, but Layer 2 will migrate to a `user_roles` join table:

```
user_roles
  user_id   uuid FK -> profiles.id
  role      text
  granted_at timestamptz
  PK (user_id, role)
```

Common multi-role combinations:
- **Landowner + Angler**: A property owner who also books fishing days on other properties.
- **Club Admin + Landowner**: A club that owns the water it manages.
- **Admin + Angler**: Platform staff who also use the product.

Until the `user_roles` table ships, the app checks `profiles.role` for the primary role and uses a `secondary_roles` jsonb column as a stopgap.

---

## Permission Matrix

| Action                              | Angler | Landowner | Club Admin | Admin |
|-------------------------------------|--------|-----------|------------|-------|
| **Properties**                      |        |           |            |       |
| View published listings             | Yes    | Yes       | Yes        | Yes   |
| Create property                     | No     | Yes       | Yes        | Yes   |
| Edit own property                   | No     | Yes       | Yes        | Yes   |
| Delete (archive) own property       | No     | Yes       | Yes        | Yes   |
| Edit any property                   | No     | No        | No         | Yes   |
| Change property status              | No     | No        | No         | Yes   |
| **Bookings**                        |        |           |            |       |
| Request a booking                   | Yes    | Yes*      | Yes*       | Yes   |
| View own bookings                   | Yes    | Yes       | Yes        | Yes   |
| View bookings on own property       | No     | Yes       | Yes        | Yes   |
| Confirm/decline booking             | No     | Yes       | Yes        | Yes   |
| Cancel own booking                  | Yes    | Yes       | Yes        | Yes   |
| View all bookings                   | No     | No        | No         | Yes   |
| **Memberships & Clubs**             |        |           |            |       |
| Join a club                         | Yes    | Yes       | No         | Yes   |
| Create membership tier              | No     | No        | Yes        | Yes   |
| Manage club members                 | No     | No        | Yes        | Yes   |
| View club roster                    | No     | No        | Yes        | Yes   |
| **Reviews**                         |        |           |            |       |
| Write review (after booking)        | Yes    | No        | No         | No    |
| Moderate reviews                    | No     | No        | No         | Yes   |
| **Payments**                        |        |           |            |       |
| View own payment history            | Yes    | Yes       | Yes        | Yes   |
| View payouts for own properties     | No     | Yes       | Yes        | Yes   |
| Issue refunds                       | No     | No        | No         | Yes   |
| View all payments                   | No     | No        | No         | Yes   |
| **Documents**                       |        |           |            |       |
| Sign documents                      | Yes    | Yes       | Yes        | Yes   |
| Upload property documents           | No     | Yes       | Yes        | Yes   |
| Upload club documents               | No     | No        | Yes        | Yes   |
| **Users & Platform**                |        |           |            |       |
| Edit own profile                    | Yes    | Yes       | Yes        | Yes   |
| View any profile                    | No     | No        | No         | Yes   |
| Assign roles                        | No     | No        | No         | Yes   |
| Access admin console                | No     | No        | No         | Yes   |
| Access moderation queue             | No     | No        | No         | Yes   |
| View leads                          | No     | No        | No         | Yes   |

*Landowners and club admins can book on other landowners' properties when they also hold the angler role.

---

## RLS Policy Approach

### Pattern: Row Ownership

Most policies follow a row-ownership pattern:

```sql
-- Users can read their own rows
create policy "Users read own bookings"
  on bookings for select
  using (auth.uid() = angler_id);

-- Property owners can read bookings on their properties
create policy "Owners read property bookings"
  on bookings for select
  using (
    property_id in (
      select id from properties where owner_id = auth.uid()
    )
  );
```

### Pattern: Role Check

For role-gated operations, policies check `profiles.role`:

```sql
create policy "Only landowners create properties"
  on properties for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('landowner', 'club_admin', 'admin')
    )
  );
```

### Pattern: Admin Override

Admin users bypass ownership checks. Every SELECT policy includes an admin clause:

```sql
create policy "Admin reads all properties"
  on properties for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
```

For write operations, admin override policies are separate to keep the intent clear:

```sql
create policy "Admin can update any property"
  on properties for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (true);
```

### Pattern: Status-Based Visibility

Published properties are visible to all authenticated users. Draft and pending properties are visible only to the owner and admins:

```sql
create policy "Anyone can read published properties"
  on properties for select
  using (status = 'published');

create policy "Owners read own drafts"
  on properties for select
  using (owner_id = auth.uid());
```

---

## Future: Sub-Roles Within Clubs

When clubs grow, a single `club_admin` role is insufficient. Layer 3 will introduce club-scoped roles:

| Club Role | Permissions                                          |
|-----------|------------------------------------------------------|
| owner     | Full control, billing, delete club                   |
| manager   | Manage members, manage bookings, edit properties     |
| member    | View club properties, book member-only windows       |

These will be stored on the `club_memberships` table as a `club_role` column, not on `profiles`. This keeps platform roles and club roles independent.

---

## Implementation Notes

- **Service-role bypass**: Server-side operations (webhook handlers, cron jobs) use the Supabase service-role key, which bypasses RLS entirely. These operations must enforce their own authorization checks in application code.
- **No anonymous access**: All RLS policies assume an authenticated user (`auth.uid()` is non-null). Public-facing pages (marketing, property search) use server components that fetch via service-role with explicit filtering.
- **Policy naming convention**: `"{Role} {verb} {scope} {entity}"` -- e.g., `"Admin reads all bookings"`, `"Owners update own properties"`.
